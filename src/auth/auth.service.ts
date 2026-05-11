import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Called right after Supabase signUp. The JWT is already validated by the
   * global JwtAuthGuard + JwtStrategy (via JWKS). We receive the verified
   * userId and email directly — no manual token verification needed.
   */
  async register(userId: string, email: string, dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (existing) {
      throw new ConflictException('User is already registered');
    }

    const agency = await this.prisma.agency.create({
      data: { name: dto.agencyName, plan: 'FREE' },
    });

    const user = await this.prisma.user.create({
      data: {
        id: userId,
        email,
        agencyId: agency.id,
        role: 'OWNER',
      },
    });

    await this.prisma.agencySetting.create({
      data: {
        agencyId: agency.id,
        agencyName: dto.agencyName,
        agencyTag: 'Travel Agency Management System',
      },
    });

    return {
      user: { id: user.id, email: user.email, role: user.role, agencyId: user.agencyId },
      agency: { id: agency.id, name: agency.name },
    };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { agency: true },
    });
  }
}
