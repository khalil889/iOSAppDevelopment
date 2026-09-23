import { Module } from '@nestjs/common';
import { DisputesModule } from '../disputes/disputes.module';
import { PaymentsModule } from '../payments/payments.module';
import { AdminGuidesService } from './admin-guides.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [DisputesModule, PaymentsModule],
  controllers: [AdminController],
  providers: [AdminGuidesService],
})
export class AdminModule {}
