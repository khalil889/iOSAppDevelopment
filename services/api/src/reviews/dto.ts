import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReviewDto {
  /** Range (1-5) is enforced by review.rules so the error code is consistent. */
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt()
  rating: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  comment?: string;
}
