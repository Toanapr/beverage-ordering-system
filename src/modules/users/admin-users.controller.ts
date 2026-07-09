import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  ListUsersSwagger,
  LockUserSwagger,
  UnlockUserSwagger,
} from './decorators';
import { QueryUserDto } from './dto/query-user.dto';
import { UsersService } from './users.service';

@ApiTags('User Management')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ListUsersSwagger()
  findUsers(@Query() query: QueryUserDto) {
    return this.usersService.findUsers(query);
  }

  @Patch(':id/lock')
  @LockUserSwagger()
  lockUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.lockUser(id);
  }

  @Patch(':id/unlock')
  @UnlockUserSwagger()
  unlockUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.unlockUser(id);
  }
}
