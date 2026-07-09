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
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  CreateStaffSwagger,
  ListStaffSwagger,
  LockStaffSwagger,
  UnlockStaffSwagger,
} from './decorators';
import { CreateStaffDto } from './dto/create-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { UsersService } from './users.service';

@ApiTags('Staff Management')
@Controller('admin/staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @CreateStaffSwagger()
  createStaff(@Body() dto: CreateStaffDto) {
    return this.usersService.createStaff(dto);
  }

  @Get()
  @ListStaffSwagger()
  findStaff(@Query() query: QueryStaffDto) {
    return this.usersService.findStaff(query);
  }

  @Patch(':id/lock')
  @LockStaffSwagger()
  lockStaff(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.lockStaff(id);
  }

  @Patch(':id/unlock')
  @UnlockStaffSwagger()
  unlockStaff(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.unlockStaff(id);
  }
}
