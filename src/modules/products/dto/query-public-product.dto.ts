import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class QueryPublicProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Lọc theo cửa hàng (storeId)' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo danh mục (categoryId)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
