import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(agencyId: string, dto: CreateCustomerDto) {
    if (dto.icNumber) {
      const existing = await this.prisma.customer.findFirst({
        where: { icNumber: dto.icNumber, agencyId },
      });
      if (existing) {
        throw new ConflictException(
          `A customer with IC number ${dto.icNumber} already exists`,
        );
      }
    }

    return this.prisma.customer.create({
      data: {
        ...dto,
        agencyId,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async findAll(agencyId: string, query: QueryCustomerDto) {
    const { search, nationality, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = { agencyId };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { icNumber: { contains: search } },
        { passportNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (nationality) where.nationality = nationality;

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bookings: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { package: { select: { id: true, name: true } } },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, agencyId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, agencyId },
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
            bookingDate: true,
            totalAmount: true,
            totalPaid: true,
            balanceDue: true,
            package: { select: { name: true, type: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    return customer;
  }

  async update(id: string, agencyId: string, dto: UpdateCustomerDto) {
    await this.findOne(id, agencyId);

    if (dto.icNumber) {
      const conflict = await this.prisma.customer.findFirst({
        where: { icNumber: dto.icNumber, agencyId, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(
          `IC number ${dto.icNumber} is already used by another customer`,
        );
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async remove(id: string, agencyId: string) {
    await this.findOne(id, agencyId);

    const bookingCount = await this.prisma.booking.count({
      where: { customerId: id, agencyId },
    });

    if (bookingCount > 0) {
      throw new ConflictException(
        `Cannot delete customer with ${bookingCount} existing booking(s)`,
      );
    }

    return this.prisma.customer.delete({ where: { id } });
  }
}
