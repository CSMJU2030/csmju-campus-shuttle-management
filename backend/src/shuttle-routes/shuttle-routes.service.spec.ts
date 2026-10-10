import { NotFoundException } from '@nestjs/common';
import { ShuttleRoutesService } from './shuttle-routes.service';

describe('ShuttleRoutesService', () => {
  const route = { id: '11111111-1111-4111-8111-111111111111', name: 'สาย 1', stops: [] };
  let prisma: any;
  let service: ShuttleRoutesService;

  beforeEach(() => {
    prisma = {
      shuttleRoute: {
        findMany: jest.fn().mockResolvedValue([route]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue(route),
        create: jest.fn().mockResolvedValue(route),
        update: jest.fn().mockResolvedValue(route),
        delete: jest.fn().mockResolvedValue(route),
      },
    };
    service = new ShuttleRoutesService(prisma);
  });

  it('findAll paginates and filters by keyword', async () => {
    const result = await service.findAll({ page: 2, limit: 5, keyword: 'สาย' } as any);
    expect(result).toEqual({ data: [route], total: 1 });
    const args = prisma.shuttleRoute.findMany.mock.calls[0][0];
    expect(args.skip).toBe(5);
    expect(args.take).toBe(5);
    expect(args.where.name.contains).toBe('สาย');
  });

  it('findOne throws 404 when the route does not exist', async () => {
    prisma.shuttleRoute.findUnique.mockResolvedValue(null);
    await expect(service.findOne(route.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create numbers stops in order', async () => {
    await service.create({
      name: 'สาย 9',
      stops: [
        { name: 'A', latitude: 18.89, longitude: 99.0 },
        { name: 'B', latitude: 18.9, longitude: 99.01 },
      ],
    });
    const created = prisma.shuttleRoute.create.mock.calls[0][0].data.stops.create;
    expect(created.map((stop: any) => stop.sequence)).toEqual([1, 2]);
  });

  it('update replaces stops only when stops are sent', async () => {
    await service.update(route.id, { name: 'ใหม่' });
    expect(prisma.shuttleRoute.update.mock.calls[0][0].data.stops).toBeUndefined();
    await service.update(route.id, { stops: [{ name: 'C', latitude: 18.8, longitude: 99.0 }] });
    expect(prisma.shuttleRoute.update.mock.calls[1][0].data.stops.deleteMany).toEqual({});
  });

  it('update and remove throw 404 for a missing route', async () => {
    prisma.shuttleRoute.findUnique.mockResolvedValue(null);
    await expect(service.update(route.id, { name: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(route.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.shuttleRoute.delete).not.toHaveBeenCalled();
  });
});
