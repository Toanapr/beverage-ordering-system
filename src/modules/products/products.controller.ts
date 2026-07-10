import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
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
} from './decorators';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';

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

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ListProductSwagger()
  async findAll(@Query() query: QueryProductDto, @CurrentUser() user: User) {
    if (user.role === UserRole.STAFF) {
      if (query.storeId) {
        throw new BadRequestException('Staff không được tự truyền storeId');
      }
      if (!user.storeId) {
        throw new ForbiddenException(
          'Nhân viên chưa được gán vào cửa hàng nào',
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
