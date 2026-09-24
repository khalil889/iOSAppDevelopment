import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { GuideVerificationStatus, OtpPurpose, UserRole } from '../common/enums';
import { Guide } from '../guides/guide.entity';
import { SMS_SENDER, SmsSender } from '../providers/sms/sms-sender.interface';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RequestOtpDto, VerifyOtpDto } from './dto';
import { OtpCode } from './otp-code.entity';

/** Minimum gap between OTP sends to the same phone. */
const OTP_RESEND_SECONDS = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly db: DataSource,
    @InjectRepository(OtpCode) private readonly otps: Repository<OtpCode>,
    @Inject(SMS_SENDER) private readonly sms: SmsSender,
  ) {}

  async register(dto: RegisterDto) {
    const clash = await this.db.getRepository(User).findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });
    if (clash) throw new ConflictException('An account with this email or phone already exists');

    const user = await this.db.transaction(async (tx) => {
      const u = await tx.getRepository(User).save(
        tx.getRepository(User).create({
          email: dto.email,
          phone: dto.phone,
          fullName: dto.fullName,
          role: dto.role,
          locale: dto.locale ?? 'en',
          passwordHash: await bcrypt.hash(dto.password, 10),
        }),
      );
      if (dto.role === UserRole.GUIDE) {
        await tx.getRepository(Guide).save(
          tx.getRepository(Guide).create({ userId: u.id, verificationStatus: GuideVerificationStatus.DRAFT }),
        );
      }
      return u;
    });

    const otp = await this.requestOtp({ phone: dto.phone, purpose: OtpPurpose.VERIFY_PHONE });
    return { ...(await this.issueToken(user.id)), ...otp };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    const ok = user?.passwordHash && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!user || !ok) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedException('Account disabled');
    return this.issueToken(user.id);
  }

  async requestOtp(dto: RequestOtpDto): Promise<{ otpSent: true; devCode?: string }> {
    // Don't reveal whether a phone is registered for LOGIN; just skip sending.
    const user = await this.users.findByPhone(dto.phone);
    const recent = await this.otps.findOne({
      where: {
        phone: dto.phone,
        purpose: dto.purpose,
        createdAt: MoreThan(new Date(Date.now() - OTP_RESEND_SECONDS * 1000)),
      },
    });
    if (recent) throw new BadRequestException(`Please wait ${OTP_RESEND_SECONDS}s before requesting another code`);

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    if (user) {
      // Send first: if the gateway rejects the message, no code is stored and
      // the resend cooldown doesn't lock the user out.
      try {
        await this.sms.send(dto.phone, `Your TourGuide code is ${code}`);
      } catch (e) {
        this.logger.error(`OTP delivery failed: ${(e as Error).message}`);
        throw new ServiceUnavailableException('We could not send the SMS right now. Please try again shortly.');
      }
      await this.otps.save(
        this.otps.create({
          phone: dto.phone,
          purpose: dto.purpose,
          codeHash: await bcrypt.hash(code, 8),
          expiresAt: new Date(Date.now() + this.config.get<number>('otp.ttlSeconds')! * 1000),
        }),
      );
    }
    const devEcho = this.config.get<boolean>('otp.devEcho') && user;
    return devEcho ? { otpSent: true, devCode: code } : { otpSent: true };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const invalid = new UnauthorizedException('Invalid or expired code');
    const otp = await this.otps.findOne({
      where: { phone: dto.phone, purpose: dto.purpose, consumedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
    if (!otp) throw invalid;
    if (otp.attempts >= this.config.get<number>('otp.maxAttempts')!) {
      throw new UnauthorizedException('Too many attempts; request a new code');
    }
    if (!(await bcrypt.compare(dto.code, otp.codeHash))) {
      await this.otps.increment({ id: otp.id }, 'attempts', 1);
      throw invalid;
    }
    await this.otps.update({ id: otp.id }, { consumedAt: new Date() });

    const user = await this.users.findByPhone(dto.phone);
    if (!user || !user.isActive) throw invalid;
    if (!user.phoneVerifiedAt) {
      await this.db.getRepository(User).update({ id: user.id }, { phoneVerifiedAt: new Date() });
    }
    return this.issueToken(user.id);
  }

  async me(userId: string) {
    return this.users.getById(userId);
  }

  private async issueToken(userId: string) {
    const user = await this.users.getById(userId);
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user };
  }
}
