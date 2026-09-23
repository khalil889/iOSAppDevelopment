import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { GuideVerificationStatus } from '../common/enums';
import { PaginationQuery } from '../common/pagination';

export class VerificationQueueQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: GuideVerificationStatus, default: GuideVerificationStatus.PENDING })
  @IsOptional() @IsEnum(GuideVerificationStatus)
  status: GuideVerificationStatus = GuideVerificationStatus.PENDING;
}

export class ApproveGuideDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)
  note?: string;
}

export class RejectGuideDto {
  /** Min length is enforced in guide-verification.rules. */
  @ApiProperty({ example: 'License scan is unreadable, please re-upload.' }) @IsString() @MaxLength(1000)
  reason: string;
}
