import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { I_ORDER_REPOSITORY } from './repositories/order-repository.interface';
import { StoresModule } from 'src/modules/stores/stores.module';
import { ProductsModule } from '../products/products.module';
import { OrderRepository } from './repositories/order-repository';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, Product]), StoresModule, ProductsModule],
    controllers: [OrdersController],
    providers: [
        OrdersService,
        { provide: I_ORDER_REPOSITORY, useClass: OrderRepository },
    ],
    exports: [OrdersService],
})
export class OrdersModule { }
