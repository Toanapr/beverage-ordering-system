import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

interface ApiSuccessResponseOptions {
  status?: number;
  description?: string;
  isArray?: boolean;
}

export const ApiSuccessResponse = <TModel extends Type<any>>(
  model: TModel,
  options: ApiSuccessResponseOptions = {},
) => {
  const {
    status = 200,
    description = 'Request successful',
    isArray = false,
  } = options;

  const dataSchema = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Request successful' },
          data: dataSchema,
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-08T10:00:00.000Z',
          },
        },
      },
    }),
  );
};
