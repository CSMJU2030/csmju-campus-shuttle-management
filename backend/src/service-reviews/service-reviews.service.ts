import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceReviewDto, FindServiceReviewsDto } from './dto/service-review.dto';

@Injectable()
export class ServiceReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateServiceReviewDto, coreUserId: string) {
    return this.prisma.serviceReview.create({ data: { ...dto, reviewedByCoreUserId: coreUserId } });
  }

  async findAll(query: FindServiceReviewsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.routeId ? { routeId: query.routeId } : {};
    const [data, total] = await Promise.all([
      this.prisma.serviceReview.findMany({
        where,
        include: { route: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.serviceReview.count({ where }),
    ]);
    return { data, total };
  }

  async summary() {
    const result = await this.prisma.serviceReview.aggregate({ _avg: { rating: true }, _count: { _all: true } });
    const average = result._avg.rating ?? 0;
    return { average: Math.round(average * 10) / 10, count: result._count._all };
  }
}
