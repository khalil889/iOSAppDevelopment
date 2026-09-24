import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, IsNull, Not } from 'typeorm';
import { SosAlert } from '../bookings/sos-alert.entity';
import { DomainError } from '../common/errors/domain-error';

export type SosFilter = 'open' | 'acknowledged' | 'all';

@Injectable()
export class AdminSosService {
  constructor(private readonly db: DataSource) {}

  /** Open alerts first, newest first within each group. */
  async list(filter: SosFilter = 'open') {
    const where =
      filter === 'open' ? { acknowledgedAt: IsNull() } : filter === 'acknowledged' ? { acknowledgedAt: Not(IsNull()) } : {};
    const alerts = await this.db.getRepository(SosAlert).find({
      where,
      relations: { booking: { tourist: true, guide: { user: true }, package: { city: true } } },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return alerts.map(present);
  }

  async counts() {
    const repo = this.db.getRepository(SosAlert);
    const [open, acknowledged] = await Promise.all([
      repo.count({ where: { acknowledgedAt: IsNull() } }),
      repo.count({ where: { acknowledgedAt: Not(IsNull()) } }),
    ]);
    return { open, acknowledged };
  }

  async acknowledge(adminId: string, id: string, note?: string) {
    const repo = this.db.getRepository(SosAlert);
    const res = await repo.update(
      { id, acknowledgedAt: IsNull() },
      { acknowledgedAt: new Date(), acknowledgedById: adminId, resolutionNote: note?.trim() || null },
    );
    if (!res.affected) {
      if (!(await repo.existsBy({ id }))) throw new NotFoundException('SOS alert not found');
      throw new DomainError('ALREADY_ACKNOWLEDGED', 'This alert was already acknowledged', 'conflict');
    }
    const alert = await repo.findOneOrFail({
      where: { id },
      relations: { booking: { tourist: true, guide: { user: true }, package: { city: true } } },
    });
    return present(alert);
  }
}

function present(a: SosAlert) {
  const b = a.booking;
  const [lng, lat] = a.location?.coordinates ?? [];
  const raisedByTourist = a.raisedById === b.touristId;
  return {
    id: a.id,
    createdAt: a.createdAt,
    message: a.message,
    location: lat !== undefined ? { lat, lng, mapsUrl: `https://maps.google.com/?q=${lat},${lng}` } : null,
    acknowledgedAt: a.acknowledgedAt,
    acknowledgedById: a.acknowledgedById,
    resolutionNote: a.resolutionNote,
    raisedBy: raisedByTourist ? 'TOURIST' : 'GUIDE',
    booking: {
      id: b.id,
      status: b.status,
      startAt: b.startAt,
      endAt: b.endAt,
      groupSize: b.groupSize,
      packageTitle: b.package?.title,
      city: b.package?.city?.name,
      tourist: { name: b.tourist?.fullName, phone: b.tourist?.phone },
      guide: { name: b.guide?.user?.fullName, phone: b.guide?.user?.phone },
    },
  };
}
