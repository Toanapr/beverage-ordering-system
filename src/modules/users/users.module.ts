import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { I_REFRESH_TOKEN_REPOSITORY } from '../auth/repositories/refresh-token-repository.interface';
import { RefreshTokenRepository } from '../auth/repositories/refresh-token.repository';
import { StoresModule } from '../stores/stores.module';
import { I_USER_REPOSITORY } from './repositories/user-repository.interface';
import { UserRepository } from './repositories/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken]), StoresModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: I_USER_REPOSITORY, useClass: UserRepository },
    { provide: I_REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepository },
  ],
})
export class UsersModule {}
