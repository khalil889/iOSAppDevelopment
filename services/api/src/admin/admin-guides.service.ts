import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GuideVerificationStatus } from '../common/enums';
import { Paginated } from '../common/pagination';
import { GuideVerificationEvent } from '../guides/guide-verification-event.entity';
import { assertCanApprove, assertCanReject, assertCanSuspend } from '../guides/guide-verification.rules';
import { Guide } from '../guides/guide.entity';
import { VerificationQueueQuery } from './dto';

@Injectable()
export class AdminGuidesService {
  constructor(private readonly db: DataSource) {}

  private get guides() {
    return this.db.getRepository(Guide);
  }

  /** Oldest submissions first so nobody waits indefinitely. */
  async queue(q: VerificationQueueQuery): Promise<Paginated<Guide>> {
    const [items, total] = await this.guides.findAndCount({
      where: { verificationStatus: q.status },
      relations: { user: true, licenseCountry: true, cities: true },
      order: { submittedAt: { direction: 'ASC', nulls: 'LAST' }, createdAt: 'ASC' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });
    return { items, total, page: q.page, limit: q.limit };
  }

  async counts() {
    const rows: Array<{ status: GuideVerificationStatus; count: string }> = await this.guides
      .createQueryBuilder('g')
      .select('g.verificationStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('g.verificationStatus')
      .getRawMany();
    return Object.fromEntries(
      Object.values(GuideVerificationStatus).map((s) => [s, Number(rows.find((r) => r.status === s)?.count ?? 0)]),
    );
  }

  async detail(id: string) {
    const guide = await this.guides.findOne({
      where: { id },
      relations: { user: true, licenseCountry: true, cities: { country: true }, sites: true },
    });
    if (!guide) throw new NotFoundException('Guide not found');
    const history = await this.db
      .getRepository(GuideVerificationEvent)
      .find({ where: { guideId: id }, order: { createdAt: 'DESC' } });
    return { ...guide, history };
  }

  async approve(adminId: string, id: string, note?: string) {
    const guide = await this.load(id);
    assertCanApprove(guide, new Date());
    return this.transition(guide, GuideVerificationStatus.APPROVED, adminId, note ?? null, {
      verifiedAt: new Date(),
      verifiedById: adminId,
      rejectionReason: null,
    });
  }

  async reject(adminId: string, id: string, reason: string) {
    const guide = await this.load(id);
    assertCanReject(guide.verificationStatus, reason);
    return this.transition(guide, GuideVerificationStatus.REJECTED, adminId, reason.trim(), {
      rejectionReason: reason.trim(),
      verifiedAt: null,
      verifiedById: adminId,
    });
  }

  async suspend(adminId: string, id: string, reason: string) {
    const guide = await this.load(id);
    assertCanSuspend(guide.verificationStatus, reason);
    return this.transition(guide, GuideVerificationStatus.SUSPENDED, adminId, reason.trim(), {
      rejectionReason: reason.trim(),
    });
  }

  private async load(id: string) {
    const guide = await this.guides.findOneBy({ id });
    if (!guide) throw new NotFoundException('Guide not found');
    return guide;
  }

  private async transition(
    guide: Guide,
    to: GuideVerificationStatus,
    adminId: string,
    note: string | null,
    fields: Pick<Partial<Guide>, 'verifiedAt' | 'verifiedById' | 'rejectionReason'>,
  ) {
    await this.db.transaction(async (tx) => {
      // Conditional update guards against two admins deciding at once.
      const res = await tx
        .getRepository(Guide)
        .update({ id: guide.id, verificationStatus: guide.verificationStatus }, { ...fields, verificationStatus: to });
      if (!res.affected) throw new NotFoundException('Guide changed concurrently; reload and try again');
      await tx.getRepository(GuideVerificationEvent).insert({
        guideId: guide.id,
        fromStatus: guide.verificationStatus,
        toStatus: to,
        actorId: adminId,
        note,
      });
    });
    return this.detail(guide.id);
  }
}
