import { Global, Logger, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_ASSISTANT } from './ai/ai-assistant.interface';
import { StubAiAssistant } from './ai/stub-ai.assistant';
import { KYC_PROVIDER } from './kyc/kyc-provider.interface';
import { StubKycProvider } from './kyc/stub-kyc.provider';
import { PAYMENT_PROVIDER } from './payments/payment-provider.interface';
import { StubPaymentProvider } from './payments/stub-payment.provider';
import { SMS_SENDER } from './sms/sms-sender.interface';
import { StubSmsSender } from './sms/stub-sms.sender';

/**
 * Binds each external-provider interface to an implementation chosen by env.
 * To plug in a real provider: implement the interface, add it to the map
 * below and set e.g. PAYMENT_PROVIDER=stripe.
 */
function select<T>(token: symbol, configKey: string, impls: Record<string, new (...a: any[]) => T>): Provider {
  return {
    provide: token,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const name = config.get<string>(configKey) ?? 'stub';
      const Impl = impls[name];
      if (!Impl) throw new Error(`Unknown ${configKey} "${name}". Available: ${Object.keys(impls).join(', ')}`);
      new Logger('Providers').log(`${configKey} -> ${name}`);
      return new Impl();
    },
  };
}

@Global()
@Module({
  providers: [
    select(PAYMENT_PROVIDER, 'providers.payment', { stub: StubPaymentProvider }),
    select(KYC_PROVIDER, 'providers.kyc', { stub: StubKycProvider }),
    select(SMS_SENDER, 'providers.sms', { stub: StubSmsSender }),
    select(AI_ASSISTANT, 'providers.ai', { stub: StubAiAssistant }),
  ],
  exports: [PAYMENT_PROVIDER, KYC_PROVIDER, SMS_SENDER, AI_ASSISTANT],
})
export class ProvidersModule {}
