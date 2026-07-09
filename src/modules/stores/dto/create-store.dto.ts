import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'Trà Sữa ABC', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'Tên cửa hàng không được để trống' })
  @MaxLength(100, { message: 'Tên cửa hàng tối đa 100 ký tự' })
  name!: string;

  @ApiProperty({ example: '0901234567', maxLength: 20 })
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phone!: string;

  @ApiProperty({ example: '123 Nguyễn Trãi, Q.1, TP.HCM' })
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  address!: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Cửa hàng có đang mở bán không (mặc định true khi tạo mới)',
  })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}
