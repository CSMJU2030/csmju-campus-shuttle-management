import { Module } from '@nestjs/common';
import { ShuttleController } from './shuttle/shuttle.controller';
import { ShuttleGateway } from './shuttle/shuttle.gateway';

@Module({
  imports: [],
  controllers: [ShuttleController],
  providers: [ShuttleGateway],
})
export class AppModule {}