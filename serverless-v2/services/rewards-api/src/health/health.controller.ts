import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  getHealth() {
    return {
      service: 'rewards-api',
      status: 'ok',
      framework: 'NestJS',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api/v1/health')
  @ApiOperation({ summary: 'Health check (versioned)' })
  getHealthV1() {
    return this.getHealth();
  }
}
