import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { DynamoModule } from './dynamo/dynamo.module';
import { PointsModule } from './points/points.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [DynamoModule, PointsModule, NotificationsModule, SystemModule],
  controllers: [HealthController],
})
export class AppModule {}
