import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRideRequestDto, FindRideRequestsDto } from './dto/ride-request.dto';

/** A waiting request older than this is treated as stale (rider left). */
const WAITING_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class RideRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  private freshSince(): Date {
    return new Date(Date.now() - WAITING_TTL_MS);
  }

  /** One active request per rider: calling again moves it to the new stop. */
  async create(dto: CreateRideRequestDto, coreUserId: string) {
    const stop = await this.prisma.shuttleStop.findUnique({ where: { id: dto.stopId } });
    if (!stop) throw new NotFoundException('ShuttleStop not found');
    if (stop.routeId !== dto.routeId) throw new BadRequestException('stopId does not belong to routeId');
    await this.prisma.rideRequest.updateMany({
      where: { requestedByCoreUserId: coreUserId, status: 'WAITING' },
      data: { status: 'CANCELLED' },
    });
    return this.prisma.rideRequest.create({
      data: { routeId: dto.routeId, stopId: dto.stopId, requestedByCoreUserId: coreUserId },
    });
  }

  /** The rider's own active request (or null). */
  findMine(coreUserId: string) {
    return this.prisma.rideRequest.findFirst({
      where: { requestedByCoreUserId: coreUserId, status: 'WAITING', createdAt: { gte: this.freshSince() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(id: string, coreUserId: string) {
    const request = await this.prisma.rideRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('RideRequest not found');
    if (request.requestedByCoreUserId !== coreUserId) throw new ForbiddenException('Not your ride request');
    return this.prisma.rideRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  /** Number of riders waiting at each stop (driver panel + rider view). */
  async summary(routeId?: string) {
    const groups = await this.prisma.rideRequest.groupBy({
      by: ['stopId'],
      where: { status: 'WAITING', createdAt: { gte: this.freshSince() }, ...(routeId ? { routeId } : {}) },
      _count: { _all: true },
    });
    return groups.map((group) => ({ stopId: group.stopId, waiting: group._count._all }));
  }

  /** Driver picked everyone up at this stop. */
  async clear(stopId: string) {
    const result = await this.prisma.rideRequest.updateMany({
      where: { stopId, status: 'WAITING' },
      data: { status: 'PICKED_UP' },
    });
    return { stopId, pickedUp: result.count };
  }

  async findAll(query: FindRideRequestsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      ...(query.routeId ? { routeId: query.routeId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.rideRequest.findMany({
        where,
        include: { stop: { select: { name: true, sequence: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.rideRequest.count({ where }),
    ]);
    return { data, total };
  }

  /** Demand per stop over the last 30 days (admin "heatmap"). */
  async stats() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const groups = await this.prisma.rideRequest.groupBy({
      by: ['stopId'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
    const stops = await this.prisma.shuttleStop.findMany({
      where: { id: { in: groups.map((group) => group.stopId) } },
      select: { id: true, name: true, route: { select: { name: true } } },
    });
    return groups
      .map((group) => {
        const stop = stops.find((item) => item.id === group.stopId);
        return {
          stopId: group.stopId,
          stopName: stop?.name ?? '-',
          routeName: stop?.route.name ?? '-',
          requests: group._count._all,
        };
      })
      .sort((a, b) => b.requests - a.requests);
  }
}
