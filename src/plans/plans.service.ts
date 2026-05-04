import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLANS, PlanKey } from './plans';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsage(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { plan: true },
    });

    if (!agency) throw new NotFoundException('Agency not found');

    const planKey = (agency.plan as PlanKey) in PLANS ? (agency.plan as PlanKey) : 'FREE';
    const plan = PLANS[planKey];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [monthlyBookings, totalUsers] = await Promise.all([
      this.prisma.booking.count({
        where: { agencyId, createdAt: { gte: startOfMonth, lt: endOfMonth } },
      }),
      this.prisma.user.count({ where: { agencyId } }),
    ]);

    return {
      plan: planKey,
      planName: plan.name,
      maxBookings: plan.maxBookings === Infinity ? null : plan.maxBookings,
      maxUsers: plan.maxUsers,
      monthlyBookings,
      totalUsers,
    };
  }
}
