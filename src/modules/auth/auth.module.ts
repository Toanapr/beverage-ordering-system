import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { I_REFRESH_TOKEN_REPOSITORY } from './repositories/refresh-token-repository.interface';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { I_AUTH_REPOSIROTY } from './repositories/auth-repository.interface';
import { AuthRepository } from './repositories/auth.repository';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: I_AUTH_REPOSIROTY,
      useClass: AuthRepository,
    },
    {
      provide: I_REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository,
    },
  ],
})
export class AuthModule {}
