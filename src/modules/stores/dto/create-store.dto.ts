import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'ABC Tea', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'Store name must not be empty' })
  @MaxLength(100, { message: 'Store name must be at most 100 characters' })
  name!: string;

  @ApiProperty({ example: '0901234567', maxLength: 20 })
  @IsString()
  @IsNotEmpty({ message: 'Phone number must not be empty' })
  @MaxLength(20, { message: 'Phone number must be at most 20 characters' })
  phone!: string;

  @ApiProperty({ example: '123 Nguyen Trai, District 1, HCMC' })
  @IsString()
  @IsNotEmpty({ message: 'Address must not be empty' })
  address!: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Whether the store is open (defaults to true when created)',
  })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}
