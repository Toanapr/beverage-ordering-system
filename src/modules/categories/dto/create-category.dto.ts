import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Coffee', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'Category name must not be empty' })
  @MaxLength(100, { message: 'Category name must be at most 100 characters' })
  name!: string;
}
