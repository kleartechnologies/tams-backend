import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  aud?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = config.get<string>('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Fetch the public key from Supabase's JWKS endpoint — supports ES256/RS256
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      algorithms: ['ES256', 'RS256'],
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) throw new UnauthorizedException('Invalid token');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    return {
      id: payload.sub,
      email: payload.email ?? user?.email ?? '',
      role: user?.role ?? 'STAFF',
      agencyId: user?.agencyId ?? null,
    };
  }
}
