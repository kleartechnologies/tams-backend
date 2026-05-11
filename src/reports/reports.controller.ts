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

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthUser, @Query() query: ReportsQueryDto) {
    const agencyId = user.agencyId!;
    // Trend is fetched separately by the client with a 6-month window
    const [summary, upcoming, outstanding, topPackages] = await Promise.all([
      this.reportsService.getSummary(agencyId, query.from, query.to),
      this.reportsService.getUpcoming(agencyId),
      this.reportsService.getOutstanding(agencyId),
      this.reportsService.getTopPackages(agencyId, query.from, query.to),
    ]);
    return { summary, upcoming, outstanding, topPackages };
  }

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
