import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDateRange(from?: string, to?: string) {
    const now = new Date();
    const toDate = to
      ? new Date(to + 'T23:59:59.999Z')
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const fromDate = from
      ? new Date(from)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    return { fromDate, toDate };
  }

  async getSummary(agencyId: string, from?: string, to?: string) {
    const { fromDate, toDate } = this.parseDateRange(from, to);
    const periodMs = toDate.getTime() - fromDate.getTime();
    const prevFromDate = new Date(fromDate.getTime() - periodMs);

    const [sales, prevSales, balance, bookingCounts, customerCount, sstAgg] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: { agencyId, status: 'VERIFIED', paymentDate: { gte: fromDate, lte: toDate } },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            agencyId,
            status: 'VERIFIED',
            paymentDate: { gte: prevFromDate, lt: fromDate },
          },
          _sum: { amount: true },
        }),
        this.prisma.booking.aggregate({
          where: { agencyId, status: { notIn: ['CANCELLED', 'COMPLETED'] } },
          _sum: { balanceDue: true },
        }),
        this.prisma.booking.groupBy({
          by: ['status'],
          where: { agencyId, createdAt: { gte: fromDate, lte: toDate } },
          _count: { id: true },
        }),
        this.prisma.customer.count({ where: { agencyId } }),
        this.prisma.booking.aggregate({
          where: {
            agencyId,
            createdAt: { gte: fromDate, lte: toDate },
            status: { notIn: ['CANCELLED'] },
          },
          _sum: { sstAmount: true },
        }),
      ]);

    const totalSales = Number(sales._sum.amount ?? 0);
    const prevTotal = Number(prevSales._sum.amount ?? 0);
    const salesChange =
      prevTotal === 0 ? null : ((totalSales - prevTotal) / prevTotal) * 100;

    const totalBookings = bookingCounts.reduce((s, r) => s + r._count.id, 0);

    return {
      totalSales,
      salesChange,
      outstandingBalance: Number(balance._sum.balanceDue ?? 0),
      totalBookings,
      totalCustomers: customerCount,
      totalSST: Number(sstAgg._sum.sstAmount ?? 0),
      bookingsByStatus: bookingCounts.map((r) => ({
        status: r.status,
        count: r._count.id,
      })),
    };
  }

  async getRevenueTrend(agencyId: string, from?: string, to?: string) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const payments = await this.prisma.payment.findMany({
      where: {
        agencyId,
        status: 'VERIFIED',
        paymentDate: { gte: fromDate, lte: toDate },
      },
      select: { paymentDate: true, amount: true },
      orderBy: { paymentDate: 'asc' },
    });

    const byDate: Record<string, number> = {};
    for (const p of payments) {
      const key = p.paymentDate.toISOString().split('T')[0];
      byDate[key] = (byDate[key] ?? 0) + Number(p.amount);
    }

    const result: { date: string; amount: number }[] = [];
    const cur = new Date(fromDate);
    const end = new Date(toDate);
    while (cur <= end) {
      const key = cur.toISOString().split('T')[0];
      result.push({ date: key, amount: byDate[key] ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }

  async getTopPackages(agencyId: string, from?: string, to?: string) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const bookings = await this.prisma.booking.findMany({
      where: {
        agencyId,
        createdAt: { gte: fromDate, lte: toDate },
        status: { notIn: ['CANCELLED'] },
      },
      select: {
        packageId: true,
        totalAmount: true,
        package: { select: { name: true } },
      },
    });

    const agg: Record<string, { name: string; bookings: number; revenue: number }> = {};
    for (const b of bookings) {
      if (!agg[b.packageId]) {
        agg[b.packageId] = { name: b.package.name, bookings: 0, revenue: 0 };
      }
      agg[b.packageId].bookings++;
      agg[b.packageId].revenue += Number(b.totalAmount);
    }

    return Object.entries(agg)
      .map(([packageId, d]) => ({ packageId, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  async getOutstanding(agencyId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        agencyId,
        balanceDue: { gt: 0 },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        package: { select: { id: true, name: true } },
      },
      orderBy: { balanceDue: 'desc' },
      take: 25,
    });

    return bookings.map((b) => ({
      id: b.id,
      status: b.status,
      totalAmount: Number(b.totalAmount),
      totalPaid: Number(b.totalPaid),
      balanceDue: Number(b.balanceDue),
      customer: b.customer,
      package: b.package,
    }));
  }

  async getUpcoming(agencyId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        agencyId,
        departureDate: { gt: new Date() },
        status: { notIn: ['CANCELLED'] },
      },
      orderBy: { departureDate: 'asc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        package: { select: { id: true, name: true, type: true, destination: true } },
      },
    });

    return { total: bookings.length, bookings };
  }

  async getBookings(agencyId: string, from?: string, to?: string) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const bookings = await this.prisma.booking.findMany({
      where: {
        agencyId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: {
        customer: { select: { fullName: true } },
        package: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      departureDate: b.departureDate?.toISOString() ?? null,
      subtotal: Number(b.subtotal),
      sstRate: b.sstRate,
      sstAmount: Number(b.sstAmount),
      totalAmount: Number(b.totalAmount),
      totalPaid: Number(b.totalPaid),
      balanceDue: Number(b.balanceDue),
      customer: b.customer,
      package: b.package,
    }));
  }
}
