import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateOrderItemDto } from './create-order.item.dto';

export class CreateOrderDto {
  @ApiProperty({ example: 'c2f3d4e5-6789-01ab-cdef-234567890abc' })
  @IsUUID()
  storeId!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Receiver name must not be empty' })
  receiverName!: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty({ message: 'Receiver phone must not be empty' })
  receiverPhone!: string;

  @ApiProperty({ example: '123 Main Street, New York' })
  @IsString()
  @IsNotEmpty({ message: 'Delivery address must not be empty' })
  deliveryAddress!: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must contain at least 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
