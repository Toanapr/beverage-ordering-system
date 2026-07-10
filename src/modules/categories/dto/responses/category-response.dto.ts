import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: 'b1f2c3d4-5678-90ab-cdef-1234567890ab' })
  id!: string;

  @ApiProperty({ example: 'b1f2c3d4-5678-90ab-cdef-1234567890ac' })
  storeId!: string;

  @ApiProperty({ example: 'Coffee' })
  name!: string;

  @ApiProperty({ example: '2026-07-10T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-10T10:00:00.000Z' })
  updatedAt!: Date;
}
