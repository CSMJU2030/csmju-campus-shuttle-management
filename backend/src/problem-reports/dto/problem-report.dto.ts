import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ProblemCategory, ProblemStatus } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateProblemReportDto {
  @IsEnum(ProblemCategory)
  category!: ProblemCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;

  @IsOptional()
  @IsUUID()
  routeId?: string;
}

export class UpdateProblemReportDto {
  @IsEnum(ProblemStatus)
  status!: ProblemStatus;
}

export class FindProblemReportsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ProblemStatus)
  status?: ProblemStatus;
}
