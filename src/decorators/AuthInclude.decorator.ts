import { SetMetadata } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const AuthInclude = (...include: Prisma.UserInclude[]) =>
  SetMetadata('includes', include);
