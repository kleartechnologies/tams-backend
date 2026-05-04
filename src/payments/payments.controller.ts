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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('bookings/:bookingId/payments')
  create(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(bookingId, user.agencyId!, dto);
  }

  @Get('bookings/:bookingId/payments')
  findAllForBooking(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
  ) {
    return this.paymentsService.findAllForBooking(bookingId, user.agencyId!);
  }

  @Get('payments')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryPaymentDto) {
    return this.paymentsService.findAll(user.agencyId!, query);
  }

  @Patch('payments/:id/verify')
  verify(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.paymentsService.verify(id, user.agencyId!);
  }

  @Patch('bookings/:bookingId/payments/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(bookingId, user.agencyId!, id, dto);
  }

  @Delete('bookings/:bookingId/payments/:id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Param('id') id: string,
  ) {
    return this.paymentsService.remove(bookingId, user.agencyId!, id);
  }
}
