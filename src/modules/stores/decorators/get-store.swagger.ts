import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StoreResponseDto } from '../dto/responses/store-response.dto';

export const GetStoreSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Chi tiết cửa hàng (public)' }),
        ApiSuccessResponse(StoreResponseDto, { description: 'Lấy chi tiết cửa hàng thành công' }),
        ApiNotFoundResponse({ description: 'Không tìm thấy cửa hàng (không tồn tại hoặc đã bị khóa)' }),
    );
