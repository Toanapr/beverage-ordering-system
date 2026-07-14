import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';
import { ProductStatus } from 'src/common/enums/product-status.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'b1f2c3d4-5678-90ab-cdef-1234567890ab' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ example: 'Brown Sugar Milk Tea', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Milk tea with brown sugar pearls' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: 35000, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    example: '/uploads/products/550e8400-e29b-41d4-a716-446655440000.jpg',
    description: 'Relative URL returned by POST /uploads/images',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(
    /^\/uploads\/products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/,
    {
      message:
        'imageUrl must be a product image URL returned by the upload endpoint',
    },
  )
  imageUrl?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
