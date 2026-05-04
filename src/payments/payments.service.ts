import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
  ) {}

  async create(bookingId: string, agencyId: string, dto: CreatePaymentDto) {
    await this.bookingsService.findOne(bookingId, agencyId);

    return this.prisma.payment.create({
      data: {
        bookingId,
        agencyId,
        ...dto,
        paymentDate: new Date(dto.paymentDate),
      },
    });
  }

  async findAllForBooking(bookingId: string, agencyId: string) {
    await this.bookingsService.findOne(bookingId, agencyId);

    return this.prisma.payment.findMany({
      where: { bookingId, agencyId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findAll(agencyId: string, query: QueryPaymentDto) {
    const { status, paymentMethod, paymentType, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = { agencyId };

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (paymentType) where.paymentType = paymentType;

    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) where.paymentDate.gte = new Date(dateFrom);
      if (dateTo) where.paymentDate.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              customer: { select: { fullName: true, phone: true } },
              package: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(bookingId: string, agencyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, bookingId, agencyId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found in booking ${bookingId}`);
    }

    return payment;
  }

  // ── Dedicated verify action ────────────────────────────────────────────────

  async verify(id: string, agencyId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id, agencyId } });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);

    if (payment.status === 'VERIFIED') return payment;

    const bookingId = payment.bookingId;

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id }, data: { status: 'VERIFIED' } });

      const { _sum } = await tx.payment.aggregate({
        where: { bookingId, status: 'VERIFIED' },
        _sum: { amount: true },
      });

      const totalPaid = _sum.amount ?? new Prisma.Decimal(0);
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      const balanceDue = new Prisma.Decimal(booking!.totalAmount).minus(totalPaid);

      let bookingStatus = booking!.status;
      if (balanceDue.isZero() || balanceDue.isNegative()) {
        bookingStatus = 'COMPLETED';
      } else if (totalPaid.greaterThan(0) && booking!.status === 'INQUIRY') {
        bookingStatus = 'CONFIRMED';
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          totalPaid,
          balanceDue: balanceDue.isNegative() ? new Prisma.Decimal(0) : balanceDue,
          status: bookingStatus,
        },
      });

      return tx.payment.findUnique({ where: { id } });
    });
  }

  // ── Generic update ────────────────────────────────────────────────────────

  async update(bookingId: string, agencyId: string, id: string, dto: UpdatePaymentDto) {
    const payment = await this.findOne(bookingId, agencyId, id);

    const { paymentDate, ...rest } = dto;
    const data: Record<string, any> = { ...rest };
    if (paymentDate) data.paymentDate = new Date(paymentDate);

    const statusChangingToVerified = dto.status === 'VERIFIED' && payment.status !== 'VERIFIED';
    const statusChangingFromVerified =
      payment.status === 'VERIFIED' && dto.status && dto.status !== 'VERIFIED';
    const amountChangingOnVerified =
      payment.status === 'VERIFIED' && !dto.status && dto.amount !== undefined;

    if (statusChangingToVerified || statusChangingFromVerified || amountChangingOnVerified) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.payment.update({ where: { id }, data });

        const { _sum } = await tx.payment.aggregate({
          where: { bookingId, status: 'VERIFIED' },
          _sum: { amount: true },
        });

        const totalPaid = _sum.amount ?? new Prisma.Decimal(0);
        const booking = await tx.booking.findUnique({ where: { id: bookingId } });
        const balanceDue = new Prisma.Decimal(booking!.totalAmount).minus(totalPaid);

        let bookingStatus = booking!.status;
        if (balanceDue.isZero() || balanceDue.isNegative()) {
          bookingStatus = 'COMPLETED';
        } else if (totalPaid.greaterThan(0) && booking!.status === 'INQUIRY') {
          bookingStatus = 'CONFIRMED';
        }

        await tx.booking.update({
          where: { id: bookingId },
          data: {
            totalPaid,
            balanceDue: balanceDue.isNegative() ? new Prisma.Decimal(0) : balanceDue,
            status: bookingStatus,
          },
        });

        return updated;
      });
    }

    return this.prisma.payment.update({ where: { id }, data });
  }

  async remove(bookingId: string, agencyId: string, id: string) {
    const payment = await this.findOne(bookingId, agencyId, id);

    if (payment.status === 'VERIFIED') {
      return this.prisma.$transaction(async (tx) => {
        await tx.payment.delete({ where: { id } });

        const { _sum } = await tx.payment.aggregate({
          where: { bookingId, status: 'VERIFIED' },
          _sum: { amount: true },
        });

        const totalPaid = _sum.amount ?? new Prisma.Decimal(0);
        const booking = await tx.booking.findUnique({ where: { id: bookingId } });

        await tx.booking.update({
          where: { id: bookingId },
          data: {
            totalPaid,
            balanceDue: new Prisma.Decimal(booking!.totalAmount).minus(totalPaid),
          },
        });

        return { deleted: true };
      });
    }

    await this.prisma.payment.delete({ where: { id } });
    return { deleted: true };
  }
}
