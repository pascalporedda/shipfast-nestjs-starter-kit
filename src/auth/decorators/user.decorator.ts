import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as UserEntity } from '@prisma/client';

interface RequestWithUser extends Request {
  user: UserEntity;
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
