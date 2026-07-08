import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRefreshTokenRepository } from './refresh-token-repository.interface';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly typeOrmRepository: Repository<RefreshToken>,
    ) { }

    async create(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
        const tokenRecord = this.typeOrmRepository.create({
            userId,
            token_hash: tokenHash,
            expiresAt,
        });
        return this.typeOrmRepository.save(tokenRecord);
    }

    async findActiveByUserId(userId: string): Promise<RefreshToken | null> {
        return this.typeOrmRepository.findOne({
            where: { userId, isRevoked: false },
        });
    }

    async revokeAllByUserId(userId: string): Promise<void> {
        await this.typeOrmRepository.update({ userId }, { isRevoked: true });
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.typeOrmRepository.delete({ userId });
    }
}