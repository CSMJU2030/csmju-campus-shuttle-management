import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class FindBusLocationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  routeId?: string;
}
