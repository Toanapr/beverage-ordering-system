import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { StoresModule } from '../stores/stores.module';
import { I_USER_REPOSITORY } from './repositories/user-repository.interface';
import { UserRepository } from './repositories/user.repository';
import { AdminUsersController } from './admin-users.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    StoresModule,
    AuthModule,
  ],
  controllers: [UsersController, AdminUsersController],
  providers: [
    UsersService,
    { provide: I_USER_REPOSITORY, useClass: UserRepository },
  ],
})
export class UsersModule {}
