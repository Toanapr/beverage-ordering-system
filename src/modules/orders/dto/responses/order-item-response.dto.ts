import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    productId!: string;

    @ApiProperty({ example: 'Milk Tea' })
    productName!: string;

    @ApiProperty({ example: 30000 })
    price!: number;

    @ApiProperty({ example: 2 })
    quantity!: number;

    @ApiProperty({ example: 60000 })
    lineTotal!: number;
}
