import { Module } from '@nestjs/common';
import { GuidesModule } from '../guides/guides.module';
import { AdminPayoutsController, GuidePayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [GuidesModule],
  controllers: [GuidePayoutsController, AdminPayoutsController],
  providers: [PayoutsService],
})
export class PayoutsModule {}
