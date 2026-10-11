import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LostItemStatus, LostItemType } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateLostItemDto {
  @IsEnum(LostItemType)
  type!: LostItemType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  description!: string;

  @IsOptional()
  @IsUUID()
  routeId?: string;
}

export class UpdateLostItemDto {
  @IsEnum(LostItemStatus)
  status!: LostItemStatus;
}

export class FindLostItemsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(LostItemStatus)
  status?: LostItemStatus;

  @IsOptional()
  @IsEnum(LostItemType)
  type?: LostItemType;
}
