import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Guide } from '../guides/guide.entity';

/** A recurring weekly window in the tour city's local time. */
@Entity('guide_weekly_hours')
@Check('"weekday" BETWEEN 0 AND 6')
@Check('"startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute"')
export class GuideWeeklyHours {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  guideId: string;

  @ManyToOne('Guide', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guideId' })
  guide: Guide;

  /** 0 = Sunday … 6 = Saturday */
  @Column({ type: 'smallint' })
  weekday: number;

  @Column({ type: 'smallint' })
  startMinute: number;

  @Column({ type: 'smallint' })
  endMinute: number;
}

/** Days the guide isn't working (inclusive local dates). */
@Entity('guide_time_off')
@Check('"endDate" >= "startDate"')
export class GuideTimeOff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  guideId: string;

  @ManyToOne('Guide', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guideId' })
  guide: Guide;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
