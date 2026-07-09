import { ProductStatus } from 'src/common/enums/product-status.enum';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Store } from 'src/modules/stores/entities/store.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId!: string;

  @ManyToOne(() => Store, (store) => store.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId!: string;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 255, name: 'image_url', nullable: true })
  imageUrl!: string | null;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status!: ProductStatus;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;
}
