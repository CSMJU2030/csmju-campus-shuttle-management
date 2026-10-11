import { ServiceReviewsService } from './service-reviews.service';

describe('ServiceReviewsService', () => {
  it('create stores the reviewer and summary rounds the average', async () => {
    const prisma: any = {
      serviceReview: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'v1', ...data })),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.26 }, _count: { _all: 7 } }),
      },
    };
    const service = new ServiceReviewsService(prisma);
    const review = await service.create({ rating: 5, comment: 'คนขับสุภาพ' }, 'u1');
    expect(review.reviewedByCoreUserId).toBe('u1');
    await expect(service.summary()).resolves.toEqual({ average: 4.3, count: 7 });
  });

  it('summary is 0 when there is no review yet', async () => {
    const prisma: any = {
      serviceReview: { aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: { _all: 0 } }) },
    };
    await expect(new ServiceReviewsService(prisma).summary()).resolves.toEqual({ average: 0, count: 0 });
  });
});
