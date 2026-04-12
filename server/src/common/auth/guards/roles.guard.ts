import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../roles.decorator';

type RequestWithUser = {
  user?: {
    role?: Role | string;
  };
};

export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = [
      ...(Reflect.getMetadata(ROLES_KEY, context.getClass()) ?? []),
      ...(Reflect.getMetadata(ROLES_KEY, context.getHandler()) ?? []),
    ] as Role[];

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const role = request.user?.role;

    if (!role || !requiredRoles.includes(role as Role)) {
      throw new ForbiddenException('Insufficient role permission');
    }

    return true;
  }
}
