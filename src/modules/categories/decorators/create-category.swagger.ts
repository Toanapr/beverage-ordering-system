import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { CategoryResponseDto } from '../dto/responses/category-response.dto';

export const CreateCategorySwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[STAFF] Create a category' }),
    ApiSuccessResponse(CategoryResponseDto, {
      status: 201,
      description: 'Category created successfully',
    }),
    ApiBadRequestResponse({ description: 'Invalid request data' }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({
      description: 'Requires STAFF role and an assigned store',
    }),
    ApiConflictResponse({
      description: 'Category name already exists in this store',
    }),
  );
