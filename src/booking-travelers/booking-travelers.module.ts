import { Module } from '@nestjs/common';
import { BookingTravelersController } from './booking-travelers.controller';
import { BookingTravelersService } from './booking-travelers.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [BookingsModule],
  controllers: [BookingTravelersController],
  providers: [BookingTravelersService],
})
export class BookingTravelersModule {}
