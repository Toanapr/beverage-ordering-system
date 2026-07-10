import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from 'src/common/enums/product-status.enum';

export class ProductResponseDto {
  @ApiProperty({ example: 'b1f2c3d4-5678-90ab-cdef-1234567890ab' })
  id!: string;

  @ApiProperty()
  storeId!: string;

  @ApiProperty()
  categoryId!: string;

  @ApiProperty({ example: 'Bubble Milk Tea' })
  name!: string;

  @ApiProperty({
    nullable: true,
    example: 'Taiwanese milk tea, black pearls, size M',
  })
  description!: string | null;

  @ApiProperty({ example: 30000 })
  price!: number;

  @ApiProperty({
    nullable: true,
    example: 'https://cdn.example.com/products/abc.jpg',
  })
  imageUrl!: string | null;

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.ACTIVE })
  status!: ProductStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
