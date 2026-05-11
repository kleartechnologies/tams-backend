import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  getState(@CurrentUser() user: AuthUser) {
    return this.onboardingService.getState(user.id);
  }

  @Patch()
  updateState(@CurrentUser() user: AuthUser, @Body() dto: UpdateOnboardingDto) {
    return this.onboardingService.updateState(user.id, dto);
  }

  @Post('reset')
  resetProgress(@CurrentUser() user: AuthUser) {
    return this.onboardingService.resetProgress(user.id);
  }
}
