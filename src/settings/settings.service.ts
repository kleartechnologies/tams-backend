import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(agencyId: string) {
    return this.prisma.agencySetting.upsert({
      where: { agencyId },
      create: { agencyId, agencyName: 'TAMS', agencyTag: 'Travel Agency Management System' },
      update: {},
    });
  }

  async update(agencyId: string, dto: UpdateSettingsDto) {
    const { motacExpiryDate, ...rest } = dto;
    const data = {
      ...rest,
      ...(motacExpiryDate !== undefined && {
        motacExpiryDate: motacExpiryDate ? new Date(motacExpiryDate) : null,
      }),
    };
    return this.prisma.agencySetting.upsert({
      where: { agencyId },
      create: { agencyId, agencyName: 'TAMS', agencyTag: 'Travel Agency Management System', ...data },
      update: data,
    });
  }
}
