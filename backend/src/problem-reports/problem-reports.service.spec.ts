import { NotFoundException } from '@nestjs/common';
import { ProblemReportsService } from './problem-reports.service';

describe('ProblemReportsService', () => {
  let prisma: any;
  let service: ProblemReportsService;

  beforeEach(() => {
    prisma = {
      problemReport: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'p1', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };
    service = new ProblemReportsService(prisma);
  });

  it('create stores the reporter core_user_id', async () => {
    const item = await service.create({ category: 'LATE', message: 'รถมาช้า 20 นาที' }, 'u1');
    expect(item.reportedByCoreUserId).toBe('u1');
  });

  it('findAll filters by status, newest first', async () => {
    await service.findAll({ status: 'OPEN' } as any);
    const args = prisma.problemReport.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ status: 'OPEN' });
    expect(args.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('update returns 404 for a missing report', async () => {
    await expect(service.update('x', { status: 'RESOLVED' })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.problemReport.update).not.toHaveBeenCalled();
  });
});
