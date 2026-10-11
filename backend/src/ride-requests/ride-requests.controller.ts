import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import type { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import {
  ClearRideRequestsDto,
  CreateRideRequestDto,
  FindRideRequestsDto,
  RideRequestSummaryQueryDto,
} from './dto/ride-request.dto';
import { RideRequestsService } from './ride-requests.service';

@Controller('v1/ride-requests')
export class RideRequestsController {
  constructor(private readonly rideRequestsService: RideRequestsService) {}

  @Get()
  @RequirePermissions(Permission.RIDE_REQUEST_MANAGE)
  async findAll(@Query() query: FindRideRequestsDto) {
    const { data, total } = await this.rideRequestsService.findAll(query);
    return new CollectionResult(data, buildPaginationMeta(total, query.page ?? 1, query.limit ?? 20));
  }

  @Get('summary')
  @RequirePermissions(Permission.SHUTTLE_READ_ANY)
  summary(@Query() query: RideRequestSummaryQueryDto) {
    return this.rideRequestsService.summary(query.routeId);
  }

  @Get('stats')
  @RequirePermissions(Permission.RIDE_REQUEST_MANAGE)
  stats() {
    return this.rideRequestsService.stats();
  }

  @Get('mine')
  @RequirePermissions(Permission.RIDE_REQUEST_CREATE)
  findMine(@CurrentUser() user: CoreHubIdentity) {
    return this.rideRequestsService.findMine(user.id);
  }

  @Post()
  @RequirePermissions(Permission.RIDE_REQUEST_CREATE)
  create(@Body() dto: CreateRideRequestDto, @CurrentUser() user: CoreHubIdentity) {
    return this.rideRequestsService.create(dto, user.id);
  }

  @Post('clear')
  @RequirePermissions(Permission.RIDE_REQUEST_MANAGE)
  clear(@Body() dto: ClearRideRequestsDto) {
    return this.rideRequestsService.clear(dto.stopId);
  }

  @Delete(':id')
  @RequirePermissions(Permission.RIDE_REQUEST_CREATE)
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CoreHubIdentity) {
    return this.rideRequestsService.cancel(id, user.id);
  }
}
