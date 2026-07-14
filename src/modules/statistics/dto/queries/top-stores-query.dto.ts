import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { DateRangeQueryDto } from './date-range-query.dto';

export enum TopStoresSortBy {
  REVENUE = 'revenue',
  ORDERS = 'orders',
}

export class AdminTopStoresQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Number of stores to return',
    default: 5,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 5;

  @ApiPropertyOptional({
    enum: TopStoresSortBy,
    description: 'Sort leaderboard by revenue or order count',
    default: TopStoresSortBy.REVENUE,
  })
  @IsOptional()
  @IsEnum(TopStoresSortBy, { message: 'Invalid sort field' })
  sortBy?: TopStoresSortBy = TopStoresSortBy.REVENUE;
}
