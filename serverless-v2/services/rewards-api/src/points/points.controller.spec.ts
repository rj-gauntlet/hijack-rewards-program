import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';

describe('PointsController', () => {
  let controller: PointsController;
  let pointsService: jest.Mocked<Pick<PointsService, 'awardPoints'>>;

  beforeEach(async () => {
    pointsService = {
      awardPoints: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])],
      controllers: [PointsController],
      providers: [{ provide: PointsService, useValue: pointsService }],
    }).compile();

    controller = module.get<PointsController>(PointsController);
  });

  describe('awardPoints (idempotency)', () => {
    const dto = {
      playerId: 'player-001',
      tableId: 'table-001',
      tableStakes: '$1.00-$2.00',
      bigBlind: 1.0,
      handId: 'hand-dup-001',
    };

    it('returns success when award succeeds', async () => {
      pointsService.awardPoints.mockResolvedValue({
        basePoints: 2,
        multiplier: 1,
        earnedPoints: 2,
        newMonthlyTotal: 2,
        currentTier: 1,
      } as Awaited<ReturnType<PointsService['awardPoints']>>);

      const result = await controller.awardPoints(dto);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.earnedPoints).toBe(2);
      expect(pointsService.awardPoints).toHaveBeenCalledWith(dto);
    });

    it('propagates ConflictException when same handId already awarded (idempotency)', async () => {
      pointsService.awardPoints.mockRejectedValue(
        new ConflictException(
          `Points already awarded for handId ${dto.handId} (player ${dto.playerId}). Duplicate request rejected.`,
        ),
      );

      await expect(controller.awardPoints(dto)).rejects.toThrow(ConflictException);
      await expect(controller.awardPoints(dto)).rejects.toThrow(/Duplicate request rejected/);
      expect(pointsService.awardPoints).toHaveBeenCalledWith(dto);
    });
  });
});
