import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RequireAgencyGuard } from './require-agency.guard';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RequireAgencyGuard],
  exports: [JwtAuthGuard, RequireAgencyGuard],
})
export class AuthModule {}
