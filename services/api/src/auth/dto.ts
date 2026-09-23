import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsIn, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { OtpPurpose, UserRole } from '../common/enums';

const E164 = /^\+[1-9]\d{7,14}$/;
const trimLower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const stripSpaces = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value);

export class RegisterDto {
  @ApiProperty() @Transform(trimLower) @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 }) @IsString() @MinLength(8) @MaxLength(72)
  password: string;

  @ApiProperty() @IsString() @Length(2, 120)
  fullName: string;

  @ApiProperty({ example: '+966500000000' }) @Transform(stripSpaces) @Matches(E164, { message: 'phone must be E.164, e.g. +966500000000' })
  phone: string;

  @ApiProperty({ enum: [UserRole.TOURIST, UserRole.GUIDE] })
  @IsIn([UserRole.TOURIST, UserRole.GUIDE])
  role: UserRole.TOURIST | UserRole.GUIDE;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @Length(2, 8)
  locale?: string;
}

export class LoginDto {
  @ApiProperty() @Transform(trimLower) @IsEmail()
  email: string;

  @ApiProperty() @IsString()
  password: string;
}

export class RequestOtpDto {
  @ApiProperty({ example: '+966500000000' }) @Transform(stripSpaces) @Matches(E164)
  phone: string;

  @ApiProperty({ enum: OtpPurpose }) @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}

export class VerifyOtpDto extends RequestOtpDto {
  @ApiProperty({ example: '123456' }) @Matches(/^\d{6}$/)
  code: string;
}
