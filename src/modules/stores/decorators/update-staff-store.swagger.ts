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
      summary: '[STAFF] Update assigned store',
      description:
        'Allows updating name, phone, address, and isOpen. Set isOpen to true to open the store or false to temporarily close it. Staff cannot change the lock status or ratings.',
    }),
    ApiSuccessResponse(StoreResponseDto, {
      description: 'Assigned store updated successfully',
    }),
    ApiBadRequestResponse({ description: 'Invalid request data' }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
    }),
    ApiForbiddenResponse({
      description: 'Requires STAFF role and an assigned store',
    }),
    ApiNotFoundResponse({
      description: 'Assigned store was not found',
    }),
    ApiConflictResponse({ description: 'Store name already exists' }),
  );
