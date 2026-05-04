import { Controller, Get, Put, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.settingsService.get(user.agencyId!);
  }

  @Put()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(user.agencyId!, dto);
  }
}
