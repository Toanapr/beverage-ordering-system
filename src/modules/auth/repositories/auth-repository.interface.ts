import { User } from 'src/modules/users/entities/user.entity';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: Partial<User>): Promise<User>;
}

export const I_AUTH_REPOSITORY = 'I_AUTH_REPOSITORY';
