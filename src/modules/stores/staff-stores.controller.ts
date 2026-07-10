import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { GetStaffStoreSwagger, UpdateStaffStoreSwagger } from './decorators';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@ApiTags('Staff Store')
@Controller('staff/store')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF)
export class StaffStoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @GetStaffStoreSwagger()
  findAssignedStore(@CurrentUser() staff: User) {
    return this.storesService.findAssignedStore(staff.storeId);
  }

  @Patch()
  @UpdateStaffStoreSwagger()
  updateAssignedStore(@CurrentUser() staff: User, @Body() dto: UpdateStoreDto) {
    return this.storesService.updateAssignedStore(staff.storeId, dto);
  }
}
