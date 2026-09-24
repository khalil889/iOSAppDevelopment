import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'FCM registration token' }) @IsString() @Length(20, 512)
  token: string;

  @ApiProperty({ enum: ['android', 'ios', 'web'] }) @IsIn(['android', 'ios', 'web'])
  platform: 'android' | 'ios' | 'web';
}

export class UnregisterDeviceDto {
  @ApiProperty() @IsString() @Length(20, 512)
  token: string;
}

export class MarkReadDto {
  @ApiPropertyOptional({ type: [String], description: 'Omit to mark everything read' })
  @IsOptional() @IsArray() @ArrayMaxSize(200) @IsUUID('4', { each: true })
  ids?: string[];
}
