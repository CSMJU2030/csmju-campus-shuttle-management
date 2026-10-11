import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RideRequestStatus } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateRideRequestDto {
  @IsUUID()
  routeId!: string;

  @IsUUID()
  stopId!: string;
}

export class ClearRideRequestsDto {
  @IsUUID()
  stopId!: string;
}

export class RideRequestSummaryQueryDto {
  @IsOptional()
  @IsUUID()
  routeId?: string;
}

export class FindRideRequestsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @IsOptional()
  @IsEnum(RideRequestStatus)
  status?: RideRequestStatus;
}
