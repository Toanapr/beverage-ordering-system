import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { Store } from '../stores/entities/store.entity';


@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Store,
        ]),
    ],
})
export class UsersModule { }