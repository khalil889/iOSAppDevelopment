import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
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
import { PACKAGE_MAX_PHOTOS, PACKAGE_PHOTO_MAX_BYTES, PACKAGE_PHOTO_TYPES } from './package-photos';

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

  @ApiProperty() @IsInt() @Min(1) @Max(50)
  maxGroupSize: number;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @Matches(/^[a-z]{2}$/, { each: true })
  languages?: string[];

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsUUID('4', { each: true })
  siteIds?: string[];

  /** Keys from POST /packages/photo-upload, in display order (first = cover). */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PACKAGE_MAX_PHOTOS)
  @Matches(/^packages\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/, { each: true })
  photoKeys?: string[];
}

export class PackagePhotoUploadDto {
  @ApiProperty({ enum: Object.keys(PACKAGE_PHOTO_TYPES) })
  @IsIn(Object.keys(PACKAGE_PHOTO_TYPES))
  contentType: keyof typeof PACKAGE_PHOTO_TYPES;

  @ApiProperty({ description: 'Exact file size in bytes (max 5 MB)' })
  @IsInt()
  @Min(1)
  @Max(PACKAGE_PHOTO_MAX_BYTES)
  sizeBytes: number;
}

export class UpdatePackageDto extends PartialType(CreatePackageDto) {
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}
