import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [NotificationsModule, LeaderboardModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
