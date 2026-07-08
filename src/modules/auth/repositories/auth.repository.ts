import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/modules/users/entities/user.entity";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { IAuthRepository } from "./auth-repository.interface";

@Injectable()
export class AuthRepository implements IAuthRepository {
    constructor(
        @InjectRepository(User)
        private readonly typeOrmRepository: Repository<User>
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.typeOrmRepository.createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.email = :email', { email })
            .getOne();
    }

    async findById(id: string): Promise<User | null> {
        return this.typeOrmRepository.findOne({ where: { id } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const newUser = this.typeOrmRepository.create(userData);
        return this.typeOrmRepository.save(newUser);
    }
}