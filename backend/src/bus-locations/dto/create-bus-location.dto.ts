import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, IsOptional, IsUUID } from 'class-validator';
import { PassengerLevel } from '../../../generated/prisma/client';

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
}
