import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShuttleRouteDto } from './dto/create-shuttle-route.dto';
import { FindShuttleRoutesDto } from './dto/find-shuttle-routes.dto';
import { UpdateShuttleRouteDto } from './dto/update-shuttle-route.dto';

const WITH_STOPS = { stops: { orderBy: { sequence: 'asc' as const } } };

@Injectable()
export class ShuttleRoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindShuttleRoutesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      ...(query.keyword ? { name: { contains: query.keyword, mode: 'insensitive' as const } } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.shuttleRoute.findMany({
        where,
        include: WITH_STOPS,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.shuttleRoute.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const route = await this.prisma.shuttleRoute.findUnique({ where: { id }, include: WITH_STOPS });
    if (!route) {
      throw new NotFoundException('ShuttleRoute not found');
    }
    return route;
  }

  create(dto: CreateShuttleRouteDto) {
    const { stops = [], ...route } = dto;
    return this.prisma.shuttleRoute.create({
      data: {
        ...route,
        stops: { create: stops.map((stop, index) => ({ ...stop, sequence: index + 1 })) },
      },
      include: WITH_STOPS,
    });
  }

  async update(id: string, dto: UpdateShuttleRouteDto) {
    await this.findOne(id);
    const { stops, ...route } = dto;
    return this.prisma.shuttleRoute.update({
      where: { id },
      data: {
        ...route,
        ...(stops
          ? {
              stops: {
                deleteMany: {},
                create: stops.map((stop, index) => ({ ...stop, sequence: index + 1 })),
              },
            }
          : {}),
      },
      include: WITH_STOPS,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.shuttleRoute.delete({ where: { id } });
  }
}
