import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';
import { OrdersService } from './orders.service';
import { QueryOrderDto } from './dto/query-order.dto';
import { GetStaffOrdersSwagger, GetStaffOrderDetailSwagger } from './decorators';

@ApiTags('Staff Orders')
@Controller('staff/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF)
export class StaffOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @GetStaffOrdersSwagger()
  findStaffOrders(
    @CurrentUser() staff: User,
    @Query() query: QueryOrderDto,
  ) {
    return this.ordersService.findStaffOrders(staff, query);
  }

  @Get(':id')
  @GetStaffOrderDetailSwagger()
  findStaffOrderDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() staff: User,
  ) {
    return this.ordersService.findStaffOrderDetail(id, staff);
  }
}
