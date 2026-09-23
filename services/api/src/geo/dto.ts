import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { PaginationQuery } from '../common/pagination';
import { SiteCategory } from '../common/enums';

/** lat/lng/radiusKm — all three are required together for geo filtering. */
export class NearQuery extends PaginationQuery {
  @ApiPropertyOptional() @ValidateIf((o) => o.lng !== undefined || o.radiusKm !== undefined)
  @Type(() => Number) @IsLatitude()
  lat?: number;

  @ApiPropertyOptional() @ValidateIf((o) => o.lat !== undefined || o.radiusKm !== undefined)
  @Type(() => Number) @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({ default: 25 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0.1) @Max(500)
  radiusKm?: number;
}

export class SiteSearchQuery extends NearQuery {
  @ApiPropertyOptional({ description: 'Free-text match on name/description' })
  @IsOptional() @IsString() @MaxLength(100)
  q?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  countryId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({ enum: SiteCategory }) @IsOptional() @IsEnum(SiteCategory)
  category?: SiteCategory;
}

export class CityQuery {
  @ApiPropertyOptional() @IsOptional() @IsUUID()
  countryId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  q?: string;
}
