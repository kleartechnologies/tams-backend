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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.agencyId!, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryCustomerDto) {
    return this.customersService.findAll(user.agencyId!, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customersService.findOne(id, user.agencyId!);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, user.agencyId!, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customersService.remove(id, user.agencyId!);
  }
}
