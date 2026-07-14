import { ApiProperty } from '@nestjs/swagger';

export class OrderStatusDistributionResponseDto {
  @ApiProperty({ example: 5, description: 'Number of pending orders' })
  pending!: number;

  @ApiProperty({ example: 3, description: 'Number of preparing orders' })
  preparing!: number;

  @ApiProperty({ example: 120, description: 'Number of completed orders' })
  completed!: number;

  @ApiProperty({ example: 10, description: 'Number of cancelled orders' })
  cancelled!: number;
}
