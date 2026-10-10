import { PartialType } from '@nestjs/mapped-types';
import { CreateShuttleRouteDto } from './create-shuttle-route.dto';

/** Sending `stops` replaces the whole stop list of the route. */
export class UpdateShuttleRouteDto extends PartialType(CreateShuttleRouteDto) {}
