import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingTravelerDto } from './create-booking-traveler.dto';

export class UpdateBookingTravelerDto extends PartialType(CreateBookingTravelerDto) {}
