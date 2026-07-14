import { ApiProperty } from '@nestjs/swagger';

export class AdminTrendItemDto {
  @ApiProperty({
    example: '2026-07-14T00:00:00.000Z',
    description: 'Date of the trend interval',
  })
  date!: Date | string;

  @ApiProperty({
    example: 108000,
    description: 'Total revenue of completed orders in this interval',
  })
  revenue!: number;

  @ApiProperty({
    example: 3,
    description: 'Total number of completed orders in this interval',
  })
  ordersCount!: number;
}
