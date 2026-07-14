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
import {
  CreateOrderSwagger,
  CancelOrderSwagger,
  CancelStaffOrderSwagger,
  GetStaffOrdersSwagger,
  GetStaffOrderStatisticsSwagger,
  GetStaffOrderDetailSwagger,
  GetAdminOrdersSwagger,
  GetAdminOrderDetailSwagger,
  GetCustomerOrderDetailSwagger,
  GetCustomerOrderHistorySwagger,
  UpdateOrderStatusSwagger,
} from './decorators';
import { User } from 'src/modules/users/entities/user.entity';
import { QueryOrderDto } from './dto/query-order.dto';
import { QueryAdminOrderDto } from './dto/query-admin-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryStaffOrderStatisticsDto } from './dto/query-staff-order-statistics.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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

  @Patch('staff/:id/cancel')
  @Roles(UserRole.STAFF)
  @CancelStaffOrderSwagger()
  cancelStaffOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() staff: User,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelStaffOrder(id, staff, dto);
  }

  @Get('history')
  @Roles(UserRole.CUSTOMER)
  @GetCustomerOrderHistorySwagger()
  findCustomerOrderHistory(
    @CurrentUser() customer: User,
    @Query() query: QueryOrderDto,
  ) {
    return this.ordersService.findCustomerOrderHistory(customer.id, query);
  }

  @Get('staff')
  @GetStaffOrdersSwagger()
  findStaffOrders(@CurrentUser() staff: User, @Query() query: QueryOrderDto) {
    return this.ordersService.findStaffOrders(staff, query);
  }

  @Get('staff/statistics')
  @Roles(UserRole.STAFF)
  @GetStaffOrderStatisticsSwagger()
  findStaffOrderStatistics(
    @CurrentUser() staff: User,
    @Query() query: QueryStaffOrderStatisticsDto,
  ) {
    return this.ordersService.findStaffOrderStatistics(staff, query);
  }

  @Get('staff/:id')
  @GetStaffOrderDetailSwagger()
  findStaffOrderDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() staff: User,
  ) {
    return this.ordersService.findStaffOrderDetail(id, staff);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @GetAdminOrdersSwagger()
  findAdminOrders(@Query() query: QueryAdminOrderDto) {
    return this.ordersService.findAdminOrders(query);
  }

  @Get('admin/:id')
  @Roles(UserRole.ADMIN)
  @GetAdminOrderDetailSwagger()
  findAdminOrderDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findAdminOrderDetail(id);
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER)
  @GetCustomerOrderDetailSwagger()
  findCustomerOrderDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() customer: User,
  ) {
    return this.ordersService.findCustomerOrderDetail(id, customer.id);
  }

  @Patch('staff/:id/status')
  @Roles(UserRole.STAFF)
  @UpdateOrderStatusSwagger()
  updateStaffOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() staff: User,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStaffOrderStatus(id, staff, dto);
  }
}
