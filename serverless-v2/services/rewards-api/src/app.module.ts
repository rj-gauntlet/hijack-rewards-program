import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { DynamoModule } from './dynamo/dynamo.module';

@Module({
  imports: [DynamoModule],
  controllers: [HealthController],
})
export class AppModule {}
