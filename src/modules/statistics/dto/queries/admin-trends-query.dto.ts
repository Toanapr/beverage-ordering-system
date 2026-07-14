import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DateRangeQueryDto } from './date-range-query.dto';

export enum TrendRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class AdminTrendsQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({
    enum: TrendRange,
    description: 'Grouping range for statistics',
    default: TrendRange.DAY,
  })
  @IsOptional()
  @IsEnum(TrendRange, { message: 'Invalid trend range' })
  range?: TrendRange = TrendRange.DAY;
}
