import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSession } from './auth-session.entity';
import { OtpCode } from './otp-code.entity';
import { TokenService } from './token.service';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([OtpCode, AuthSession])],
  controllers: [AuthController],
  providers: [AuthService, TokenService],
})
export class AuthModule {}
