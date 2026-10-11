import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusLocationDto } from './dto/create-bus-location.dto';
import { FindBusLocationsDto } from './dto/find-bus-locations.dto';

const WITH_STOP = { currentStop: { select: { id: true, name: true, sequence: true } } };

@Injectable()
export class BusLocationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Location history, newest first. */
  async findAll(query: FindBusLocationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.routeId ? { routeId: query.routeId } : {};
    const [data, total] = await Promise.all([
      this.prisma.busLocation.findMany({
        where,
        include: WITH_STOP,
        orderBy: { reportedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.busLocation.count({ where }),
    ]);
    return { data, total };
  }

  /** The newest location of every active route (the frontend polls this every 10–15 s). */
  async findLatest() {
    const routes = await this.prisma.shuttleRoute.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        locations: { orderBy: { reportedAt: 'desc' }, take: 1, include: WITH_STOP },
      },
      orderBy: { name: 'asc' },
    });
    return routes.map((route) => ({
      routeId: route.id,
      routeName: route.name,
      location: route.locations[0] ?? null,
    }));
  }

  async create(dto: CreateBusLocationDto, reportedByCoreUserId: string) {
    const route = await this.prisma.shuttleRoute.findUnique({ where: { id: dto.routeId } });
    if (!route) {
      throw new NotFoundException('ShuttleRoute not found');
    }
    if (dto.currentStopId) {
      const stop = await this.prisma.shuttleStop.findUnique({ where: { id: dto.currentStopId } });
      if (!stop || stop.routeId !== dto.routeId) {
        throw new BadRequestException('currentStopId does not belong to routeId');
      }
    }
    return this.prisma.busLocation.create({
      data: { ...dto, reportedByCoreUserId },
      include: WITH_STOP,
    });
  }
}
