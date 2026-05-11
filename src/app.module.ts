import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { PackagesModule } from './packages/packages.module';
import { BookingsModule } from './bookings/bookings.module';
import { BookingTravelersModule } from './booking-travelers/booking-travelers.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { PdfModule } from './pdf/pdf.module';
import { PlansModule } from './plans/plans.module';
import { TeamModule } from './team/team.module';
import { StripeModule } from './stripe/stripe.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RequireAgencyGuard } from './auth/require-agency.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CustomersModule,
    PackagesModule,
    BookingsModule,
    BookingTravelersModule,
    PaymentsModule,
    ReportsModule,
    SettingsModule,
    PdfModule,
    PlansModule,
    TeamModule,
    StripeModule,
    OnboardingModule,
  ],
  providers: [
    // Order matters: JWT runs first (sets request.user), then agency check
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RequireAgencyGuard },
  ],
})
export class AppModule {}
