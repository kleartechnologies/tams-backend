import { Module } from '@nestjs/common';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { ItineraryController } from './itinerary/itinerary.controller';
import { ItineraryService } from './itinerary/itinerary.service';

@Module({
  controllers: [PackagesController, ItineraryController],
  providers: [PackagesService, ItineraryService],
  exports: [PackagesService],
})
export class PackagesModule {}
