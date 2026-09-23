import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { DisputeResolution, DisputeStatus } from '../common/enums';
import { PaginationQuery } from '../common/pagination';

export const DISPUTE_REASONS = ['NO_SHOW', 'NOT_AS_DESCRIBED', 'SAFETY', 'UNPROFESSIONAL', 'BILLING', 'OTHER'] as const;

export class OpenDisputeDto {
  @ApiProperty({ enum: DISPUTE_REASONS }) @IsIn(DISPUTE_REASONS)
  reason: (typeof DISPUTE_REASONS)[number];

  @ApiProperty() @IsString() @Length(10, 4000)
  description: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: DisputeResolution }) @IsEnum(DisputeResolution)
  resolution: DisputeResolution;

  @ApiPropertyOptional({ description: 'Required for PARTIAL_REFUND (1-99)' })
  @IsOptional() @IsInt() @Min(1) @Max(99)
  refundPercent?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  note?: string;
}

export class DisputeListQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: DisputeStatus }) @IsOptional() @IsEnum(DisputeStatus)
  status?: DisputeStatus;
}
