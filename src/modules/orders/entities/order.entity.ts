import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { Store } from 'src/modules/stores/entities/store.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

@Index('idx_orders_customer_id', ['customerId'])
@Index('idx_orders_store_status', ['storeId', 'status'])
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10, name: 'order_code', unique: true })
  orderCode!: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer!: User;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId!: string;

  @ManyToOne(() => Store, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ type: 'varchar', length: 100, name: 'receiver_name' })
  receiverName!: string;

  @Column({ type: 'varchar', length: 20, name: 'receiver_phone' })
  receiverPhone!: string;

  @Column({ type: 'text', name: 'delivery_address' })
  deliveryAddress!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount!: number;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'payment_method',
    enum: PaymentMethod,
    default: PaymentMethod.COD,
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: 'varchar',
    length: 20,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ type: 'text', name: 'cancel_reason', nullable: true })
  cancelReason!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];
}
