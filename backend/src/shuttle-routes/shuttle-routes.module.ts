import { Module } from '@nestjs/common';
import { ShuttleRoutesController } from './shuttle-routes.controller';
import { ShuttleRoutesService } from './shuttle-routes.service';

@Module({
  controllers: [ShuttleRoutesController],
  providers: [ShuttleRoutesService],
  exports: [ShuttleRoutesService],
})
export class ShuttleRoutesModule {}
