import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { CreateBookingTravelerDto } from './dto/create-booking-traveler.dto';
import { UpdateBookingTravelerDto } from './dto/update-booking-traveler.dto';

@Injectable()
export class BookingTravelersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
  ) {}

  async create(bookingId: string, agencyId: string, dto: CreateBookingTravelerDto) {
    await this.bookingsService.findOne(bookingId, agencyId);

    if (!dto.customerId && !dto.fullName) {
      throw new BadRequestException('Either fullName or customerId must be provided');
    }

    let travelerData: any = { bookingId, ...dto };

    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, agencyId },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with id ${dto.customerId} not found`);
      }

      travelerData = {
        ...travelerData,
        fullName: travelerData.fullName ?? customer.fullName,
        phone: travelerData.phone ?? customer.phone,
        icNumber: travelerData.icNumber ?? customer.icNumber,
        passportNumber: travelerData.passportNumber ?? customer.passportNumber,
        nationality: travelerData.nationality ?? customer.nationality,
        dateOfBirth: travelerData.dateOfBirth ?? customer.dateOfBirth,
      };
    }

    return this.prisma.bookingTraveler.create({
      data: {
        ...travelerData,
        dateOfBirth: dto.dateOfBirth
          ? new Date(dto.dateOfBirth)
          : travelerData.dateOfBirth,
        passportExpiry: dto.passportExpiry ? new Date(dto.passportExpiry) : undefined,
      },
    });
  }

  async findAll(bookingId: string, agencyId: string) {
    await this.bookingsService.findOne(bookingId, agencyId);

    return this.prisma.bookingTraveler.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(bookingId: string, agencyId: string, id: string) {
    await this.bookingsService.findOne(bookingId, agencyId);

    const traveler = await this.prisma.bookingTraveler.findFirst({
      where: { id, bookingId },
    });

    if (!traveler) {
      throw new NotFoundException(`Traveler with id ${id} not found in booking ${bookingId}`);
    }

    return traveler;
  }

  async update(bookingId: string, agencyId: string, id: string, dto: UpdateBookingTravelerDto) {
    await this.findOne(bookingId, agencyId, id);

    return this.prisma.bookingTraveler.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        passportExpiry: dto.passportExpiry ? new Date(dto.passportExpiry) : undefined,
      },
    });
  }

  async remove(bookingId: string, agencyId: string, id: string) {
    await this.findOne(bookingId, agencyId, id);
    return this.prisma.bookingTraveler.delete({ where: { id } });
  }
}
