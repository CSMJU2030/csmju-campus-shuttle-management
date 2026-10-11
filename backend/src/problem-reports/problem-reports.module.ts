import { Module } from '@nestjs/common';
import { ProblemReportsController } from './problem-reports.controller';
import { ProblemReportsService } from './problem-reports.service';

@Module({
  controllers: [ProblemReportsController],
  providers: [ProblemReportsService],
})
export class ProblemReportsModule {}
