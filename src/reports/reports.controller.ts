import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsDateString } from 'class-validator';
import { ReportsService } from './reports.service';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

class ReportsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getSummary(user.agencyId!, query.from, query.to);
  }

  @Get('revenue-trend')
  getRevenueTrend(@CurrentUser() user: AuthUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getRevenueTrend(user.agencyId!, query.from, query.to);
  }

  @Get('top-packages')
  getTopPackages(@CurrentUser() user: AuthUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getTopPackages(user.agencyId!, query.from, query.to);
  }

  @Get('outstanding')
  getOutstanding(@CurrentUser() user: AuthUser) {
    return this.reportsService.getOutstanding(user.agencyId!);
  }

  @Get('upcoming')
  getUpcoming(@CurrentUser() user: AuthUser) {
    return this.reportsService.getUpcoming(user.agencyId!);
  }

  @Get('bookings')
  getBookings(@CurrentUser() user: AuthUser, @Query() query: ReportsQueryDto) {
    return this.reportsService.getBookings(user.agencyId!, query.from, query.to);
  }
}
