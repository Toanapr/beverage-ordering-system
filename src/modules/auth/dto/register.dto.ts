import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'test@gmail.com',
    description: 'Email used for registration, must be unique',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email must not be empty' })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password, minimum 6 characters',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password must not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name must not be empty' })
  fullName!: string;
}
