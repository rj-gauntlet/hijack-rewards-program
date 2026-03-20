import { Injectable } from '@nestjs/common';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { DailyActivity, CalendarResponse } from '../common/types';
import { assembleCalendar } from './calendar-assembler';

@Injectable()
export class CalendarService {
  constructor(private readonly dynamo: DynamoService) {}

  async getCalendar(playerId: string, month: string): Promise<CalendarResponse> {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`; // DynamoDB BETWEEN is inclusive, extra days are fine

    const items = await this.dynamo.query(
      TABLE_NAMES.ACTIVITY,
      'playerId = :pid AND #d BETWEEN :start AND :end',
      { ':pid': playerId, ':start': startDate, ':end': endDate },
      { expressionNames: { '#d': 'date' } },
    );

    const activities = items as unknown as DailyActivity[];
    return assembleCalendar(activities, month);
  }
}
