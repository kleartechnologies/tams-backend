import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { InviteUserDto } from './dto/invite-user.dto';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  listUsers(@CurrentUser() user: AuthUser) {
    return this.teamService.listUsers(user.agencyId!);
  }

  @Post()
  inviteUser(@CurrentUser() user: AuthUser, @Body() dto: InviteUserDto) {
    return this.teamService.inviteUser(user.agencyId!, user.id, dto);
  }

  @Delete(':id')
  removeUser(@CurrentUser() user: AuthUser, @Param('id') targetId: string) {
    return this.teamService.removeUser(user.agencyId!, user.id, targetId);
  }
}
