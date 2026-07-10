import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/responses/product-response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';

export const ListProductSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF/ADMIN] Danh sách sản phẩm',
      description:
        'STAFF chỉ thấy sản phẩm thuộc store mình được gán (storeId truyền lên sẽ bị lỗi). ADMIN có thể lọc theo storeId bất kỳ hoặc để trống để xem tất cả store. Hỗ trợ search theo tên, filter theo status, sort, phân trang.',
    }),
    ApiPaginatedResponse(
      ProductResponseDto,
      'Lấy danh sách sản phẩm thành công',
    ),
    ApiUnauthorizedResponse({
      description: 'Chưa đăng nhập hoặc access token không hợp lệ',
    }),
    ApiForbiddenResponse({
      description:
        'Không có quyền STAFF/ADMIN, hoặc STAFF chưa được gán vào store nào',
    }),
  );
