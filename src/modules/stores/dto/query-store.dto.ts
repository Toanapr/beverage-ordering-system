import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Type } from 'class-transformer';

export class QueryStoreDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter by whether the store is open. Public store APIs always return only open stores.',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isOpen?: boolean;

  @ApiPropertyOptional({
    description:
      'Filter by locked status. Public store APIs always return only unlocked stores.',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isLocked?: boolean;
}
