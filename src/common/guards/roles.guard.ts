import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get roles from @Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User not attached to request
    if (!user) {
      throw new ForbiddenException({
        success: false,
        message: 'Authentication required. User information not found.',
        error: 'FORBIDDEN',
        statusCode: 403,
      });
    }

    // Check if user role matches required roles
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException({
        success: false,
        message: `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
        yourRole: user.role,
        error: 'INSUFFICIENT_ROLE',
        statusCode: 403,
      });
    }

    return true;
  }
}
