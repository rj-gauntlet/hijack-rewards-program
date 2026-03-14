import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';

const mockDynamo = {
  get: jest.fn(),
  put: jest.fn(),
  update: jest.fn(),
  query: jest.fn(),
  scan: jest.fn(),
};

const validAwardBody = {
  playerId: 'integration-test-player',
  tableId: 'table-001',
  tableStakes: '$1.00-$2.00',
  bigBlind: 1.0,
  handId: 'hand-integration-001',
};

describe('Points Award (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    mockDynamo.query.mockResolvedValue([]);
    mockDynamo.get.mockResolvedValue(null);
    mockDynamo.put.mockResolvedValue(undefined);
    mockDynamo.update.mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DynamoService)
      .useValue(mockDynamo)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDynamo.query.mockResolvedValue([]);
    mockDynamo.get.mockResolvedValue(null);
    mockDynamo.put.mockResolvedValue(undefined);
    mockDynamo.update.mockResolvedValue(undefined);
  });

  describe('POST /api/v1/points/award', () => {
    it('returns 201 with earnedPoints and writes to ledger (core award flow)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/points/award')
        .send(validAwardBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.earnedPoints).toBe(2);
      expect(res.body.data.basePoints).toBe(2);
      expect(res.body.data.multiplier).toBe(1);
      expect(res.body.data.currentTier).toBeDefined();

      expect(mockDynamo.put).toHaveBeenCalledWith(
        TABLE_NAMES.TRANSACTIONS,
        expect.objectContaining({
          playerId: validAwardBody.playerId,
          handId: validAwardBody.handId,
          basePoints: 2,
          earnedPoints: 2,
        }),
      );
    });

    it('returns 400 when body fails validation', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/points/award')
        .send({ playerId: 'p1', handId: 'h1' })
        .expect(400);
      expect(mockDynamo.put).not.toHaveBeenCalled();
    });

    it('returns 409 when same handId is awarded twice (idempotency)', async () => {
      mockDynamo.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ playerId: validAwardBody.playerId, handId: validAwardBody.handId }]);

      await request(app.getHttpServer())
        .post('/api/v1/points/award')
        .send(validAwardBody)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/points/award')
        .send(validAwardBody)
        .expect(409);

      const msg = res.body.message || res.body.error || '';
      expect(msg).toMatch(/Duplicate request rejected|already awarded/);
    });
  });

});

describe('Points Award — Rate limiting (FR-42)', () => {
  let app: INestApplication;
  const mockDynamo2 = {
    get: jest.fn(),
    put: jest.fn(),
    update: jest.fn(),
    query: jest.fn(),
    scan: jest.fn(),
  };

  beforeAll(async () => {
    mockDynamo2.query.mockResolvedValue([]);
    mockDynamo2.get.mockResolvedValue(null);
    mockDynamo2.put.mockResolvedValue(undefined);
    mockDynamo2.update.mockResolvedValue(undefined);
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DynamoService)
      .useValue(mockDynamo2)
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 429 after 100 requests (FR-42)', async () => {
    const limit = 100;
    for (let i = 0; i < limit; i++) {
      mockDynamo2.query.mockResolvedValue([]);
      mockDynamo2.get.mockResolvedValue(null);
      mockDynamo2.put.mockResolvedValue(undefined);
      mockDynamo2.update.mockResolvedValue(undefined);
      const r = await request(app.getHttpServer())
        .post('/api/v1/points/award')
        .send({
          playerId: 'rl-player',
          tableId: 't1',
          tableStakes: '$1-$2',
          bigBlind: 1,
          handId: `hand-rl-${i}`,
        });
      if (r.status !== 201) throw new Error(`Request ${i + 1} got ${r.status}`);
    }
    mockDynamo2.query.mockResolvedValue([]);
    mockDynamo2.get.mockResolvedValue(null);
    mockDynamo2.put.mockResolvedValue(undefined);
    mockDynamo2.update.mockResolvedValue(undefined);
    const r = await request(app.getHttpServer())
      .post('/api/v1/points/award')
      .send({
        playerId: 'rl-player',
        tableId: 't1',
        tableStakes: '$1-$2',
        bigBlind: 1,
        handId: 'hand-rl-over',
      });
    expect(r.status).toBe(429);
  }, 90000);
});
