import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { PackagesService } from '../packages/packages.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { Prisma } from '@prisma/client';
import { PLANS, PlanKey } from '../plans/plans';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly packagesService: PackagesService,
  ) {}

  async create(agencyId: string, dto: CreateBookingDto) {
    // ── Plan limit enforcement ────────────────────────────────────────────────
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { plan: true },
    });

    if (agency) {
      const planKey = (agency.plan as PlanKey) in PLANS ? (agency.plan as PlanKey) : 'FREE';
      const plan = PLANS[planKey];

      if (plan.maxBookings !== Infinity) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const monthlyBookings = await this.prisma.booking.count({
          where: { agencyId, createdAt: { gte: startOfMonth, lt: endOfMonth } },
        });

        if (monthlyBookings >= plan.maxBookings) {
          throw new BadRequestException(
            `Booking limit reached (${monthlyBookings}/${plan.maxBookings} this month). Please upgrade your plan.`,
          );
        }
      }
    }

    // Validate ownership outside the transaction (read-only, no locks needed)
    await this.customersService.findOne(dto.customerId, agencyId);
    await this.packagesService.findOne(dto.packageId, agencyId);

    return this.prisma.$transaction(async (tx) => {
      // ── Seat availability check with row-level lock ──────────────────────
      if (dto.departureId) {
        // Lock the row — any concurrent transaction must wait until we commit.
        // We read quota here; booked count comes from actual bookings below.
        const [dep] = await tx.$queryRaw<{ id: string; quota: number }[]>`
          SELECT id, quota
          FROM package_departures
          WHERE id = ${dto.departureId}
          FOR UPDATE
        `;

        if (!dep) {
          throw new NotFoundException('Departure not found');
        }

        // Count real non-cancelled pax for this departure (immune to stale
        // bookedCount — e.g. bookings created before seat tracking was added).
        const agg = await tx.booking.aggregate({
          where: {
            departureId: dto.departureId,
            status: { not: 'CANCELLED' },
          },
          _sum: { totalPax: true },
        });

        const actualBooked = Number(agg._sum.totalPax ?? 0);
        const available    = dep.quota - actualBooked;
        const requested    = dto.requestedSeats ?? 1;

        if (requested > available) {
          throw new BadRequestException(
            available > 0
              ? `Only ${available} seat(s) available for this departure`
              : 'This departure is fully booked',
          );
        }
      }

      // ── Generate booking number ──────────────────────────────────────────
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const dateStr    = now.toISOString().slice(0, 10).replace(/-/g, '');

      const countToday = await tx.booking.count({
        where: { agencyId, createdAt: { gte: startOfDay, lt: endOfDay } },
      });

      const bookingNumber = `BKG-${dateStr}-${String(countToday + 1).padStart(2, '0')}`;

      // ── Create booking ───────────────────────────────────────────────────
      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          agencyId,
          customerId:      dto.customerId,
          packageId:       dto.packageId,
          departureId:     dto.departureId,
          departureDate:   dto.departureDate ? new Date(dto.departureDate) : undefined,
          totalPax:        dto.requestedSeats ?? 0,
          status:          'INQUIRY',
          subtotal:        new Prisma.Decimal(dto.subtotal),
          sstRate:         dto.sstRate,
          sstAmount:       new Prisma.Decimal(dto.sstAmount),
          totalAmount:     new Prisma.Decimal(dto.totalAmount),
          totalPaid:       new Prisma.Decimal(0),
          balanceDue:      new Prisma.Decimal(dto.totalAmount),
          specialRequests: dto.specialRequests,
        },
        include: {
          customer: { select: { id: true, fullName: true, phone: true } },
          package:  { select: { id: true, name: true, type: true } },
        },
      });

      // ── Increment departure seat count ───────────────────────────────────
      if (dto.departureId && dto.requestedSeats) {
        await tx.packageDeparture.update({
          where: { id: dto.departureId },
          data:  { bookedCount: { increment: dto.requestedSeats } },
        });
      }

      return booking;
    });
  }

  async findAll(agencyId: string, query: QueryBookingDto) {
    const { status, customerId, packageId, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { agencyId };

    if (status)     where.status     = status;
    if (customerId) where.customerId = customerId;
    if (packageId)  where.packageId  = packageId;

    if (dateFrom || dateTo) {
      where.bookingDate = {};
      if (dateFrom) where.bookingDate.gte = new Date(dateFrom);
      if (dateTo)   where.bookingDate.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, fullName: true, phone: true } },
          package:  { select: { id: true, name: true, type: true } },
          _count:   { select: { travelers: true, payments: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, agencyId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, agencyId },
      include: {
        customer:  true,
        package:   true,
        departure: true,
        travelers: { orderBy: { createdAt: 'asc' } },
        payments:  { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id ${id} not found`);
    }

    return booking;
  }

  async update(id: string, agencyId: string, dto: UpdateBookingDto) {
    const booking = await this.findOne(id, agencyId);

    if (dto.status === 'CANCELLED' && booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.BookingUpdateInput = {};

      if (dto.status !== undefined)          data.status          = dto.status;
      if (dto.specialRequests !== undefined) data.specialRequests = dto.specialRequests;

      if (dto.totalAmount !== undefined) {
        data.totalAmount = dto.totalAmount;
        data.balanceDue  = dto.totalAmount - Number(booking.totalPaid);
      }

      const updated = await tx.booking.update({ where: { id }, data });

      // ── Release seats when cancelling ────────────────────────────────────
      if (
        dto.status === 'CANCELLED' &&
        booking.status !== 'CANCELLED' &&
        booking.departureId &&
        booking.totalPax > 0
      ) {
        await tx.packageDeparture.update({
          where: { id: booking.departureId },
          data:  { bookedCount: { decrement: booking.totalPax } },
        });
      }

      return updated;
    });
  }

  async remove(id: string, agencyId: string) {
    const booking = await this.findOne(id, agencyId);

    return this.prisma.$transaction(async (tx) => {
      await tx.booking.delete({ where: { id } });

      // ── Release seats when deleting a non-cancelled booking ──────────────
      if (
        booking.status !== 'CANCELLED' &&
        booking.departureId &&
        booking.totalPax > 0
      ) {
        await tx.packageDeparture.update({
          where: { id: booking.departureId },
          data:  { bookedCount: { decrement: booking.totalPax } },
        });
      }
    });
  }
}
