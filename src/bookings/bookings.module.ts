import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CustomersModule } from '../customers/customers.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [CustomersModule, PackagesModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
