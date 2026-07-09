import { PaginatedResponseDto, PaginationMetaDto } from "../dto/paginated-response.dto";

export function getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
}

export function buildPaginationMeta(
    page: number,
    limit: number,
    totalItems: number,
): PaginationMetaDto {
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}

export function paginate<T>(
    items: T[],
    page: number,
    limit: number,
    totalItems: number,
): PaginatedResponseDto<T> {
    return {
        items,
        meta: buildPaginationMeta(page, limit, totalItems),
    };
}
