import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import type { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, FindAnnouncementsDto } from './dto/announcement.dto';

@Controller('v1/announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @RequirePermissions(Permission.SHUTTLE_READ_ANY)
  async findAll(@Query() query: FindAnnouncementsDto) {
    const { data, total } = await this.announcementsService.findAll(query);
    return new CollectionResult(data, buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10));
  }

  @Post()
  @RequirePermissions(Permission.ANNOUNCEMENT_CREATE)
  create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: CoreHubIdentity) {
    return this.announcementsService.create(dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(Permission.ANNOUNCEMENT_CREATE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.announcementsService.remove(id);
  }
}
