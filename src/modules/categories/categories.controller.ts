import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CreateCategorySwagger,
  DeleteCategorySwagger,
  ListCategorySwagger,
  UpdateCategorySwagger,
} from './decorators';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @CreateCategorySwagger()
  create(@CurrentUser() staff: User, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(staff.storeId, dto);
  }

  @Get()
  @ListCategorySwagger()
  findAll(@CurrentUser() staff: User, @Query() query: QueryCategoryDto) {
    return this.categoriesService.findAll(staff.storeId, query);
  }

  @Patch(':id')
  @UpdateCategorySwagger()
  update(
    @CurrentUser() staff: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(staff.storeId, id, dto);
  }

  @Delete(':id')
  @DeleteCategorySwagger()
  remove(@CurrentUser() staff: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(staff.storeId, id);
  }
}
