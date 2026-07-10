import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/responses/product-response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';

export const ListPublicProductSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Danh sách sản phẩm (Công khai)',
      description:
        'Khách hàng tìm kiếm, lọc và phân trang sản phẩm. Chỉ hiển thị các sản phẩm active thuộc về các cửa hàng đang mở cửa và không bị khóa.',
    }),
    ApiPaginatedResponse(
      ProductResponseDto,
      'Lấy danh sách sản phẩm thành công',
    ),
  );
