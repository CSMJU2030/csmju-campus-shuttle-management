import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemReportDto, FindProblemReportsDto, UpdateProblemReportDto } from './dto/problem-report.dto';

const WITH_ROUTE = { route: { select: { id: true, name: true } } };

@Injectable()
export class ProblemReportsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProblemReportDto, coreUserId: string) {
    return this.prisma.problemReport.create({
      data: { ...dto, reportedByCoreUserId: coreUserId },
      include: WITH_ROUTE,
    });
  }

  async findAll(query: FindProblemReportsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.status ? { status: query.status } : {};
    const [data, total] = await Promise.all([
      this.prisma.problemReport.findMany({
        where,
        include: WITH_ROUTE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.problemReport.count({ where }),
    ]);
    return { data, total };
  }

  async update(id: string, dto: UpdateProblemReportDto) {
    const item = await this.prisma.problemReport.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('ProblemReport not found');
    return this.prisma.problemReport.update({ where: { id }, data: { status: dto.status }, include: WITH_ROUTE });
  }
}
