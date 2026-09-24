import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { NearQuery } from '../geo/dto';

const csv = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : value;

export class GuideSearchQuery extends NearQuery {
  @ApiPropertyOptional({ description: 'Match on guide name or bio' }) @IsOptional() @IsString() @MaxLength(100)
  q?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  countryId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  cityId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({ description: 'ISO 639-1, e.g. en' }) @IsOptional() @Matches(/^[a-z]{2}$/)
  language?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Only guides with a package at or below this price (minor units)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  maxPriceMinor?: number;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD — exclude guides already booked that day' })
  @IsOptional() @IsDateString({ strict: true })
  date?: string;

  @ApiPropertyOptional({ enum: ['rating', 'price', 'experience'], default: 'rating' })
  @IsOptional() @IsIn(['rating', 'price', 'experience'])
  sort?: 'rating' | 'price' | 'experience';
}

export class UpdateGuideProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000)
  bio?: string;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @Transform(csv) @IsArray() @ArrayMaxSize(10)
  @Matches(/^[a-z]{2}$/, { each: true })
  languages?: string[];

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(60)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsUUID('4', { each: true })
  cityIds?: string[];

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(100) @IsUUID('4', { each: true })
  siteIds?: string[];
}

export class SubmitApplicationDto {
  @ApiProperty({ example: 'SA-104233' }) @IsString() @Length(3, 64)
  licenseNumber: string;

  @ApiProperty() @IsUUID()
  licenseCountryId: string;

  @ApiProperty({ example: '2027-12-31' }) @IsDateString({ strict: true })
  licenseExpiresAt: string;

  @ApiPropertyOptional({ description: 'Storage key returned by POST /guides/me/license-upload (preferred)' })
  @IsOptional() @IsString() @MaxLength(300)
  licenseDocumentKey?: string;

  @ApiPropertyOptional({ description: 'Legacy: link to a license scan hosted elsewhere' })
  @IsOptional() @IsUrl({ require_tld: false })
  licenseDocumentUrl?: string;
}

export const LICENSE_CONTENT_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' } as const;
export const LICENSE_MAX_BYTES = 10 * 1024 * 1024;

export class LicenseUploadDto {
  @ApiProperty({ enum: Object.keys(LICENSE_CONTENT_TYPES) })
  @IsIn(Object.keys(LICENSE_CONTENT_TYPES))
  contentType: keyof typeof LICENSE_CONTENT_TYPES;

  @ApiProperty({ description: 'Exact file size in bytes (max 10 MB)' })
  @IsInt() @Min(1) @Max(LICENSE_MAX_BYTES)
  sizeBytes: number;
}
