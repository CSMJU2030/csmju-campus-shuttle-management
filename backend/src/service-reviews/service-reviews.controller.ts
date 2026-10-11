import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { CreateServiceReviewDto, FindServiceReviewsDto } from './dto/service-review.dto';
import { ServiceReviewsService } from './service-reviews.service';

@Controller('v1/service-reviews')
export class ServiceReviewsController {
  constructor(private readonly serviceReviewsService: ServiceReviewsService) {}

  @Get()
  @RequirePermissions(Permission.REVIEW_READ_ANY)
  async findAll(@Query() query: FindServiceReviewsDto) {
    const { data, total } = await this.serviceReviewsService.findAll(query);
    return new CollectionResult(data, buildPaginationMeta(total, query.page ?? 1, query.limit ?? 20));
  }

  @Get('summary')
  @RequirePermissions(Permission.REVIEW_READ_ANY)
  summary() {
    return this.serviceReviewsService.summary();
  }

  @Post()
  @RequirePermissions(Permission.REVIEW_CREATE)
  create(@Body() dto: CreateServiceReviewDto, @CurrentUser() user: CoreHubIdentity) {
    return this.serviceReviewsService.create(dto, user.id);
  }
}
