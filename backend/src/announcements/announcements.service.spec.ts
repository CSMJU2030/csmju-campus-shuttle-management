import { NotFoundException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';

describe('AnnouncementsService', () => {
  let prisma: any;
  let service: AnnouncementsService;

  beforeEach(() => {
    prisma = {
      announcement: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'a1', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
      },
    };
    service = new AnnouncementsService(prisma);
  });

  it('create stores the author core_user_id', async () => {
    const item = await service.create({ message: 'รถออกช้า 5 นาที' }, 'u1');
    expect(item.createdByCoreUserId).toBe('u1');
  });

  it('route filter also includes general announcements', async () => {
    await service.findAll({ routeId: 'r1' } as any);
    expect(prisma.announcement.findMany.mock.calls[0][0].where).toEqual({
      OR: [{ routeId: 'r1' }, { routeId: null }],
    });
  });

  it('remove returns 404 for a missing announcement', async () => {
    await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.announcement.delete).not.toHaveBeenCalled();
  });
});
