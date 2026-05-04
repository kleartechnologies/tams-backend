import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateItineraryDto, UpdateItineraryDto } from './itinerary.dto';

@Injectable()
export class ItineraryService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPackageExists(packageId: string) {
    const pkg = await this.prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException(`Package ${packageId} not found`);
  }

  async findAll(packageId: string) {
    await this.assertPackageExists(packageId);
    return this.prisma.packageItinerary.findMany({
      where: { packageId },
      orderBy: { dayNumber: 'asc' },
    });
  }

  async create(packageId: string, dto: CreateItineraryDto) {
    await this.assertPackageExists(packageId);

    const existing = await this.prisma.packageItinerary.findUnique({
      where: { packageId_dayNumber: { packageId, dayNumber: dto.dayNumber } },
    });
    if (existing) {
      throw new ConflictException(`Day ${dto.dayNumber} already exists for this package`);
    }

    return this.prisma.packageItinerary.create({
      data: { packageId, ...dto },
    });
  }

  async update(packageId: string, itemId: string, dto: UpdateItineraryDto) {
    const item = await this.prisma.packageItinerary.findFirst({
      where: { id: itemId, packageId },
    });
    if (!item) throw new NotFoundException(`Itinerary item ${itemId} not found`);

    if (dto.dayNumber && dto.dayNumber !== item.dayNumber) {
      const conflict = await this.prisma.packageItinerary.findUnique({
        where: { packageId_dayNumber: { packageId, dayNumber: dto.dayNumber } },
      });
      if (conflict) {
        throw new ConflictException(`Day ${dto.dayNumber} already exists for this package`);
      }
    }

    return this.prisma.packageItinerary.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async remove(packageId: string, itemId: string) {
    const item = await this.prisma.packageItinerary.findFirst({
      where: { id: itemId, packageId },
    });
    if (!item) throw new NotFoundException(`Itinerary item ${itemId} not found`);
    return this.prisma.packageItinerary.delete({ where: { id: itemId } });
  }
}
