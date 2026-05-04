import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackageDto } from './dto/query-package.dto';
import { CreatePackageDepartureDto } from './dto/create-package-departure.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePackageDto) {
    return this.packagesService.create(user.agencyId!, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryPackageDto) {
    return this.packagesService.findAll(user.agencyId!, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.packagesService.findOne(id, user.agencyId!);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePackageDto,
  ) {
    return this.packagesService.update(id, user.agencyId!, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.packagesService.remove(id, user.agencyId!);
  }

  // ── Departures ──────────────────────────────────────────────────────────

  @Get(':id/departures')
  getDepartures(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.packagesService.getDepartures(id, user.agencyId!);
  }

  @Post(':id/departures')
  createDeparture(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreatePackageDepartureDto,
  ) {
    return this.packagesService.createDeparture(id, user.agencyId!, dto);
  }

  @Delete(':id/departures/:depId')
  removeDeparture(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('depId') depId: string,
  ) {
    return this.packagesService.removeDeparture(id, user.agencyId!, depId);
  }
}
