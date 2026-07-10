import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'Logout successful' })
  message!: string;
}
