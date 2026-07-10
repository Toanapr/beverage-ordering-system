import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'test@gmail.com', description: 'Registered email' })
  @IsEmail({}, { message: 'Invalid email' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Account password' })
  @IsString()
  @IsNotEmpty({ message: 'Password must not be empty' })
  password!: string;
}
