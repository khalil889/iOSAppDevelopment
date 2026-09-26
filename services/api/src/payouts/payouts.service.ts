import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { PayoutStatus } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import { formatTourTime } from '../common/i18n/lang';
import { GuidesService } from '../guides/guides.service';
import { NotificationType } from '../notifications/notification.entities';
import { NotificationsService } from '../notifications/notifications.service';
import { SMS_SENDER, SmsSender } from '../providers/sms/sms-sender.interface';
import { User } from '../users/user.entity';
import { CreatePayoutRunDto, PayoutAccountDto } from './dto';
import { isValidIban, maskIban, normalizeIban } from './iban';
import { formatMinor, payoutCsv } from './payout-csv';
import { Payout, PayoutAccount, PayoutRun } from './payout.entities';
import { SecretBox } from './secret-box';

/** Payments whose guide share was released and not yet in a payout. */
const OWED = `p."releasedMinor" > 0 AND p."releasedAt" IS NOT NULL AND p."payoutId" IS NULL`;
/** New bank details wait this long before money is sent to them (account takeover guard). */
export const ACCOUNT_COOLING_OFF_MS = 24 * 3_600_000;

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);
  private readonly box: SecretBox;

  constructor(
    private readonly db: DataSource,
    private readonly guides: GuidesService,
    private readonly notifications: NotificationsService,
    @Inject(SMS_SENDER) private readonly sms: SmsSender,
    config: ConfigService,
  ) {
    this.box = new SecretBox(config.get<string>('payoutEncKey')!);
  }

  // ---- guide ---------------------------------------------------------------
  async account(userId: string) {
    const guide = await this.guides.getByUserId(userId);
    return this.db.getRepository(PayoutAccount).findOne({ where: { guideId: guide.id } });
  }

  async saveAccount(userId: string, dto: PayoutAccountDto) {
    const guide = await this.guides.getByUserId(userId);
    const iban = normalizeIban(dto.iban);
    if (!isValidIban(iban)) throw new DomainError('INVALID_IBAN', 'Check the IBAN: it is not valid');
    const repo = this.db.getRepository(PayoutAccount);
    const previous = await repo.findOne({ where: { guideId: guide.id } });
    await repo.upsert(
      { guideId: guide.id, holderName: dto.holderName, bankName: dto.bankName ?? null, ibanSealed: this.box.seal(iban, guide.id), ibanMasked: maskIban(iban) },
      ['guideId'],
    );
    const saved = await repo.findOneOrFail({ where: { guideId: guide.id } });
    if (previous) await this.alertAccountChanged(userId, saved.ibanMasked);
    return saved;
  }

  /** Someone with the guide's session could redirect earnings: tell the guide everywhere. */
  private async alertAccountChanged(userId: string, masked: string) {
    const user = await this.db.getRepository(User).findOne({ where: { id: userId } });
    const ar = user?.locale?.startsWith('ar');
    await this.notifications.notify({
      userIds: [userId],
      type: NotificationType.PAYOUT_ACCOUNT_CHANGED,
      message: (l) =>
        l === 'ar'
          ? { title: 'تم تغيير حساب التحويل', body: `أصبح حساب أرباحك ${masked}. إن لم تقم بذلك، تواصل مع الدعم فورًا.` }
          : { title: 'Payout account changed', body: `Your earnings will now go to ${masked}. If this wasn't you, contact support now.` },
      data: { screen: 'earnings' },
    });
    if (user?.phone) {
      const text = ar
        ? `TourGuide: تم تغيير حساب تحويل أرباحك إلى ${masked}. إن لم تقم بذلك تواصل مع الدعم.`
        : `TourGuide: your payout account was changed to ${masked}. Not you? Contact support.`;
      await this.sms.send(user.phone, text).catch((e) => this.logger.error(`Payout-change SMS failed: ${(e as Error).message}`));
    }
  }

  /** Earnings overview for the guide app. */
  async overview(userId: string) {
    const guide = await this.guides.getByUserId(userId);
    const [account, owed, payouts] = await Promise.all([
      this.db.getRepository(PayoutAccount).findOne({ where: { guideId: guide.id } }),
      this.db.query(
        `SELECT p.currency, SUM(p."releasedMinor")::int AS "amountMinor", COUNT(*)::int AS "paymentCount"
           FROM payments p JOIN bookings b ON b.id = p."bookingId"
          WHERE b."guideId" = $1 AND ${OWED}
          GROUP BY p.currency ORDER BY p.currency`,
        [guide.id],
      ),
      this.db.getRepository(Payout).find({ where: { guideId: guide.id }, order: { createdAt: 'DESC' }, take: 50 }),
    ]);
    return { account, owed, payouts: payouts.map(({ settledById: _admin, ...p }) => p) };
  }

  // ---- admin ---------------------------------------------------------------
  /** What is owed, per guide and currency, and whether they can be paid. */
  async owedSummary() {
    return this.db.query(
      `SELECT g.id AS "guideId", u."fullName" AS "guideName", p.currency,
              SUM(p."releasedMinor")::int AS "amountMinor", COUNT(*)::int AS "paymentCount",
              MIN(p."releasedAt") AS "oldestReleasedAt",
              a."ibanMasked", a."holderName"
         FROM payments p
         JOIN bookings b ON b.id = p."bookingId"
         JOIN guides g ON g.id = b."guideId"
         JOIN users u ON u.id = g."userId"
         LEFT JOIN payout_accounts a ON a."guideId" = g.id
        WHERE ${OWED}
        GROUP BY g.id, u."fullName", p.currency, a."ibanMasked", a."holderName"
        ORDER BY p.currency, "amountMinor" DESC`,
    );
  }

  /**
   * Creates a payout for every guide owed money in `currency` who has a
   * payout account, claiming the underlying payments so nothing is paid twice.
   */
  async createRun(adminId: string, dto: CreatePayoutRunDto) {
    return this.db.transaction(async (tx) => {
      // One run at a time: concurrent runs would race for the same payments.
      await tx.query(`SELECT pg_advisory_xact_lock(hashtext('payout-run'))`);
      const owed: Array<{ guideId: string }> = await tx.query(
        `SELECT DISTINCT b."guideId" FROM payments p JOIN bookings b ON b.id = p."bookingId" WHERE ${OWED} AND p.currency = $1`,
        [dto.currency],
      );
      const accounts = await tx
        .getRepository(PayoutAccount)
        .createQueryBuilder('a')
        .addSelect('a.ibanSealed')
        .where('a.guideId IN (:...ids)', { ids: owed.length ? owed.map((o) => o.guideId) : ['00000000-0000-0000-0000-000000000000'] })
        .getMany();
      const coolingSince = new Date(Date.now() - ACCOUNT_COOLING_OFF_MS);
      const payable = accounts.filter((a) => a.updatedAt <= coolingSince);
      const skipped = owed
        .map((o) => o.guideId)
        .filter((id) => !payable.some((a) => a.guideId === id))
        .map((guideId) => ({ guideId, reason: accounts.some((a) => a.guideId === guideId) ? 'ACCOUNT_RECENTLY_CHANGED' : 'NO_ACCOUNT' }));
      const skippedGuideIds = skipped.map((s) => s.guideId);
      if (!payable.length) throw new DomainError('NOTHING_TO_PAY', 'No guide with a payout account is owed money in this currency');

      const run = await tx.getRepository(PayoutRun).save({ currency: dto.currency, createdById: adminId, totalMinor: 0, payoutCount: 0 });
      let total = 0;
      let count = 0;
      for (const a of payable) {
        const payout = await tx.getRepository(Payout).save({
          runId: run.id,
          guideId: a.guideId,
          currency: dto.currency,
          amountMinor: 0,
          paymentCount: 0,
          holderName: a.holderName,
          ibanSealed: a.ibanSealed,
          ibanMasked: a.ibanMasked,
        });
        const claimed = await this.claim(tx, payout.id, a.guideId, dto.currency);
        if (!claimed.count) {
          await tx.getRepository(Payout).delete({ id: payout.id });
          continue;
        }
        await tx.getRepository(Payout).update({ id: payout.id }, { amountMinor: claimed.amount, paymentCount: claimed.count });
        total += claimed.amount;
        count += 1;
      }
      await tx.getRepository(PayoutRun).update({ id: run.id }, { totalMinor: total, payoutCount: count });
      this.logger.log(`Payout run ${run.id}: ${count} payout(s), ${formatMinor(total, dto.currency)} ${dto.currency} by admin ${adminId}`);
      return { run: { ...run, totalMinor: total, payoutCount: count }, skippedGuideIds, skipped };
    });
  }

  private async claim(tx: EntityManager, payoutId: string, guideId: string, currency: string) {
    const [rows] = await tx.query(
      `UPDATE payments p SET "payoutId" = $1
         FROM bookings b
        WHERE b.id = p."bookingId" AND b."guideId" = $2 AND p.currency = $3 AND ${OWED}
        RETURNING p."releasedMinor"`,
      [payoutId, guideId, currency],
    );
    const list = rows as Array<{ releasedMinor: number }>;
    return { count: list.length, amount: list.reduce((n, r) => n + Number(r.releasedMinor), 0) };
  }

  runs() {
    return this.db.getRepository(PayoutRun).find({ order: { createdAt: 'DESC' }, take: 100 });
  }

  async run(id: string) {
    const run = await this.db.getRepository(PayoutRun).findOne({ where: { id } });
    if (!run) throw new NotFoundException('Payout run not found');
    const payouts = await this.db.getRepository(Payout).find({
      where: { runId: id },
      relations: { guide: { user: true } },
      order: { amountMinor: 'DESC' },
    });
    return {
      ...run,
      payouts: payouts.map(({ guide, ...p }) => ({ ...p, guide: { id: guide.id, name: guide.user.fullName, phone: guide.user.phone } })),
    };
  }

  /** Bank bulk-transfer CSV of the run's unpaid payouts (full IBANs: admins only). */
  async exportCsv(adminId: string, id: string) {
    const payouts = await this.db
      .getRepository(Payout)
      .createQueryBuilder('p')
      .addSelect('p.ibanSealed')
      .where('p.runId = :id AND p.status = :s', { id, s: PayoutStatus.PENDING })
      .orderBy('p.amountMinor', 'DESC')
      .getMany();
    if (!payouts.length && !(await this.db.getRepository(PayoutRun).existsBy({ id }))) throw new NotFoundException('Payout run not found');
    await this.db.getRepository(PayoutRun).increment({ id }, 'exportCount', 1);
    await this.db.getRepository(PayoutRun).update({ id }, { lastExportedAt: new Date() });
    this.logger.warn(`Admin ${adminId} exported bank details for payout run ${id} (${payouts.length} rows)`);
    return payoutCsv(
      payouts.map((p) => ({
        id: p.id,
        holderName: p.holderName,
        iban: this.box.open(p.ibanSealed, p.guideId),
        amountMinor: p.amountMinor,
        currency: p.currency,
        reference: `TG-${p.id.slice(0, 8).toUpperCase()}`,
      })),
    );
  }

  async markPaid(adminId: string, id: string, reference: string) {
    if (!(await this.db.getRepository(Payout).existsBy({ id }))) throw new NotFoundException('Payout not found');
    const res = await this.db
      .getRepository(Payout)
      .update({ id, status: PayoutStatus.PENDING }, { status: PayoutStatus.PAID, paidAt: new Date(), note: reference, settledById: adminId });
    if (!res.affected) throw new ConflictException('Only pending payouts can be marked paid');
    const payout = await this.db.getRepository(Payout).findOneOrFail({ where: { id }, relations: { guide: true } });
    const amount = `${formatMinor(payout.amountMinor, payout.currency)} ${payout.currency}`;
    const day = (l: 'en' | 'ar') => formatTourTime(payout.paidAt!, 'Asia/Riyadh', l).split(',')[0];
    await this.notifications.notify({
      userIds: [payout.guide.userId],
      type: NotificationType.PAYOUT_SENT,
      message: (l) =>
        l === 'ar'
          ? { title: 'تم تحويل أرباحك', body: `حوّلنا ${amount} إلى حسابك ${payout.ibanMasked} (${day(l)}).` }
          : { title: 'Payout sent', body: `We sent ${amount} to your account ${payout.ibanMasked} (${day(l)}).` },
      data: { screen: 'earnings' },
    });
    return payout;
  }

  /**
   * The transfer bounced (also after it was marked paid — banks return
   * transfers days later): its payments return to the pool for the next run.
   */
  async markFailed(adminId: string, id: string, reason: string) {
    return this.db.transaction(async (tx) => {
      const current = await tx.getRepository(Payout).findOne({ where: { id } });
      if (!current) throw new NotFoundException('Payout not found');
      const res = await tx
        .getRepository(Payout)
        .update(
          { id, status: current.status === PayoutStatus.PAID ? PayoutStatus.PAID : PayoutStatus.PENDING },
          { status: PayoutStatus.FAILED, note: current.note ? `${reason} (was: ${current.note})` : reason, settledById: adminId },
        );
      if (!res.affected) throw new ConflictException('This payout was already marked failed');
      if (current.status === PayoutStatus.PAID) {
        this.logger.warn(`Admin ${adminId} reversed PAID payout ${id}: ${reason}`);
      }
      await tx.query(`UPDATE payments SET "payoutId" = NULL WHERE "payoutId" = $1`, [id]);
      return tx.getRepository(Payout).findOneOrFail({ where: { id } });
    });
  }
}
