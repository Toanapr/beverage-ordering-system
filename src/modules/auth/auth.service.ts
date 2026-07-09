import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import {
  I_REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from './repositories/refresh-token-repository.interface';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/common/enums/role.enum';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import {
  I_AUTH_REPOSIROTY,
  type IAuthRepository,
} from './repositories/auth-repository.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(I_AUTH_REPOSIROTY)
    private readonly authRepository: IAuthRepository,

    @Inject(I_REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;
    const emailExist = await this.authRepository.findByEmail(email);

    if (emailExist) {
      throw new ConflictException('Email này đã được sử dụng!');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await this.authRepository.create({
      email,
      passwordHash,
      fullName,
      role: UserRole.CUSTOMER,
    });

    const { passwordHash: ignoredPasswordHash, ...userWithoutPassword } =
      newUser;
    void ignoredPasswordHash;
    return userWithoutPassword;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Your account has been locked!');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const tokens = await this.generateTokens(payload);

    await this.updateRefreshToken(user.id, tokens.refreshToken);
    const { passwordHash: ignoredPasswordHash, ...userWithoutPassword } = user;
    void ignoredPasswordHash;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    let decoded: { sub: string; email: string; role: string };
    try {
      decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.authRepository.findById(decoded.sub);
    if (!user || user.isBanned) throw new ForbiddenException('Access denied');

    const tokenRecord = await this.refreshTokenRepository.findActiveByUserId(
      user.id,
    );
    if (!tokenRecord)
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');

    const isMatch = await bcrypt.compare(refreshToken, tokenRecord.token_hash);
    if (!isMatch) throw new UnauthorizedException('Token không hợp lệ');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const tokens = await this.generateTokens(payload);

    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.refreshTokenRepository.revokeAllByUserId(userId);
    return { message: 'Đăng xuất thành công!' };
  }

  private async generateTokens(payload: {
    sub: string;
    email: string;
    role: string;
  }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { jwtid: randomUUID() }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
        jwtid: randomUUID(),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(refreshToken, salt);

    await this.refreshTokenRepository.deleteByUserId(userId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.create(userId, hash, expiresAt);
  }
}
