import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class PayoutAccountDto {
  @ApiProperty({ description: 'Name on the bank account' }) @Transform(trim) @IsString() @Length(3, 120)
  holderName: string;

  @ApiProperty({ example: 'SA03 8000 0000 6080 1016 7519' }) @IsString() @Length(15, 42)
  iban: string;

  @ApiPropertyOptional() @IsOptional() @Transform(trim) @IsString() @Length(2, 80)
  bankName?: string;
}

export class CreatePayoutRunDto {
  @ApiProperty({ example: 'SAR' }) @Matches(/^[A-Z]{3}$/)
  currency: string;
}

export class MarkPayoutPaidDto {
  @ApiProperty({ description: 'Bank transfer reference' }) @Transform(trim) @IsString() @Length(3, 200)
  reference: string;
}

export class MarkPayoutFailedDto {
  @ApiProperty() @Transform(trim) @IsString() @Length(5, 200)
  reason: string;
}
