import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { DynamoModule } from './dynamo/dynamo.module';
import { PointsModule } from './points/points.module';

@Module({
  imports: [DynamoModule, PointsModule],
  controllers: [HealthController],
})
export class AppModule {}
