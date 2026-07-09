import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { StoreResponseDto } from '../dto/responses/store-response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';

export const ListStoreSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Danh sách cửa hàng (public)',
      description:
        'Hỗ trợ tìm kiếm (search theo tên), lọc (isOpen) và sort. Store bị khóa (isLocked=true) không bao giờ xuất hiện trong kết quả, kể cả khi truyền isLocked=true.',
    }),
    ApiPaginatedResponse(StoreResponseDto, 'Lấy danh sách cửa hàng thành công'),
  );
