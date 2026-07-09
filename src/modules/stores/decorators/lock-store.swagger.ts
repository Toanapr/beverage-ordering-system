import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StoreResponseDto } from '../dto/responses/store-response.dto';

export const LockStoreSwagger = () =>
    applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: '[ADMIN] Khóa cửa hàng',
            description: 'Store bị khóa sẽ không hiển thị ở API public và không thể nhận đơn hàng mới.',
        }),
        ApiSuccessResponse(StoreResponseDto, { description: 'Khóa cửa hàng thành công' }),
        ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc access token không hợp lệ' }),
        ApiForbiddenResponse({ description: 'Không có quyền ADMIN' }),
        ApiNotFoundResponse({ description: 'Không tìm thấy cửa hàng' }),
    );
