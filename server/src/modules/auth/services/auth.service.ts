import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

type TokenPayload = {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
  tokenType: 'access' | 'refresh';
  tokenId?: string;
};

type RefreshTokenDelegate = {
  findUnique: (args: unknown) => Promise<any>;
  create: (args: unknown) => Promise<any>;
  update: (args: unknown) => Promise<any>;
  updateMany: (args: unknown) => Promise<any>;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private get refreshTokenDelegate(): RefreshTokenDelegate {
    return (this.prisma as unknown as { refreshToken: RefreshTokenDelegate }).refreshToken;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokenPair(user);

    return {
      ...tokens,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        avatarUrl: user.avatarUrl,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    if (!payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const stored = await this.refreshTokenDelegate.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    });

    if (!stored || stored.userId !== payload.sub || stored.revokedAt) {
      throw new UnauthorizedException('Refresh token is not active');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const isMatch = await compare(dto.refreshToken, stored.tokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    await this.refreshTokenDelegate.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokenPair(stored.user);
    return {
      ...tokens,
      tokenType: 'Bearer',
    };
  }

  async logout(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    if (!payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    await this.refreshTokenDelegate.updateMany({
      where: {
        id: payload.tokenId,
        userId: payload.sub,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { loggedOut: true };
  }

  private async issueTokenPair(user: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  }) {
    const accessExpiresIn = this.configService.get('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const refreshSecret = this.getRefreshSecret();

    const refreshRecord = await this.refreshTokenDelegate.create({
      data: {
        userId: user.id,
        tokenHash: 'pending',
        expiresAt: this.computeExpiryDate(refreshExpiresIn),
      },
    });

    const accessPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      tokenType: 'access',
    };

    const refreshPayload: TokenPayload = {
      ...accessPayload,
      tokenType: 'refresh',
      tokenId: refreshRecord.id,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    const tokenHash = await hash(refreshToken, 10);

    await this.refreshTokenDelegate.update({
      where: { id: refreshRecord.id },
      data: {
        tokenHash,
        expiresAt: this.computeExpiryDate(refreshExpiresIn),
      },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: accessExpiresIn,
      refreshTokenExpiresIn: refreshExpiresIn,
    };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private getRefreshSecret() {
    return this.configService.get('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret';
  }

  private computeExpiryDate(expiresIn: string) {
    const now = Date.now();
    const matcher = /^(\d+)([mhd])$/.exec(expiresIn);

    if (!matcher) {
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(matcher[1]);
    const unit = matcher[2];
    const multiplier =
      unit === 'm' ? 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    return new Date(now + value * multiplier);
  }
}
