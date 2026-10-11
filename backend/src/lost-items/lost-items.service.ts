import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLostItemDto, FindLostItemsDto, UpdateLostItemDto } from './dto/lost-item.dto';

const WITH_ROUTE = { route: { select: { id: true, name: true } } };

@Injectable()
export class LostItemsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateLostItemDto, coreUserId: string) {
    return this.prisma.lostItem.create({
      data: { ...dto, reportedByCoreUserId: coreUserId },
      include: WITH_ROUTE,
    });
  }

  /** Managers see everything; riders see what they reported plus the public board of found items. */
  async findAll(query: FindLostItemsDto, coreUserId: string, canManage: boolean) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      ...(canManage ? {} : { OR: [{ reportedByCoreUserId: coreUserId }, { type: 'FOUND' as const }] }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.lostItem.findMany({
        where,
        include: WITH_ROUTE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lostItem.count({ where }),
    ]);
    return { data, total };
  }

  async update(id: string, dto: UpdateLostItemDto) {
    const item = await this.prisma.lostItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('LostItem not found');
    return this.prisma.lostItem.update({ where: { id }, data: { status: dto.status }, include: WITH_ROUTE });
  }
}
