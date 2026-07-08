import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('stores')
export class Store {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'varchar', length: 20 })
    phone!: string;

    @Column({ type: 'text' })
    address!: string;

    @Column({ type: 'boolean', name: 'is_open', default: true })
    isOpen!: boolean;

    @Column({ type: 'boolean', name: 'is_locked', default: false })
    isLocked!: boolean;

    @Column({ type: 'numeric', precision: 3, scale: 2, name: 'rating_avg', default: 0.00 })
    ratingAvg!: number;

    @Column({ type: 'integer', name: 'rating_count', default: 0 })
    ratingCount!: number;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => User, (user) => user.store)
    staffs!: User[];
}
