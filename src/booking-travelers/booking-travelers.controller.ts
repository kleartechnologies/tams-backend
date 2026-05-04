import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { BookingTravelersService } from './booking-travelers.service';
import { CreateBookingTravelerDto } from './dto/create-booking-traveler.dto';
import { UpdateBookingTravelerDto } from './dto/update-booking-traveler.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('bookings/:bookingId/travelers')
export class BookingTravelersController {
  constructor(private readonly bookingTravelersService: BookingTravelersService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateBookingTravelerDto,
  ) {
    return this.bookingTravelersService.create(bookingId, user.agencyId!, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Param('bookingId') bookingId: string) {
    return this.bookingTravelersService.findAll(bookingId, user.agencyId!);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Param('id') id: string,
  ) {
    return this.bookingTravelersService.findOne(bookingId, user.agencyId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBookingTravelerDto,
  ) {
    return this.bookingTravelersService.update(bookingId, user.agencyId!, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Param('id') id: string,
  ) {
    return this.bookingTravelersService.remove(bookingId, user.agencyId!, id);
  }
}
