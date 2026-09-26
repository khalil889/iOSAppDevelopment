import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches } from 'class-validator';

export class AnalyticsQuery {
  @ApiPropertyOptional({ enum: [7, 30, 90, 365], default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([7, 30, 90, 365])
  days: number = 30;

  @ApiPropertyOptional({ example: 'SAR', description: 'Money figures are per currency (default SAR)' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency: string = 'SAR';
}
