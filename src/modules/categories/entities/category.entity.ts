import { Product } from 'src/modules/products/entities/product.entity';
import { Store } from 'src/modules/stores/entities/store.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId!: string;

  @ManyToOne(() => Store, (store) => store.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;
}
