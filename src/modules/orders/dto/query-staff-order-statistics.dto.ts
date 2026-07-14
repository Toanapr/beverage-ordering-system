import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class QueryStaffOrderStatisticsDto {
  @ApiPropertyOptional({
    example: '2026-07-01',
    description: 'Start date in Asia/Ho_Chi_Minh timezone (YYYY-MM-DD)',
  })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'from must use YYYY-MM-DD format' })
  from?: string;

  @ApiPropertyOptional({
    example: '2026-07-31',
    description: 'End date in Asia/Ho_Chi_Minh timezone (YYYY-MM-DD)',
  })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'to must use YYYY-MM-DD format' })
  to?: string;
}
