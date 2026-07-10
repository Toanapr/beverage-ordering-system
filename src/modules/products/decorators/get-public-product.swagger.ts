import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/responses/product-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const GetPublicProductSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Chi tiết sản phẩm (Công khai)',
      description:
        'Lấy chi tiết một sản phẩm công khai. Sản phẩm phải có trạng thái active và thuộc về cửa hàng đang mở cửa, không bị khóa.',
    }),
    ApiSuccessResponse(ProductResponseDto, {
      description: 'Lấy chi tiết sản phẩm thành công',
    }),
    ApiNotFoundResponse({ description: 'Không tìm thấy sản phẩm' }),
  );
