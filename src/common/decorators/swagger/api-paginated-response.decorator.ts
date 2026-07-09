import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { PaginationMetaDto } from "src/common/dto/paginated-response.dto";

export const ApiPaginatedResponse = <TModel extends Type<any>>(
    model: TModel,
    description = 'Request successful',
) => {
    return applyDecorators(
        ApiExtraModels(model, PaginationMetaDto),
        ApiOkResponse({
            description,
            schema: {
                properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Request successful' },
                    data: {
                        type: 'object',
                        properties: {
                            items: {
                                type: 'array',
                                items: { $ref: getSchemaPath(model) },
                            },
                            meta: { $ref: getSchemaPath(PaginationMetaDto) },
                        },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                }
            }
        })
    )
}