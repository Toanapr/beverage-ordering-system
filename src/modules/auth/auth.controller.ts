import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { getRefreshTokenCookieOptions, REFRESH_TOKEN_COOKIE_NAME } from "./constants/cookie.constants";
import { LogoutSwagger } from "./decorators/logout.swagger";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshSwagger } from "./decorators/refresh.swagger";
import { LoginSwagger } from "./decorators/login.swagger";
import { RegisterSwagger } from "./decorators/register.swagger";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "src/modules/users/entities/user.entity";

const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @RegisterSwagger()
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    me(@CurrentUser() user: User) {
        return user;
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @LoginSwagger()
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { user, accessToken, refreshToken } = await this.authService.login(loginDto);

        res.cookie(
            REFRESH_TOKEN_COOKIE_NAME,
            refreshToken,
            getRefreshTokenCookieOptions(REFRESH_TOKEN_MAX_AGE_MS),
        );

        return { user, accessToken };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @RefreshSwagger()
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
        if (!refreshToken) {
            throw new UnauthorizedException('Không tìm thấy refresh token');
        }

        const tokens = await this.authService.refreshTokens(refreshToken);

        res.cookie(
            REFRESH_TOKEN_COOKIE_NAME,
            tokens.refreshToken,
            getRefreshTokenCookieOptions(REFRESH_TOKEN_MAX_AGE_MS),
        );

        return { accessToken: tokens.accessToken };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @LogoutSwagger()
    async logout(
        @Body() body: LogoutDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.logout(body.userId);
        res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/auth/refresh' });
        return result;
    }
}
