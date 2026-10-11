import { NotFoundException } from '@nestjs/common';
import { LostItemsService } from './lost-items.service';

describe('LostItemsService', () => {
  let prisma: any;
  let service: LostItemsService;

  beforeEach(() => {
    prisma = {
      lostItem: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'l1', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue({ id: 'l1' }),
        update: jest.fn().mockResolvedValue({ id: 'l1', status: 'RETURNED' }),
      },
    };
    service = new LostItemsService(prisma);
  });

  it('create stores the reporter core_user_id', async () => {
    const item = await service.create({ type: 'LOST', description: 'กระเป๋าสีดำ' }, 'u1');
    expect(item.reportedByCoreUserId).toBe('u1');
  });

  it('riders see their own reports plus found items; managers see all', async () => {
    await service.findAll({} as any, 'u1', false);
    expect(prisma.lostItem.findMany.mock.calls[0][0].where).toEqual({
      OR: [{ reportedByCoreUserId: 'u1' }, { type: 'FOUND' }],
    });
    await service.findAll({ status: 'OPEN' } as any, 'u1', true);
    expect(prisma.lostItem.findMany.mock.calls[1][0].where).toEqual({ status: 'OPEN' });
  });

  it('update returns 404 for a missing item', async () => {
    prisma.lostItem.findUnique.mockResolvedValue(null);
    await expect(service.update('x', { status: 'RETURNED' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
