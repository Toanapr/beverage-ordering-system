import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QueryProductDto } from './dto/query-product.dto';
import { QueryPublicProductDto } from './dto/query-public-product.dto';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { StoreProductOwnershipGuard } from './guards/store-product-ownership.guard';
import {
  ListProductSwagger,
  GetProductSwagger,
  ListPublicProductSwagger,
  GetPublicProductSwagger,
  CreateProductSwagger,
  UpdateProductSwagger,
} from './decorators';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('public')
  @ListPublicProductSwagger()
  async findPublic(@Query() query: QueryPublicProductDto) {
    return this.productsService.findPublicList(query);
  }

  @Get('public/:id')
  @GetPublicProductSwagger()
  async findPublicOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findPublicOneOrThrow(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF)
  @CreateProductSwagger()
  create(@CurrentUser() staff: User, @Body() dto: CreateProductDto) {
    return this.productsService.create(staff.storeId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF)
  @UpdateProductSwagger()
  update(
    @CurrentUser() staff: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(staff.storeId, id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ListProductSwagger()
  async findAll(@Query() query: QueryProductDto, @CurrentUser() user: User) {
    if (user.role === UserRole.STAFF) {
      if (query.storeId) {
        throw new BadRequestException(
          'Staff is not allowed to provide storeId manually',
        );
      }
      if (!user.storeId) {
        throw new ForbiddenException(
          'Staff member has not been assigned to any store',
        );
      }
      query.storeId = user.storeId;
    }
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, StoreProductOwnershipGuard)
  @GetProductSwagger()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }
}
