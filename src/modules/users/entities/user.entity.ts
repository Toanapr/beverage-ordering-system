import { UserRole } from "src/common/enums/role.enum";
import { Store } from "src/modules/stores/entities/store.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255, name: 'password_hash', select: false })
    passwordHash!: string;

    @Column({ type: 'varchar', length: 20, enum: UserRole })
    role!: UserRole;

    @Column({ type: 'uuid', name: 'store_id', nullable: true })
    storeId!: string | null;

    @ManyToOne(() => Store, (store) => store.staffs, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'store_id' })
    store!: Store | null;

    @Column({ type: 'varchar', length: 100, name: 'full_name' })
    fullName!: string;

    @Column({ type: 'varchar', length: 255, name: 'avatar_url', nullable: true })
    avatarUrl!: string;

    @Column({ type: 'date', nullable: true })
    dob!: Date;

    @Column({ type: 'varchar', length: 10, nullable: true })
    gender!: string;

    @Column({ type: 'boolean', name: 'is_banned', default: false })
    isBanned!: boolean;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
    updatedAt!: Date;
}