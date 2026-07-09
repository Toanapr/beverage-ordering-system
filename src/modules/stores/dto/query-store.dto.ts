import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
import { PaginationQueryDto } from "src/common/dto/pagination-query.dto";
import { Type } from 'class-transformer';

export class QueryStoreDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Lọc theo trạng thái đang mở bán' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isOpen?: boolean;

    @ApiPropertyOptional({
        description:
            'Lọc theo trạng thái bị khóa. LƯU Ý: API public (GET /stores, GET /stores/:id) luôn ép isLocked=false bất kể giá trị truyền vào.',
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isLocked?: boolean;
}