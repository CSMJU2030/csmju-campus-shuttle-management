import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  message!: string;

  @IsOptional()
  @IsUUID()
  routeId?: string;
}

export class FindAnnouncementsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  routeId?: string;
}
