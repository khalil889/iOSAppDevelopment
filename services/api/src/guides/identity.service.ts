import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IdentityStatus } from '../common/enums';
import { currentLang } from '../common/i18n/lang';
import { NotificationType } from '../notifications/notification.entities';
import { NotificationsService } from '../notifications/notifications.service';
import {
  IDENTITY_PROVIDER,
  IdentityOutcome,
  IdentityProvider,
} from '../providers/identity/identity-provider.interface';
import { Guide } from './guide.entity';
import { GuidesService } from './guides.service';

const STATUS: Record<IdentityOutcome['status'], IdentityStatus> = {
  pending: IdentityStatus.PENDING,
  approved: IdentityStatus.APPROVED,
  retry: IdentityStatus.RETRY,
  rejected: IdentityStatus.REJECTED,
  reset: IdentityStatus.NOT_STARTED,
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Guide identity verification (ID + selfie) through the identity provider. */
@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly db: DataSource,
    private readonly guides: GuidesService,
    private readonly notifications: NotificationsService,
    @Inject(IDENTITY_PROVIDER) private readonly provider: IdentityProvider,
  ) {}

  /** Returns a hosted verification link (or the result, for the stub). */
  async start(userId: string) {
    const guide = await this.db.getRepository(Guide).findOneOrFail({
      where: { id: (await this.guides.getByUserId(userId)).id },
      relations: { user: true },
    });
    if (guide.identityStatus === IdentityStatus.APPROVED || guide.identityStatus === IdentityStatus.REJECTED) {
      return { status: guide.identityStatus, url: null };
    }
    const res = await this.provider.start({
      externalUserId: guide.id,
      email: guide.user.email,
      phone: guide.user.phone,
      lang: currentLang(),
    });
    if (res.immediate) {
      await this.apply(guide.id, null, res.immediate);
      return { status: STATUS[res.immediate.status], url: null };
    }
    return { status: guide.identityStatus, url: res.url ?? null };
  }

  async handleWebhook(rawBody: Buffer | undefined, headers: Record<string, string | string[] | undefined>) {
    if (!rawBody || !this.provider.verifyWebhook(rawBody, headers)) throw new UnauthorizedException('Invalid signature');
    const event = this.provider.parseWebhook(rawBody);
    if (!event) throw new BadRequestException('Unrecognised webhook');
    if (!event.outcome || !UUID.test(event.externalUserId)) return { ok: true, ignored: event.type };
    const applied = await this.apply(event.externalUserId, event.applicantId, event.outcome);
    return { ok: true, applied };
  }

  private async apply(guideId: string, applicantId: string | null, outcome: IdentityOutcome): Promise<boolean> {
    const repo = this.db.getRepository(Guide);
    const guide = await repo.findOne({ where: { id: guideId } });
    if (!guide) {
      this.logger.warn(`Identity result for unknown guide ${guideId}`);
      return false;
    }
    const next = STATUS[outcome.status];
    // A late "pending" must not undo a decision; only a reset reopens it.
    const decided = [IdentityStatus.APPROVED, IdentityStatus.REJECTED].includes(guide.identityStatus);
    if (decided && next === IdentityStatus.PENDING) return false;
    await repo.update(
      { id: guideId },
      {
        identityStatus: next,
        identityApplicantId: applicantId ?? guide.identityApplicantId,
        identityCheckedAt: new Date(),
        identityReview: outcome.labels || outcome.comment ? { labels: outcome.labels ?? [], comment: outcome.comment ?? null } : null,
      },
    );
    if (next !== guide.identityStatus) await this.notify(guide.userId, next, outcome.comment ?? null);
    return true;
  }

  private async notify(userId: string, status: IdentityStatus, comment: string | null) {
    if (status === IdentityStatus.APPROVED) {
      await this.notifications.notify({
        userIds: [userId],
        type: NotificationType.IDENTITY_VERIFIED,
        message: (l) =>
          l === 'ar'
            ? { title: 'تم التحقق من هويتك', body: 'اكتمل التحقق من الهوية. سيراجع فريقنا رخصتك الآن.' }
            : { title: 'Identity verified', body: 'Your identity check is complete. Our team will now review your license.' },
        data: { screen: 'dashboard' },
      });
    } else if (status === IdentityStatus.RETRY || status === IdentityStatus.REJECTED) {
      const retry = status === IdentityStatus.RETRY;
      await this.notifications.notify({
        userIds: [userId],
        type: NotificationType.IDENTITY_NEEDS_ACTION,
        message: (l) =>
          l === 'ar'
            ? {
                title: retry ? 'التحقق من الهوية يحتاج إلى إعادة' : 'تعذّر التحقق من هويتك',
                body: retry ? `${comment ? comment + ' ' : ''}افتح لوحة التحكم وأعد المحاولة.` : 'تواصل مع الدعم لمزيد من التفاصيل.',
              }
            : {
                title: retry ? 'Identity check needs another try' : 'We could not verify your identity',
                body: retry ? `${comment ? comment + ' ' : ''}Open your dashboard to try again.` : 'Please contact support for details.',
              },
        data: { screen: 'dashboard' },
      });
    }
  }
}
