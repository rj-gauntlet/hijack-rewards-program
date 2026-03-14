import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { DynamoModule } from './dynamo/dynamo.module';
import { RedisModule } from './redis/redis.module';
import { PointsModule } from './points/points.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SystemModule } from './system/system.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'points-award', ttl: 60000, limit: 100 },
    ]),
    DynamoModule,
    RedisModule,
    PointsModule,
    NotificationsModule,
    SystemModule,
    LeaderboardModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
