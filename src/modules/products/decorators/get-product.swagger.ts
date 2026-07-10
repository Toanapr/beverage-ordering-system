import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/responses/product-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const GetProductSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF/ADMIN] Chi tiết sản phẩm',
      description:
        'STAFF chỉ xem được sản phẩm thuộc store mình đang được gán.',
    }),
    ApiSuccessResponse(ProductResponseDto, {
      description: 'Lấy chi tiết sản phẩm thành công',
    }),
    ApiUnauthorizedResponse({
      description: 'Chưa đăng nhập hoặc access token không hợp lệ',
    }),
    ApiForbiddenResponse({
      description:
        'Sản phẩm thuộc store khác — không có quyền xem (store ownership)',
    }),
    ApiNotFoundResponse({ description: 'Không tìm thấy sản phẩm' }),
  );
