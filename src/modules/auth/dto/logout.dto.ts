import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ example: 'c3ede904-2ecb-4e78-98f2-352be3c9d9e4' })
  @IsUUID()
  userId!: string;
}
