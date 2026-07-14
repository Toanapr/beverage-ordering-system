import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({
    example: '/uploads/products/550e8400-e29b-41d4-a716-446655440000.jpg',
  })
  imageUrl!: string;
}
