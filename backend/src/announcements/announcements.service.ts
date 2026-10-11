import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto, FindAnnouncementsDto } from './dto/announcement.dto';

const WITH_ROUTE = { route: { select: { id: true, name: true } } };

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAnnouncementDto, coreUserId: string) {
    return this.prisma.announcement.create({
      data: { ...dto, createdByCoreUserId: coreUserId },
      include: WITH_ROUTE,
    });
  }

  /** Newest first; riders see announcements for every route plus general ones. */
  async findAll(query: FindAnnouncementsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = query.routeId ? { OR: [{ routeId: query.routeId }, { routeId: null }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: WITH_ROUTE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);
    return { data, total };
  }

  async remove(id: string) {
    const item = await this.prisma.announcement.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Announcement not found');
    return this.prisma.announcement.delete({ where: { id } });
  }
}
