import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PricingType } from '../common/enums';

export class CreatePackageDto {
  @ApiProperty() @IsUUID()
  cityId: string;

  @ApiProperty() @IsString() @Length(3, 160)
  title: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000)
  description?: string;

  /** Arabic title shown to Arabic-speaking travellers (optional). */
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 160)
  titleAr?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000)
  descriptionAr?: string;

  @ApiProperty({ example: 180 }) @IsInt() @Min(30) @Max(60 * 24 * 3)
  durationMinutes: number;

  @ApiProperty({ enum: PricingType }) @IsEnum(PricingType)
  pricingType: PricingType;

  @ApiProperty({ description: 'Minor units, e.g. 45000 = 450.00 SAR' }) @IsInt() @Min(0) @Max(10_000_000)
  priceMinor: number;

  @ApiProperty({ example: 'SAR' }) @Matches(/^[A-Z]{3}$/)
  currency: string;

  @ApiProperty() @IsInt() @Min(1) @Max(50)
  maxGroupSize: number;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @Matches(/^[a-z]{2}$/, { each: true })
  languages?: string[];

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsUUID('4', { each: true })
  siteIds?: string[];
}

export class UpdatePackageDto extends PartialType(CreatePackageDto) {
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}
