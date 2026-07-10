import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from 'src/common/enums/role.enum';
import {
  I_PRODUCT_REPOSITORY,
  type IProductRepository,
} from '../repositories/product-repository.interface';
import { User } from 'src/modules/users/entities/user.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class StoreProductOwnershipGuard implements CanActivate {
  constructor(
    @Inject(I_PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: User;
      params: { id?: string };
      product?: Product;
    }>();
    const authUser = request.user;
    if (!authUser) {
      throw new ForbiddenException('User information was not found');
    }

    const productId = request.params.id;
    if (!productId) {
      throw new NotFoundException('Product not found');
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (authUser.role === UserRole.ADMIN) {
      request.product = product;
      return true;
    }

    if (!authUser.storeId || authUser.storeId !== product.storeId) {
      throw new ForbiddenException(
        'You do not have permission to modify products of another store',
      );
    }

    request.product = product;

    return true;
  }
}
