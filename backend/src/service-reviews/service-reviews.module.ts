import { Module } from '@nestjs/common';
import { ServiceReviewsController } from './service-reviews.controller';
import { ServiceReviewsService } from './service-reviews.service';

@Module({
  controllers: [ServiceReviewsController],
  providers: [ServiceReviewsService],
})
export class ServiceReviewsModule {}
