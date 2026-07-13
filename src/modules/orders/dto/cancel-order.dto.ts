import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: 'I changed my mind' })
  @IsString()
  @IsNotEmpty({ message: 'Cancel reason must not be empty' })
  cancelReason!: string;
}
