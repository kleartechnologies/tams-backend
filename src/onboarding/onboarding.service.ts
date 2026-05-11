import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';

const DEFAULTS = {
  onboardingCompleted: false,
  tourCompleted: false,
  checklistDismissed: false,
  hasCreatedPackage: false,
  hasCreatedBooking: false,
  hasAddedPayment: false,
  hasGeneratedInvoice: false,
  hasInvitedTeamMember: false,
};

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getState(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingProgress: true },
    });
    return { ...DEFAULTS, ...(user?.onboardingProgress as Record<string, unknown> ?? {}) };
  }

  async updateState(userId: string, patch: UpdateOnboardingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingProgress: true },
    });
    const current = (user?.onboardingProgress as Record<string, unknown>) ?? {};
    const updated = { ...DEFAULTS, ...current, ...patch };
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingProgress: updated },
    });
    return updated;
  }

  async resetProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingProgress: true },
    });
    const current = (user?.onboardingProgress as Record<string, unknown>) ?? {};
    const reset = {
      ...DEFAULTS,
      onboardingCompleted: current.onboardingCompleted ?? false,
    };
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingProgress: reset },
    });
    return reset;
  }
}
