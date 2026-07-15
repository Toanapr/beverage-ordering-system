import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { I_AUTH_REPOSIROTY } from './repositories/auth-repository.interface';
import { I_REFRESH_TOKEN_REPOSITORY } from './repositories/refresh-token-repository.interface';
import { UserRole } from 'src/common/enums/role.enum';
import { User } from 'src/modules/users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: any;
  let refreshTokenRepository: any;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

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

  const mockRefreshToken: RefreshToken = {
    id: 'token-1',
    userId: 'user-1',
    token_hash: 'token-hash',
    isRevoked: false,
    expiresAt: new Date(),
    createdAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: I_AUTH_REPOSIROTY,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: I_REFRESH_TOKEN_REPOSITORY,
          useValue: {
            create: jest.fn(),
            findActiveByUserId: jest.fn(),
            revokeAllByUserId: jest.fn(),
            deleteByUserId: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
            getOrThrow: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(I_AUTH_REPOSIROTY);
    refreshTokenRepository = module.get(I_REFRESH_TOKEN_REPOSITORY);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    };

    it('should successfully register a new user', async () => {
      authRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      authRepository.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(authRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 'salt');
      expect(authRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: 'hashed-password',
        fullName: registerDto.fullName,
        role: UserRole.CUSTOMER,
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: UserRole.CUSTOMER,
        isBanned: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        avatarUrl: '',
        dob: expect.any(Date),
        gender: 'Male',
        storeId: null,
        store: null,
      });
    });

    it('should throw ConflictException if email is already in use', async () => {
      authRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(authRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login user and return user info with tokens', async () => {
      authRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('token-hash');
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      configService.get.mockReturnValue('refresh-secret');
      configService.getOrThrow.mockReturnValue('7d');

      const result = await service.login(loginDto);

      expect(authRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        mockUser.id,
        'token-hash',
        expect.any(Date),
      );
      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: UserRole.CUSTOMER,
          isBanned: false,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          avatarUrl: '',
          dob: expect.any(Date),
          gender: 'Male',
          storeId: null,
          store: null,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      authRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException if user is banned', async () => {
      authRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        isBanned: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refreshTokens', () => {
    it('should successfully refresh tokens', async () => {
      const oldRefreshToken = 'old-refresh-token';
      const decodedPayload = {
        sub: 'user-1',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };
      jwtService.verifyAsync.mockResolvedValue(decodedPayload);
      configService.get.mockReturnValue('refresh-secret');
      authRepository.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.findActiveByUserId.mockResolvedValue(
        mockRefreshToken,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-token-hash');
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      configService.getOrThrow.mockReturnValue('7d');

      const result = await service.refreshTokens(oldRefreshToken);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(oldRefreshToken, {
        secret: 'refresh-secret',
      });
      expect(authRepository.findById).toHaveBeenCalledWith(decodedPayload.sub);
      expect(refreshTokenRepository.findActiveByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        oldRefreshToken,
        mockRefreshToken.token_hash,
      );
      expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        mockUser.id,
        'new-token-hash',
        expect.any(Date),
      );
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException if jwt verify fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException if user not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'non-existent' });
      authRepository.findById.mockResolvedValue(null);

      await expect(service.refreshTokens('some-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user is banned', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      authRepository.findById.mockResolvedValue({
        ...mockUser,
        isBanned: true,
      });

      await expect(service.refreshTokens('some-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw UnauthorizedException if no active refresh token in db', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      authRepository.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.findActiveByUserId.mockResolvedValue(null);

      await expect(service.refreshTokens('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token hash does not match db record', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      authRepository.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.findActiveByUserId.mockResolvedValue(
        mockRefreshToken,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should successfully revoke all refresh tokens for user', async () => {
      const result = await service.logout('user-1');

      expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });
});
