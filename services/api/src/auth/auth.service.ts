import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { TokenService } from './token.service';

// bcrypt hash of a random string, used to equalise timing for unknown emails.
const DUMMY_HASH = '$2b$10$Jp4gfizzsukZ/h3Du5XsMukIUfO4SYLLqt6T6rSKGOT.SHZr.10tu';

/** Minimum gap between OTP sends to the same phone. */
const OTP_RESEND_SECONDS = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
    private readonly db: DataSource,
    @InjectRepository(OtpCode) private readonly otps: Repository<OtpCode>,
    @Inject(SMS_SENDER) private readonly sms: SmsSender,
  ) {}

  async register(dto: RegisterDto, userAgent?: string) {
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
    return { ...(await this.issueToken(user.id, userAgent)), ...otp };
  }

  async login(dto: LoginDto, userAgent?: string) {
    const invalid = new UnauthorizedException('Invalid email or password');
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user?.passwordHash) {
      // Same cost as a real check so response time doesn't reveal which emails exist.
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw invalid;
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new HttpException(`Too many failed attempts. Try again in ${minutes} minute(s) or sign in with a phone code.`, HttpStatus.TOO_MANY_REQUESTS);
    }
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      const { maxAttempts, minutes } = this.config.get<{ maxAttempts: number; minutes: number }>('loginLockout')!;
      const failed = (user.failedLoginCount ?? 0) + 1;
      await this.db.getRepository(User).update(
        { id: user.id },
        failed >= maxAttempts
          ? { failedLoginCount: 0, lockedUntil: new Date(Date.now() + minutes * 60_000) }
          : { failedLoginCount: failed },
      );
      throw invalid;
    }
    if (!user.isActive) throw new UnauthorizedException('Account disabled');
    if (user.failedLoginCount || user.lockedUntil) {
      await this.db.getRepository(User).update({ id: user.id }, { failedLoginCount: 0, lockedUntil: null });
    }
    return this.issueToken(user.id, userAgent);
  }

  async refresh(refreshToken: string, userAgent?: string) {
    const { userId, ...tokens } = await this.tokens.refresh(refreshToken, userAgent);
    return { ...tokens, user: await this.users.getById(userId) };
  }

  logout(refreshToken: string) {
    return this.tokens.revoke(refreshToken).then(() => ({ signedOut: true }));
  }

  logoutAll(userId: string) {
    return this.tokens.revokeAll(userId).then((sessions) => ({ signedOut: true, sessions }));
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

  async verifyOtp(dto: VerifyOtpDto, userAgent?: string) {
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
    // A verified phone code also clears a password lockout.
    await this.db.getRepository(User).update({ id: user.id }, { failedLoginCount: 0, lockedUntil: null });
    return this.issueToken(user.id, userAgent);
  }

  async me(userId: string) {
    return this.users.getById(userId);
  }

  private async issueToken(userId: string, userAgent?: string) {
    const user = await this.users.getById(userId);
    if (!user.isActive) throw new UnauthorizedException('Account disabled');
    return { ...(await this.tokens.issue(user, userAgent)), user };
  }
}
