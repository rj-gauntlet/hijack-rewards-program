import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = module.get(HealthController);
  });

  it('returns ok status', () => {
    const result = controller.getHealth();
    expect(result.service).toBe('streaks-api');
    expect(result.status).toBe('ok');
    expect(result.framework).toBe('NestJS');
    expect(result.timestamp).toBeDefined();
  });

  it('versioned endpoint returns same data', () => {
    const result = controller.getHealthV1();
    expect(result.service).toBe('streaks-api');
    expect(result.status).toBe('ok');
  });
});
