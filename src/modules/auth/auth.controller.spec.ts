import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from 'src/common/enums/role.enum';
import { User } from 'src/modules/users/entities/user.entity';
import { Response } from 'express';
import { REFRESH_TOKEN_COOKIE_NAME } from './constants/cookie.constants';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    fullName: 'Test User',
    role: UserRole.CUSTOMER,
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    avatarUrl: '',
    dob: new Date(),
    gender: 'Male',
    storeId: null,
    store: null,
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as jest.Mocked<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };
      const userWithoutPassword = { id: 'user-1', email: 'test@example.com' };
      service.register.mockResolvedValue(userWithoutPassword as any);

      const result = await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(userWithoutPassword);
    });
  });

  describe('me', () => {
    it('should return the current user', () => {
      const result = controller.me(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should successfully login and set cookie', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const loginResult = {
        user: { id: 'user-1', email: 'test@example.com' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      service.login.mockResolvedValue(loginResult as any);

      const result = await controller.login(loginDto, mockResponse);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE_NAME,
        'refresh-token',
        expect.any(Object),
      );
      expect(result).toEqual({
        user: loginResult.user,
        accessToken: 'access-token',
      });
    });
  });

  describe('refresh', () => {
    it('should successfully refresh token and set new cookie', async () => {
      const mockReq = {
        cookies: {
          [REFRESH_TOKEN_COOKIE_NAME]: 'old-refresh-token',
        },
      } as any;
      const tokensResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      service.refreshTokens.mockResolvedValue(tokensResult);

      const result = await controller.refresh(mockReq, mockResponse);

      expect(service.refreshTokens).toHaveBeenCalledWith('old-refresh-token');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE_NAME,
        'new-refresh-token',
        expect.any(Object),
      );
      expect(result).toEqual({
        accessToken: 'new-access-token',
      });
    });

    it('should throw UnauthorizedException if refresh token is missing in cookies', async () => {
      const mockReqEmptyCookies = { cookies: {} } as any;
      const mockReqNoCookies = {} as any;

      await expect(
        controller.refresh(mockReqEmptyCookies, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.refresh(mockReqNoCookies, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout, clear cookie and return service response', async () => {
      const logoutDto = { userId: 'user-1' };
      const logoutResult = { message: 'Logout successful' };
      service.logout.mockResolvedValue(logoutResult);

      const result = await controller.logout(logoutDto, mockResponse);

      expect(service.logout).toHaveBeenCalledWith('user-1');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE_NAME,
        {
          path: '/auth/refresh',
        },
      );
      expect(result).toEqual(logoutResult);
    });
  });
});
