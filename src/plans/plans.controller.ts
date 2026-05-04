import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('usage')
  getUsage(@CurrentUser() user: { agencyId: string }) {
    return this.plansService.getUsage(user.agencyId);
  }
}
