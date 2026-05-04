import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.agencyId!, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryBookingDto) {
    return this.bookingsService.findAll(user.agencyId!, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.findOne(id, user.agencyId!);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(id, user.agencyId!, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.remove(id, user.agencyId!);
  }
}
