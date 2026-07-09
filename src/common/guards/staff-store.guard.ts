import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from 'src/modules/users/entities/user.entity';
import { UserRole } from '../enums/role.enum';

@Injectable()
export class StaffStoreGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: User;
      params: { storeId?: string };
    }>();

    const user = request.user;
    const storeId = request.params.storeId;

    if (!user) {
      throw new ForbiddenException('User information was not found');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (user.role !== UserRole.STAFF) {
      throw new ForbiddenException('Only staff can manage store resources');
    }

    if (!storeId) {
      throw new ForbiddenException('Missing storeId route parameter');
    }

    if (user.storeId !== storeId) {
      throw new ForbiddenException('You do not belong to this store');
    }

    return true;
  }
}
