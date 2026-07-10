import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StoreResponseDto } from '../dto/responses/store-response.dto';

export const UpdateStaffStoreSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF] Cập nhật cửa hàng được phân công',
      description:
        'Cho phép cập nhật name, phone, address và isOpen. Không cho phép Staff thay đổi trạng thái khóa hoặc rating.',
    }),
    ApiSuccessResponse(StoreResponseDto, {
      description: 'Cập nhật cửa hàng được phân công thành công',
    }),
    ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' }),
    ApiUnauthorizedResponse({
      description: 'Chưa đăng nhập hoặc access token không hợp lệ',
    }),
    ApiForbiddenResponse({
      description:
        'Không có quyền STAFF hoặc Staff chưa được phân công cửa hàng',
    }),
    ApiNotFoundResponse({
      description: 'Cửa hàng được phân công không tồn tại',
    }),
    ApiConflictResponse({ description: 'Tên cửa hàng đã tồn tại' }),
  );
