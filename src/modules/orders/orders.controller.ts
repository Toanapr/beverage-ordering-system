import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateOrderSwagger, CancelOrderSwagger, GetStaffOrdersSwagger, GetStaffOrderDetailSwagger } from './decorators';
import { User } from 'src/modules/users/entities/user.entity';
import { QueryOrderDto } from './dto/query-order.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @Roles(UserRole.CUSTOMER)
  @CreateOrderSwagger()
  create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  @CancelOrderSwagger()
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancel(id, user.id, dto);
  }

  @Get('staff')
  @GetStaffOrdersSwagger()
  findStaffOrders(
    @CurrentUser() staff: User,
    @Query() query: QueryOrderDto,
  ) {
    return this.ordersService.findStaffOrders(staff, query);
  }

  @Get('staff/:id')
  @GetStaffOrderDetailSwagger()
  findStaffOrderDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() staff: User,
  ) {
    return this.ordersService.findStaffOrderDetail(id, staff);
  }
}
