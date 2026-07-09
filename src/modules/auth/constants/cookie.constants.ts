import { CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

export const getRefreshTokenCookieOptions = (
  maxAgeMs: number,
): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/auth/refresh',
  maxAge: maxAgeMs,
});
