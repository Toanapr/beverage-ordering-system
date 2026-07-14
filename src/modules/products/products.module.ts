import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { User } from '../users/entities/user.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { StoreProductOwnershipGuard } from './guards/store-product-ownership.guard';
import { I_PRODUCT_REPOSITORY } from './repositories/product-repository.interface';
import { ProductRepository } from './repositories/product.repository';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, User, Category])],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    StoreProductOwnershipGuard,
    { provide: I_PRODUCT_REPOSITORY, useClass: ProductRepository },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
