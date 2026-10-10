import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BusLocationsService } from './bus-locations.service';

describe('BusLocationsService', () => {
  const routeId = '11111111-1111-4111-8111-111111111111';
  const stopId = '22222222-2222-4222-8222-222222222222';
  let prisma: any;
  let service: BusLocationsService;

  beforeEach(() => {
    prisma = {
      shuttleRoute: {
        findUnique: jest.fn().mockResolvedValue({ id: routeId }),
        findMany: jest.fn().mockResolvedValue([
          { id: routeId, name: 'สาย 1', locations: [{ id: 'loc-1', latitude: 18.89, longitude: 99.0 }] },
          { id: 'r2', name: 'สาย 2', locations: [] },
        ]),
      },
      shuttleStop: { findUnique: jest.fn().mockResolvedValue({ id: stopId, routeId }) },
      busLocation: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new', ...data })),
      },
    };
    service = new BusLocationsService(prisma);
  });

  it('create stores the reporter core_user_id', async () => {
    const result = await service.create(
      { routeId, currentStopId: stopId, latitude: 18.89, longitude: 99.0 },
      'core-user-1',
    );
    expect(result.reportedByCoreUserId).toBe('core-user-1');
  });

  it('create rejects an unknown route with 404', async () => {
    prisma.shuttleRoute.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ routeId, latitude: 18.89, longitude: 99.0 }, 'core-user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create rejects a stop from another route with 400', async () => {
    prisma.shuttleStop.findUnique.mockResolvedValue({ id: stopId, routeId: 'other' });
    await expect(
      service.create({ routeId, currentStopId: stopId, latitude: 18.89, longitude: 99.0 }, 'u'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findLatest returns one entry per active route (null when no report yet)', async () => {
    const latest = await service.findLatest();
    expect(latest).toHaveLength(2);
    expect(latest[0].location?.id).toBe('loc-1');
    expect(latest[1].location).toBeNull();
  });

  it('findAll filters by route and sorts newest first', async () => {
    await service.findAll({ routeId, page: 1, limit: 10 } as any);
    const args = prisma.busLocation.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ routeId });
    expect(args.orderBy).toEqual({ reportedAt: 'desc' });
  });
});
