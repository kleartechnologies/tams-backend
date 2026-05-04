import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackageDto } from './dto/query-package.dto';
import { CreatePackageDepartureDto } from './dto/create-package-departure.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(agencyId: string, dto: CreatePackageDto) {
    const { inclusions, ...rest } = dto;
    return this.prisma.package.create({
      data: {
        ...rest,
        agencyId,
        ...(inclusions !== undefined && {
          inclusions: inclusions as unknown as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async findAll(agencyId: string, query: QueryPackageDto) {
    const { type, destination, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PackageWhereInput = { agencyId };
    if (type) where.type = type;
    if (destination) where.destination = { contains: destination, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { departures: true, bookings: true } },
          departures: {
            where: { departureDate: { gte: new Date() } },
            orderBy: { departureDate: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.package.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, agencyId: string) {
    const pkg = await this.prisma.package.findFirst({
      where: { id, agencyId },
      include: {
        _count: { select: { bookings: true } },
        departures: { orderBy: { departureDate: 'asc' } },
        itinerary: { orderBy: { dayNumber: 'asc' } },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Package with id ${id} not found`);
    }

    return pkg;
  }

  async update(id: string, agencyId: string, dto: UpdatePackageDto) {
    await this.findOne(id, agencyId);
    const { inclusions, ...rest } = dto;
    return this.prisma.package.update({
      where: { id },
      data: {
        ...rest,
        ...(inclusions !== undefined && {
          inclusions: inclusions as unknown as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async remove(id: string, agencyId: string) {
    await this.findOne(id, agencyId);

    const bookingCount = await this.prisma.booking.count({
      where: { packageId: id, agencyId },
    });
    if (bookingCount > 0) {
      throw new ConflictException(
        `Cannot delete package with ${bookingCount} existing booking(s)`,
      );
    }

    return this.prisma.package.delete({ where: { id } });
  }

  // ── Departures ───────────────────────────────────────────────────────────

  async getDepartures(packageId: string, agencyId: string) {
    await this.findOne(packageId, agencyId);

    const departures = await this.prisma.packageDeparture.findMany({
      where: { packageId },
      orderBy: { departureDate: 'asc' },
    });

    if (departures.length === 0) return [];

    // Compute real bookedCount from actual non-cancelled bookings.
    // This self-heals any stale stored value (e.g. bookings created before
    // seat-tracking was added, or manual DB edits).
    const aggs = await this.prisma.booking.groupBy({
      by: ['departureId'],
      where: {
        departureId: { in: departures.map((d) => d.id) },
        status: { not: 'CANCELLED' },
      },
      _sum: { totalPax: true },
    });

    const realCount = new Map(
      aggs.map((a) => [a.departureId as string, a._sum.totalPax ?? 0]),
    );

    // Sync any departures whose stored count differs from reality
    const stale = departures.filter(
      (d) => (realCount.get(d.id) ?? 0) !== d.bookedCount,
    );
    if (stale.length > 0) {
      await Promise.all(
        stale.map((d) =>
          this.prisma.packageDeparture.update({
            where: { id: d.id },
            data: { bookedCount: realCount.get(d.id) ?? 0 },
          }),
        ),
      );
    }

    return departures.map((d) => ({
      ...d,
      bookedCount: realCount.get(d.id) ?? 0,
    }));
  }

  async createDeparture(packageId: string, agencyId: string, dto: CreatePackageDepartureDto) {
    await this.findOne(packageId, agencyId);
    return this.prisma.packageDeparture.create({
      data: {
        packageId,
        departureDate: new Date(dto.departureDate),
        quota: dto.quota,
      },
    });
  }

  async removeDeparture(packageId: string, agencyId: string, departureId: string) {
    await this.findOne(packageId, agencyId);
    const dep = await this.prisma.packageDeparture.findFirst({
      where: { id: departureId, packageId },
    });
    if (!dep) {
      throw new NotFoundException(`Departure ${departureId} not found`);
    }
    return this.prisma.packageDeparture.delete({ where: { id: departureId } });
  }
}
