import { ApiProperty } from '@nestjs/swagger';

export class StoreResponseDto {
    @ApiProperty({ example: 'b1f2c3d4-5678-90ab-cdef-1234567890ab' })
    id!: string;

    @ApiProperty({ example: 'Trà Sữa ABC' })
    name!: string;

    @ApiProperty({ example: '0901234567' })
    phone!: string;

    @ApiProperty({ example: '123 Nguyễn Trãi, Q.1, TP.HCM' })
    address!: string;

    @ApiProperty({ example: true })
    isOpen!: boolean;

    @ApiProperty({ example: false })
    isLocked!: boolean;

    @ApiProperty({ example: 4.5 })
    ratingAvg!: number;

    @ApiProperty({ example: 128 })
    ratingCount!: number;

    @ApiProperty({ example: '2026-07-08T07:31:57.613Z' })
    createdAt!: Date;

    @ApiProperty({ example: '2026-07-08T07:31:57.613Z' })
    updatedAt!: Date;
}
