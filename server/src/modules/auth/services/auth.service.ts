import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Currency, Role, UserStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';

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

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Email is already in use');
    }

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const firstName = name.split(' ')[0] ?? 'User';
    const lastName = name.split(' ').slice(1).join(' ') || 'Account';
    const organizationName =
      dto.organizationName?.trim() || `${firstName} Organization`;

    const password = await hash(dto.password, 10);
    const employeeId = await this.generateEmployeeId();

    const created = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          country: dto.country ?? 'India',
          currency: dto.currency ?? Currency.INR,
          timezone: 'Asia/Kolkata',
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          password,
          firstName,
          lastName,
          employeeId,
          organizationId: organization.id,
          joiningDate: new Date(),
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
        },
      });

      return { organization, user };
    });

    const tokens = await this.issueTokenPair(created.user);

    return {
      ...tokens,
      tokenType: 'Bearer',
      user: {
        id: created.user.id,
        email: created.user.email,
        avatarUrl: created.user.avatarUrl,
        firstName: created.user.firstName,
        lastName: created.user.lastName,
        role: created.user.role,
        organizationId: created.user.organizationId,
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

  private async generateEmployeeId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = `${Date.now()}`.slice(-6);
      const random = Math.floor(Math.random() * 900 + 100);
      const employeeId = `EMP${suffix}${random}`;

      const exists = await this.prisma.user.findUnique({
        where: { employeeId },
        select: { id: true },
      });

      if (!exists) {
        return employeeId;
      }
    }

    throw new BadRequestException('Unable to generate employee id');
  }
}
