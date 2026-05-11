import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';
import { PLANS, PlanKey } from '../plans/plans';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  async listUsers(agencyId: string) {
    return this.prisma.user.findMany({
      where: { agencyId },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteUser(agencyId: string, requesterId: string, dto: InviteUserDto) {
    const email = dto.email.trim().toLowerCase();

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

    const existingInDb = await this.prisma.user.findUnique({ where: { email } });
    if (existingInDb) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const { data, error } = await this.supabaseAdmin.createAuthUser({
      email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { full_name: dto.fullName.trim() },
    });

    if (error || !data.user) {
      throw new BadRequestException(error?.message ?? 'Failed to create auth user.');
    }

    const supabaseUserId = data.user.id;

    try {
      return await this.prisma.user.create({
        data: {
          id: supabaseUserId,
          email,
          fullName: dto.fullName.trim(),
          agencyId,
          role: dto.role,
        },
        select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      });
    } catch {
      await this.supabaseAdmin.deleteAuthUser(supabaseUserId);
      throw new InternalServerErrorException('Failed to save team member. Please try again.');
    }
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
