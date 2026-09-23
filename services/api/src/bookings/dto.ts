import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { BookingStatus } from '../common/enums';
import { PaginationQuery } from '../common/pagination';

export class CreateBookingDto {
  @ApiProperty() @IsUUID()
  packageId: string;

  @ApiProperty({ example: '2026-10-01T07:00:00Z' }) @IsDateString()
  startAt: string;

  @ApiProperty({ example: 2 }) @IsInt() @Min(1)
  groupSize: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}

export class PayBookingDto {
  @ApiProperty({ description: 'Token from the payment SDK. Stub: tok_ok | tok_fail | tok_3ds', example: 'tok_ok' })
  @IsString() @MaxLength(255)
  paymentMethodToken: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}

export class SosDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsLatitude()
  lat?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsLongitude()
  lng?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  message?: string;
}

export class BookingListQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: BookingStatus }) @IsOptional() @IsEnum(BookingStatus)
  status?: BookingStatus;
}
