import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'Đăng xuất thành công!' })
  message!: string;
}
