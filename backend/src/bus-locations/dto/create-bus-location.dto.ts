import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsLatitude, IsLongitude, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { BusServiceStatus, PassengerLevel } from '../../../generated/prisma/client';

export class CreateBusLocationDto {
  @IsUUID()
  routeId!: string;

  @IsOptional()
  @IsUUID()
  currentStopId?: string;

  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsEnum(PassengerLevel)
  passengerLevel?: PassengerLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  passengerCount?: number;

  @IsOptional()
  @IsEnum(BusServiceStatus)
  serviceStatus?: BusServiceStatus;
}
