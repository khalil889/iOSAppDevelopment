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

  @ApiPropertyOptional({ description: 'URL of the uploaded license scan' })
  @IsOptional() @IsUrl({ require_tld: false })
  licenseDocumentUrl?: string;
}
