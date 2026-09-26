import { Global, Logger, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_ASSISTANT, AiAssistant } from './ai/ai-assistant.interface';
import { ClaudeAiAssistant } from './ai/claude-ai.assistant';
import { StubAiAssistant } from './ai/stub-ai.assistant';
import { IDENTITY_PROVIDER, IdentityProvider } from './identity/identity-provider.interface';
import { StubIdentityProvider } from './identity/stub-identity.provider';
import { SumsubIdentityProvider } from './identity/sumsub-identity.provider';
import { KYC_PROVIDER, KycProvider } from './kyc/kyc-provider.interface';
import { StubKycProvider } from './kyc/stub-kyc.provider';
import { MoyasarPaymentProvider } from './payments/moyasar-payment.provider';
import { PAYMENT_PROVIDER, PaymentProvider } from './payments/payment-provider.interface';
import { StubPaymentProvider } from './payments/stub-payment.provider';
import { MobishastraSmsSender } from './sms/mobishastra-sms.sender';
import { SMS_SENDER, SmsSender } from './sms/sms-sender.interface';
import { FcmPushSender } from './push/fcm-push.sender';
import { PUSH_SENDER, PushSender } from './push/push-sender.interface';
import { StubPushSender } from './push/stub-push.sender';
import { LocalStorageProvider } from './storage/local-storage.provider';
import { LocalUploadsController } from './storage/local-uploads.controller';
import { S3StorageProvider } from './storage/s3-storage.provider';
import { STORAGE_PROVIDER, StorageProvider } from './storage/storage.interface';
import { StubSmsSender } from './sms/stub-sms.sender';

/**
 * Binds each external-provider interface to an implementation chosen by env.
 * To plug in a real provider: implement the interface, add it to the map
 * below and set e.g. PAYMENT_PROVIDER=stripe.
 */
function select<T>(token: symbol, configKey: string, impls: Record<string, new (config: ConfigService) => T>): Provider {
  return {
    provide: token,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const name = config.get<string>(configKey) ?? 'stub';
      const Impl = impls[name];
      if (!Impl) throw new Error(`Unknown ${configKey} "${name}". Available: ${Object.keys(impls).join(', ')}`);
      new Logger('Providers').log(`${configKey} -> ${name}`);
      return new Impl(config);
    },
  };
}

@Global()
@Module({
  providers: [
    select<PaymentProvider>(PAYMENT_PROVIDER, 'providers.payment', { stub: StubPaymentProvider, moyasar: MoyasarPaymentProvider }),
    select<KycProvider>(KYC_PROVIDER, 'providers.kyc', { stub: StubKycProvider }),
    select<IdentityProvider>(IDENTITY_PROVIDER, 'providers.identity', { stub: StubIdentityProvider, sumsub: SumsubIdentityProvider }),
    select<SmsSender>(SMS_SENDER, 'providers.sms', { stub: StubSmsSender, mobishastra: MobishastraSmsSender }),
    select<AiAssistant>(AI_ASSISTANT, 'providers.ai', { stub: StubAiAssistant, claude: ClaudeAiAssistant }),
    select<StorageProvider>(STORAGE_PROVIDER, 'providers.storage', { local: LocalStorageProvider, s3: S3StorageProvider }),
    select<PushSender>(PUSH_SENDER, 'providers.push', { stub: StubPushSender, fcm: FcmPushSender }),
  ],
  controllers: [LocalUploadsController],
  exports: [PAYMENT_PROVIDER, KYC_PROVIDER, IDENTITY_PROVIDER, SMS_SENDER, AI_ASSISTANT, STORAGE_PROVIDER, PUSH_SENDER],
})
export class ProvidersModule {}
