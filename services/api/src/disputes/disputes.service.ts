import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { BookingsService } from '../bookings/bookings.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { DisputeStatus } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import { Paginated } from '../common/pagination';
import { Payment } from '../payments/payment.entity';
import { PaymentsService } from '../payments/payments.service';
import { Dispute } from './dispute.entity';
import { assertCanOpenDispute, resolutionRefundPercent } from './dispute.rules';
import { DisputeListQuery, OpenDisputeDto, ResolveDisputeDto } from './dto';

@Injectable()
export class DisputesService {
  constructor(
    private readonly db: DataSource,
    private readonly config: ConfigService,
    private readonly bookings: BookingsService,
    private readonly payments: PaymentsService,
  ) {}

  async open(user: AuthUser, bookingId: string, dto: OpenDisputeDto) {
    const actor = await this.bookings.actor(user);
    return this.db.transaction(async (tx) => {
      const booking = await tx.getRepository(Booking).findOne({ where: { id: bookingId }, lock: { mode: 'pessimistic_write' } });
      if (!booking) throw new NotFoundException('Booking not found');
      const payment = await tx.getRepository(Payment).findOneBy({ bookingId });
      const hasOpenDispute = await tx.getRepository(Dispute).existsBy({ bookingId, status: DisputeStatus.OPEN });

      assertCanOpenDispute({
        booking,
        actor,
        escrowStatus: payment?.escrowStatus ?? null,
        hasOpenDispute,
        now: new Date(),
        windowDays: this.config.get<number>('marketplace.disputeWindowDays')!,
      });

      const dispute = await tx.getRepository(Dispute).save(
        tx.getRepository(Dispute).create({ bookingId, openedById: user.id, reason: dto.reason, description: dto.description }),
      );
      await this.payments.freeze(bookingId, tx);
      return dispute;
    });
  }

  async mine(user: AuthUser) {
    const actor = await this.bookings.actor(user);
    const qb = this.db
      .getRepository(Dispute)
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.booking', 'b')
      .where('b.touristId = :uid', { uid: user.id })
      .orderBy('d.createdAt', 'DESC');
    if (actor.guideId) qb.orWhere('b.guideId = :gid', { gid: actor.guideId });
    return qb.getMany();
  }

  async list(q: DisputeListQuery): Promise<Paginated<Dispute>> {
    const [items, total] = await this.db.getRepository(Dispute).findAndCount({
      where: q.status ? { status: q.status } : {},
      relations: { booking: { payment: true, tourist: true, guide: { user: true }, package: true } },
      order: { createdAt: 'ASC' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });
    return { items, total, page: q.page, limit: q.limit };
  }

  async detail(id: string) {
    const dispute = await this.db.getRepository(Dispute).findOne({
      where: { id },
      relations: { booking: { payment: true, tourist: true, guide: { user: true }, package: { city: true } } },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  async resolve(adminId: string, id: string, dto: ResolveDisputeDto) {
    const dispute = await this.db.getRepository(Dispute).findOne({ where: { id }, relations: { booking: true } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status !== DisputeStatus.OPEN) {
      throw new DomainError('DISPUTE_CLOSED', 'Dispute is already resolved', 'conflict');
    }
    const refundPercent = resolutionRefundPercent(dto.resolution, dto.refundPercent);
    await this.payments.settle(dispute.booking, refundPercent, `Dispute ${id}: ${dto.resolution}`);
    await this.db.getRepository(Dispute).update(
      { id },
      {
        status: DisputeStatus.RESOLVED,
        resolution: dto.resolution,
        refundPercent: dto.refundPercent ?? null,
        resolvedById: adminId,
        resolvedAt: new Date(),
        resolutionNote: dto.note ?? null,
      },
    );
    return this.db.getRepository(Dispute).findOne({ where: { id }, relations: { booking: { payment: true } } });
  }
}
