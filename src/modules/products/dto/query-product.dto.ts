import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ProductStatus } from 'src/common/enums/product-status.enum';

export class QueryProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Lọc theo trạng thái sản phẩm',
  })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'status không hợp lệ' })
  status?: ProductStatus;

  @ApiPropertyOptional({
    description:
      '[Chỉ áp dụng cho ADMIN] Lọc theo storeId cụ thể. STAFF luôn bị ép về store đang được gán, giá trị này (nếu có truyền) sẽ bị bỏ qua.',
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;
}
