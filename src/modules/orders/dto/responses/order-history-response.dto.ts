import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';

export class OrderHistoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: '8H2F9D3K' })
  orderCode!: string;

  @ApiProperty()
  storeId!: string;

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

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
