import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
  tokenType: 'access' | 'refresh';
};

export class JwtAuthGuard implements CanActivate {
  private getCookieValue(cookieHeader: string | undefined, cookieName: string): string | null {
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

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AccessTokenPayload;
    }>();

    const authHeader = request.headers.authorization;
    const headerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : null;
    const cookieToken = this.getCookieValue(request.headers.cookie, 'auth_token');
    const token = headerToken ?? cookieToken;

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const secret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
      const payload = verify(token, secret) as AccessTokenPayload;

      if (!payload || payload.tokenType !== 'access') {
        throw new UnauthorizedException('Invalid access token payload');
      }

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
