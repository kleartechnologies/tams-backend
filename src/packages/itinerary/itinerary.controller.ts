import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ItineraryService } from './itinerary.service';
import { CreateItineraryDto, UpdateItineraryDto } from './itinerary.dto';

@Controller('packages/:packageId/itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Get()
  findAll(@Param('packageId') packageId: string) {
    return this.itineraryService.findAll(packageId);
  }

  @Post()
  create(@Param('packageId') packageId: string, @Body() dto: CreateItineraryDto) {
    return this.itineraryService.create(packageId, dto);
  }

  @Patch(':itemId')
  update(
    @Param('packageId') packageId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItineraryDto,
  ) {
    return this.itineraryService.update(packageId, itemId, dto);
  }

  @Delete(':itemId')
  remove(@Param('packageId') packageId: string, @Param('itemId') itemId: string) {
    return this.itineraryService.remove(packageId, itemId);
  }
}
