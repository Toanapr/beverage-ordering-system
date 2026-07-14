import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { DateRangeQueryDto } from './date-range-query.dto';

export class AdminTopProductsQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Number of products to return',
    default: 5,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 5;
}
