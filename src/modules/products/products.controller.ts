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
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { StoreProductOwnershipGuard } from './guards/store-product-ownership.guard';
import { ListProductSwagger, GetProductSwagger } from './decorators';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ListProductSwagger()
  async findAll(@Query() query: QueryProductDto, @CurrentUser() user: User) {
    if (user.role === UserRole.STAFF) {
      if (query.storeId) {
        throw new BadRequestException('Staff cannot filter by storeId');
      }
      if (!user.storeId) {
        throw new ForbiddenException(
          'Staff has not been assigned to any store',
        );
      }
      query.storeId = user.storeId;
    }
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(StoreProductOwnershipGuard)
  @GetProductSwagger()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }
}
