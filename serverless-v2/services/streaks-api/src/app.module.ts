import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { DynamoModule } from './dynamo/dynamo.module';
import { StreaksModule } from './streaks/streaks.module';
import { CalendarModule } from './calendar/calendar.module';
import { RewardsModule } from './rewards/rewards.module';
import { FreezesModule } from './freezes/freezes.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    DynamoModule,
    StreaksModule,
    CalendarModule,
    RewardsModule,
    FreezesModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
