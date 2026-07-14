import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by start date (ISO string)',
    example: '2026-07-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO string)',
    example: '2026-07-14T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
