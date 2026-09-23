import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuideVerificationEvent } from './guide-verification-event.entity';
import { Guide } from './guide.entity';
import { GuidesController } from './guides.controller';
import { GuidesService } from './guides.service';

@Module({
  imports: [TypeOrmModule.forFeature([Guide, GuideVerificationEvent])],
  controllers: [GuidesController],
  providers: [GuidesService],
  exports: [GuidesService],
})
export class GuidesModule {}
