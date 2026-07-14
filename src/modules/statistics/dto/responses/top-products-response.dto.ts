import { ApiProperty } from '@nestjs/swagger';

export class TopProductItemDto {
  @ApiProperty({
    example: '12d3b2f5-b3ca-4f5a-b6b8-4c8d9e2a1b3c',
    description: 'Product ID',
  })
  productId!: string;

  @ApiProperty({ example: 'Milk Tea with Pearls', description: 'Product Name' })
  productName!: string;

  @ApiProperty({ example: 'Gong Cha', description: 'Store Name' })
  storeName!: string;

  @ApiProperty({ example: 350, description: 'Total units sold' })
  quantitySold!: number;

  @ApiProperty({ example: 175000, description: 'Total revenue from product' })
  totalRevenue!: number;
}
