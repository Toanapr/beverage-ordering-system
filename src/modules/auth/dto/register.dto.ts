import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'test@gmail.com',
    description: 'Email dùng để đăng ký, phải là duy nhất',
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống ' })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu, tối thiểu 6 ký tự',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 kí tự' })
  password!: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên đầy đủ' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName!: string;
}
