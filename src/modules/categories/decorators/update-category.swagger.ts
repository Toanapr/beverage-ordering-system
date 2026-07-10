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
import { CategoryResponseDto } from '../dto/responses/category-response.dto';

export const UpdateCategorySwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[STAFF] Update a category' }),
    ApiSuccessResponse(CategoryResponseDto, {
      description: 'Category updated successfully',
    }),
    ApiBadRequestResponse({ description: 'Invalid request data' }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({
      description: 'Requires STAFF role and an assigned store',
    }),
    ApiNotFoundResponse({
      description: 'Category not found in the assigned store',
    }),
    ApiConflictResponse({
      description: 'Category name already exists in this store',
    }),
  );
