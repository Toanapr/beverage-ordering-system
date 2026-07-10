import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Type } from 'class-transformer';

export class QueryStoreDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by whether the store is open' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isOpen?: boolean;

  @ApiPropertyOptional({
    description:
      'Filter by locked status. NOTE: Public APIs (GET /stores, GET /stores/:id) always force isLocked=false regardless of the passed value.',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isLocked?: boolean;
}
