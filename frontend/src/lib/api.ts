import type { ApiEnvelope, Paginated } from '../types';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function extractMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Không thể kết nối đến máy chủ.';
  const message = (payload as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join('. ');
  return typeof message === 'string' ? message : 'Yêu cầu chưa được xử lý.';
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(extractMessage(payload), response.status);
  return (payload as ApiEnvelope<T>).data;
}

export function withQuery(path: string, params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function imageUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;

  const seedImage = path.match(/^\/uploads\/products\/([^/]+)$/);
  const isGeneratedUpload = seedImage?.[1]
    ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(
        seedImage[1],
      )
    : false;

  if (seedImage && !isGeneratedUpload) {
    return `/images/${seedImage[1]}`;
  }

  return `${API_URL}${path}`;
}

export function normalizePage<T>(data: Paginated<T> | T[]): Paginated<T> {
  if (Array.isArray(data)) {
    return {
      items: data,
      meta: { page: 1, limit: data.length, totalItems: data.length, totalPages: 1 },
    };
  }
  return data;
}

export const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format;

export const shortDate = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format;
