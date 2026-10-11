import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import type { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission, can } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { CreateLostItemDto, FindLostItemsDto, UpdateLostItemDto } from './dto/lost-item.dto';
import { LostItemsService } from './lost-items.service';

@Controller('v1/lost-items')
export class LostItemsController {
  constructor(private readonly lostItemsService: LostItemsService) {}

  @Get()
  @RequirePermissions(Permission.LOST_ITEM_REPORT, Permission.LOST_ITEM_MANAGE)
  async findAll(@Query() query: FindLostItemsDto, @CurrentUser() user: CoreHubIdentity) {
    const canManage = can(user.subsystemRole, Permission.LOST_ITEM_MANAGE);
    const { data, total } = await this.lostItemsService.findAll(query, user.id, canManage);
    return new CollectionResult(data, buildPaginationMeta(total, query.page ?? 1, query.limit ?? 20));
  }

  @Post()
  @RequirePermissions(Permission.LOST_ITEM_REPORT)
  create(@Body() dto: CreateLostItemDto, @CurrentUser() user: CoreHubIdentity) {
    return this.lostItemsService.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.LOST_ITEM_MANAGE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLostItemDto) {
    return this.lostItemsService.update(id, dto);
  }
}
