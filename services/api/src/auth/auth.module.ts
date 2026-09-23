import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpCode } from './otp-code.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([OtpCode])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
