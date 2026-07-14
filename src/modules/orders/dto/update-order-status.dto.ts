import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from 'src/common/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    description: 'New status for the order (must be preparing or completed)',
  })
  @IsEnum(OrderStatus, { message: 'Invalid status' })
  status!: OrderStatus;
}
