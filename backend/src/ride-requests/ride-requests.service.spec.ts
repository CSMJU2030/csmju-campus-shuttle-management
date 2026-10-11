import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RideRequestsService } from './ride-requests.service';

describe('RideRequestsService', () => {
  const routeId = '11111111-1111-4111-8111-111111111111';
  const stopId = '22222222-2222-4222-8222-222222222222';
  let prisma: any;
  let service: RideRequestsService;

  beforeEach(() => {
    prisma = {
      shuttleStop: {
        findUnique: jest.fn().mockResolvedValue({ id: stopId, routeId }),
        findMany: jest.fn().mockResolvedValue([{ id: stopId, name: 'ป้าย A', route: { name: 'สาย 1' } }]),
      },
      rideRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'r1', status: 'WAITING', ...data })),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue({ id: 'r1', requestedByCoreUserId: 'u1' }),
        update: jest.fn().mockResolvedValue({ id: 'r1', status: 'CANCELLED' }),
        groupBy: jest.fn().mockResolvedValue([{ stopId, _count: { _all: 3 } }]),
      },
    };
    service = new RideRequestsService(prisma);
  });

  it('create cancels the rider’s previous request and stores core_user_id', async () => {
    const result = await service.create({ routeId, stopId }, 'u1');
    expect(prisma.rideRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { requestedByCoreUserId: 'u1', status: 'WAITING' } }),
    );
    expect(result.requestedByCoreUserId).toBe('u1');
  });

  it('create rejects an unknown stop (404) and a stop from another route (400)', async () => {
    prisma.shuttleStop.findUnique.mockResolvedValueOnce(null);
    await expect(service.create({ routeId, stopId }, 'u1')).rejects.toBeInstanceOf(NotFoundException);
    prisma.shuttleStop.findUnique.mockResolvedValueOnce({ id: stopId, routeId: 'other' });
    await expect(service.create({ routeId, stopId }, 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancel only works for the owner', async () => {
    await expect(service.cancel('r1', 'someone-else')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.cancel('r1', 'u1')).resolves.toEqual({ id: 'r1', status: 'CANCELLED' });
  });

  it('summary counts waiting riders per stop and clear marks them picked up', async () => {
    await expect(service.summary(routeId)).resolves.toEqual([{ stopId, waiting: 3 }]);
    await expect(service.clear(stopId)).resolves.toEqual({ stopId, pickedUp: 2 });
  });

  it('stats returns demand per stop with names', async () => {
    await expect(service.stats()).resolves.toEqual([
      { stopId, stopName: 'ป้าย A', routeName: 'สาย 1', requests: 3 },
    ]);
  });
});
