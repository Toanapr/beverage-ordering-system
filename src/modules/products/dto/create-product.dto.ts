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

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
