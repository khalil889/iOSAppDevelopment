import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from '../geo/city.entity';
import { GeoModule } from '../geo/geo.module';
import { GuidesModule } from '../guides/guides.module';
import { User } from '../users/user.entity';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [TypeOrmModule.forFeature([City, User]), GeoModule, GuidesModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
