import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AllowNoAgency } from './decorators/allow-no-agency.decorator';
import { CurrentUser, AuthUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * JWT must be valid (guard runs), but agencyId can be null (new user).
   * The guard already verified the ES256 token via JWKS — no manual verify needed.
   */
  @AllowNoAgency()
  @Post('register')
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterDto) {
    return this.authService.register(user.id, user.email, dto);
  }

  /**
   * GET /auth/me
   * Returns profile + agency. Also used by the frontend to check if
   * the user has completed onboarding (hasProfile + agencyId present).
   */
  @AllowNoAgency()
  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    const profile = await this.authService.getProfile(user.id);
    if (!profile) {
      return { hasProfile: false, id: user.id, email: user.email };
    }
    return {
      hasProfile: true,
      id: profile.id,
      email: profile.email,
      role: profile.role,
      agencyId: profile.agencyId,
      agency: profile.agency,
      onboardingProgress: profile.onboardingProgress ?? {},
    };
  }
}
