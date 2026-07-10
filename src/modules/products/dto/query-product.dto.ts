import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ProductStatus } from 'src/common/enums/product-status.enum';

export class QueryProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Filter by product status',
  })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'invalid status' })
  status?: ProductStatus;

  @ApiPropertyOptional({
    description:
      '[ADMIN only] Filter by specific storeId. STAFF is always forced to their assigned store, this value (if passed) will be ignored.',
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;
}
