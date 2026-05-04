import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLANS, PlanKey } from '../plans/plans';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(agencyId: string) {
    return this.prisma.user.findMany({
      where: { agencyId },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteUser(agencyId: string, requesterId: string, dto: InviteUserDto) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { plan: true },
    });
    if (!agency) throw new NotFoundException('Agency not found');

    const planKey = (agency.plan as PlanKey) in PLANS ? (agency.plan as PlanKey) : 'FREE';
    const plan = PLANS[planKey];

    const currentCount = await this.prisma.user.count({ where: { agencyId } });
    if (currentCount >= plan.maxUsers) {
      throw new BadRequestException(
        `User limit reached (${plan.maxUsers}/${plan.maxUsers}). Please upgrade your plan.`,
      );
    }

    const existing = await this.prisma.user.findUnique({ where: { id: dto.supabaseUserId } });
    if (existing) {
      throw new BadRequestException('This user already exists in the system.');
    }

    return this.prisma.user.create({
      data: {
        id: dto.supabaseUserId,
        email: dto.email,
        agencyId,
        role: dto.role,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });
  }

  async removeUser(agencyId: string, requesterId: string, targetUserId: string) {
    if (requesterId === targetUserId) {
      throw new BadRequestException('You cannot remove yourself.');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, agencyId },
    });
    if (!target) throw new NotFoundException('User not found in this agency');

    await this.prisma.user.delete({ where: { id: targetUserId } });
    return { success: true };
  }
}
