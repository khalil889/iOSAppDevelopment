import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuideVerificationEvent } from './guide-verification-event.entity';
import { Guide } from './guide.entity';
import { GuidesController } from './guides.controller';
import { GuidesService } from './guides.service';
import { IdentityWebhooksController } from './identity-webhooks.controller';
import { IdentityService } from './identity.service';

@Module({
  imports: [TypeOrmModule.forFeature([Guide, GuideVerificationEvent])],
  controllers: [GuidesController, IdentityWebhooksController],
  providers: [GuidesService, IdentityService],
  exports: [GuidesService],
})
export class GuidesModule {}
