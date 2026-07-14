import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class QueryPublicProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by store (storeId)' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Filter by category (categoryId)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
