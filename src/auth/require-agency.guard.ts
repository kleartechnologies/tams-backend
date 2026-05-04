import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { ALLOW_NO_AGENCY_KEY } from './decorators/allow-no-agency.decorator';
import { AuthUser } from './decorators/current-user.decorator';

@Injectable()
export class RequireAgencyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Public routes — no user at all, skip
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Endpoints that work before agency is created (register, me)
    const allowNoAgency = this.reflector.getAllAndOverride<boolean>(ALLOW_NO_AGENCY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowNoAgency) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user?.agencyId) {
      throw new ForbiddenException(
        'Account setup incomplete. Please complete registration.',
      );
    }

    return true;
  }
}
