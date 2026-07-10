import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { CategoryResponseDto } from '../dto/responses/category-response.dto';

export const DeleteCategorySwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[STAFF] Delete a category' }),
    ApiSuccessResponse(CategoryResponseDto, {
      description: 'Category deleted successfully',
    }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({
      description: 'Requires STAFF role and an assigned store',
    }),
    ApiNotFoundResponse({
      description: 'Category not found in the assigned store',
    }),
    ApiConflictResponse({
      description: 'Cannot delete a category that contains products',
    }),
  );
