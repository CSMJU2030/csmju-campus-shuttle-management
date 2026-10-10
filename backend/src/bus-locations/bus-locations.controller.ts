import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { BusLocationsService } from './bus-locations.service';
import { CreateBusLocationDto } from './dto/create-bus-location.dto';
import { FindBusLocationsDto } from './dto/find-bus-locations.dto';

@Controller('v1/bus-locations')
export class BusLocationsController {
  constructor(private readonly busLocationsService: BusLocationsService) {}

  @Get()
  @RequirePermissions(Permission.SHUTTLE_READ_ANY)
  async findAll(@Query() query: FindBusLocationsDto) {
    const { data, total } = await this.busLocationsService.findAll(query);
    return new CollectionResult(data, buildPaginationMeta(total, query.page ?? 1, query.limit ?? 20));
  }

  @Get('latest')
  @RequirePermissions(Permission.SHUTTLE_READ_ANY)
  findLatest() {
    return this.busLocationsService.findLatest();
  }

  @Post()
  @RequirePermissions(Permission.BUS_LOCATION_REPORT)
  create(@Body() dto: CreateBusLocationDto, @CurrentUser() user: CoreHubIdentity) {
    return this.busLocationsService.create(dto, user.id);
  }
}
