import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { CreateShuttleRouteDto } from './dto/create-shuttle-route.dto';
import { FindShuttleRoutesDto } from './dto/find-shuttle-routes.dto';
import { UpdateShuttleRouteDto } from './dto/update-shuttle-route.dto';
import { ShuttleRoutesService } from './shuttle-routes.service';

@Controller('v1/shuttle-routes')
export class ShuttleRoutesController {
  constructor(private readonly shuttleRoutesService: ShuttleRoutesService) {}

  @Get()
  @RequirePermissions(Permission.SHUTTLE_READ_ANY)
  async findAll(@Query() query: FindShuttleRoutesDto) {
    const { data, total } = await this.shuttleRoutesService.findAll(query);
    return new CollectionResult(data, buildPaginationMeta(total, query.page ?? 1, query.limit ?? 20));
  }

  @Get(':id')
  @RequirePermissions(Permission.SHUTTLE_READ_ANY)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shuttleRoutesService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.SHUTTLE_MANAGE)
  create(@Body() dto: CreateShuttleRouteDto) {
    return this.shuttleRoutesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.SHUTTLE_MANAGE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateShuttleRouteDto) {
    return this.shuttleRoutesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.SHUTTLE_MANAGE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.shuttleRoutesService.remove(id);
  }
}
