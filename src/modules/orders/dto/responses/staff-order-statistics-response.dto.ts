import { ApiProperty } from '@nestjs/swagger';

export class StaffOrderStatisticsResponseDto {
  @ApiProperty({ example: 42 })
  totalOrders!: number;

  @ApiProperty({ example: 30 })
  completedOrders!: number;

  @ApiProperty({ example: 4 })
  cancelledOrders!: number;

  @ApiProperty({ example: 1250000 })
  completedRevenue!: number;
}
