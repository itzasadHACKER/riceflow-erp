import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export class JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof JwtPayload | undefined,
    ctx: ExecutionContext,
  ): JwtPayload | string | boolean => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;
    return data ? user[data] : user;
  },
);
