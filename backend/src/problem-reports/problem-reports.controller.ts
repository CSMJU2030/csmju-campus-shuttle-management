import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import type { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { CreateProblemReportDto, FindProblemReportsDto, UpdateProblemReportDto } from './dto/problem-report.dto';
import { ProblemReportsService } from './problem-reports.service';

@Controller('v1/problem-reports')
export class ProblemReportsController {
  constructor(private readonly problemReportsService: ProblemReportsService) {}

  @Get()
  @RequirePermissions(Permission.PROBLEM_REPORT_MANAGE)
  async findAll(@Query() query: FindProblemReportsDto) {
    const { data, total } = await this.problemReportsService.findAll(query);
    return new CollectionResult(data, buildPaginationMeta(total, query.page ?? 1, query.limit ?? 20));
  }

  @Post()
  @RequirePermissions(Permission.PROBLEM_REPORT_CREATE)
  create(@Body() dto: CreateProblemReportDto, @CurrentUser() user: CoreHubIdentity) {
    return this.problemReportsService.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.PROBLEM_REPORT_MANAGE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProblemReportDto) {
    return this.problemReportsService.update(id, dto);
  }
}
