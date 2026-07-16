import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ForgotPasswordDto } from '../../users/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../users/dto/reset-password.dto';

type TokenPairResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn?: string;
  refreshTokenExpiresIn?: string;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  private parseDurationToMs(duration: string | undefined, fallbackMs: number): number {
    if (!duration) {
      return fallbackMs;
    }

    const matcher = /^(\d+)([mhd])$/.exec(duration);
    if (!matcher) {
      return fallbackMs;
    }

    const value = Number(matcher[1]);
    const unit = matcher[2];
    const multiplier =
      unit === 'm' ? 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    return value * multiplier;
  }

  private setAuthCookies(response: Response, tokens: TokenPairResponse) {
    const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';
    const baseOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookie('auth_token', tokens.accessToken, {
      ...baseOptions,
      maxAge: this.parseDurationToMs(tokens.accessTokenExpiresIn, 15 * 60 * 1000),
    });

    response.cookie('auth_refresh_token', tokens.refreshToken, {
      ...baseOptions,
      maxAge: this.parseDurationToMs(tokens.refreshTokenExpiresIn, 7 * 24 * 60 * 60 * 1000),
    });
  }

  private clearAuthCookies(response: Response) {
    const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';
    const baseOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    response.clearCookie('auth_token', baseOptions);
    response.clearCookie('auth_refresh_token', baseOptions);
  }

  private getCookieValue(request: Request, cookieName: string): string | null {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookieParts = cookieHeader.split(';');
    for (const part of cookieParts) {
      const [name, ...valueParts] = part.trim().split('=');
      if (name !== cookieName) {
        continue;
      }

      const rawValue = valueParts.join('=');
      if (!rawValue) {
        return null;
      }

      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }

    return null;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(response, result);
    return result;
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(response, result);
    return result;
  }

  @Post('refresh')
  async refresh(
    @Body() body: { refreshToken?: string } | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = body?.refreshToken ?? this.getCookieValue(request, 'auth_refresh_token');
    const result = await this.authService.refresh({ refreshToken: refreshToken ?? '' });
    this.setAuthCookies(response, result);
    return result;
  }

  @Post('logout')
  async logout(
    @Body() body: { refreshToken?: string } | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = body?.refreshToken ?? this.getCookieValue(request, 'auth_refresh_token');
    const result = await this.authService.logout({ refreshToken: refreshToken ?? '' });
    this.clearAuthCookies(response);
    return result;
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(dto);
  }
}
