import { ApiProperty } from '@nestjs/swagger';

export class AdminStatisticsResponseDto {
  @ApiProperty({ example: 10, description: 'Total stores' })
  totalStores!: number;

  @ApiProperty({ example: 150, description: 'Total users' })
  totalUsers!: number;

  @ApiProperty({ example: 500, description: 'Total orders' })
  totalOrders!: number;

  @ApiProperty({
    example: 25000000,
    description: 'Total revenue from completed orders',
  })
  totalRevenue!: number;
}
