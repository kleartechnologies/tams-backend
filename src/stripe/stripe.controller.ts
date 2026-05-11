import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { StripeService } from './stripe.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  createCheckout(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.stripeService.createCheckoutSession(user.agencyId!, dto.planKey);
  }

  @Post('portal')
  createPortal(@CurrentUser() user: AuthUser) {
    return this.stripeService.createPortalSession(user.agencyId!);
  }

  @Get('subscription')
  getSubscription(@CurrentUser() user: AuthUser) {
    return this.stripeService.getSubscription(user.agencyId!);
  }

  @Post('sync')
  syncSubscription(@CurrentUser() user: AuthUser) {
    return this.stripeService.syncSubscription(user.agencyId!);
  }

  @Public()
  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(req.rawBody!, signature);
  }
}
