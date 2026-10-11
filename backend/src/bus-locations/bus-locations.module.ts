import { Module } from '@nestjs/common';
import { BusLocationsController } from './bus-locations.controller';
import { BusLocationsService } from './bus-locations.service';

@Module({
  controllers: [BusLocationsController],
  providers: [BusLocationsService],
})
export class BusLocationsModule {}
