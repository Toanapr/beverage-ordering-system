import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { OrderItemResponseDto } from './order-item-response.dto';

export class OrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: '8H2F9D3K' })
  orderCode!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  storeId!: string;

  @ApiProperty({ example: 'John Doe' })
  receiverName!: string;

  @ApiProperty({ example: '0901234567' })
  receiverPhone!: string;

  @ApiProperty({ example: '123 Main Street, New York' })
  deliveryAddress!: string;

  @ApiProperty({ example: 60000 })
  subtotal!: number;

  @ApiProperty({ example: 60000 })
  totalAmount!: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.COD })
  paymentMethod!: PaymentMethod;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status!: OrderStatus;

  @ApiProperty({ nullable: true, example: null })
  cancelReason!: string | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items!: OrderItemResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
