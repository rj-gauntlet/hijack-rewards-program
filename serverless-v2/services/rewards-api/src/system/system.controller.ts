import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { createSuccessResponse } from '../common/utils/api-response';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post('monthly-reset')
  @ApiOperation({
    summary: 'Trigger monthly tier reset',
    description:
      'Scans all players, snapshots current state to TierHistory, ' +
      'applies floor protection (drop at most 1 tier), resets monthly points to 0, ' +
      'and creates downgrade notifications where applicable.',
  })
  async monthlyReset() {
    const result = await this.systemService.processMonthlyReset();
    return createSuccessResponse(result);
  }
}
