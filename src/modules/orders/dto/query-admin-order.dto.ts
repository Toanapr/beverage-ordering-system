import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { OrderStatus } from 'src/common/enums/order-status.enum';

export class QueryAdminOrderDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Filter by order status',
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Invalid status' })
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filter by store ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid store ID format' })
  storeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid customer ID format' })
  customerId?: string;
}
