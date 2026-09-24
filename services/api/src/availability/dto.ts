import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

export class WeeklyWindowDto {
  @ApiProperty({ description: '0 = Sunday … 6 = Saturday' }) @IsInt() @Min(0) @Max(6)
  weekday: number;

  @ApiProperty({ example: '09:00' }) @Matches(HHMM, { message: 'start must be HH:MM' })
  start: string;

  @ApiProperty({ example: '17:00' }) @Matches(HHMM, { message: 'end must be HH:MM' })
  end: string;
}

export class TimeOffDto {
  @ApiProperty({ example: '2026-12-24' }) @IsDateString({ strict: true })
  startDate: string;

  @ApiProperty({ example: '2026-12-26' }) @IsDateString({ strict: true })
  endDate: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  reason?: string;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ type: [WeeklyWindowDto] })
  @IsArray() @ArrayMaxSize(28) @ValidateNested({ each: true }) @Type(() => WeeklyWindowDto)
  weeklyHours: WeeklyWindowDto[];

  @ApiProperty({ type: [TimeOffDto] })
  @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => TimeOffDto)
  timeOff: TimeOffDto[];
}

export class SlotsQuery {
  @ApiProperty() @IsUUID()
  packageId: string;

  @ApiProperty({ example: '2026-10-04', description: 'Local date in the tour city' }) @IsDateString({ strict: true })
  date: string;
}
