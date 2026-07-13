import { Product } from 'src/modules/products/entities/product.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'order_id' })
    orderId!: string;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order!: Order;

    @Column({ type: 'uuid', name: 'product_id' })
    productId!: string;

    @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'product_id' })
    product!: Product;

    @Column({ type: 'varchar', length: 100, name: 'product_name' })
    productName!: string;

    @Column({ type: 'numeric', precision: 12, scale: 2 })
    price!: number;

    @Column({ type: 'integer' })
    quantity!: number;

    @Column({ type: 'numeric', precision: 12, scale: 2, name: 'line_total' })
    lineTotal!: number;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
    createdAt!: Date;
}
