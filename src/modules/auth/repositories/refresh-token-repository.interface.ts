import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<RefreshToken>;
  findActiveByUserId(userId: string): Promise<RefreshToken | null>;
  findAllByUserId(userId: string): Promise<RefreshToken[]>;
  revokeAllByUserId(userId: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}

export const I_REFRESH_TOKEN_REPOSITORY = 'I_REFRESH_TOKEN_REPOSITORY';
