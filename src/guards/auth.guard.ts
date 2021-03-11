import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET as string;
console.log(jwtSecret);

@Injectable()
export class UserAuthGuard implements CanActivate {
  private readonly logger = new Logger('Auth');

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request?.headers?.authorization as string;
    let userId;

    try {
      const decodedToken = jwt.verify(token, jwtSecret);
      // @ts-ignore
      userId = decodedToken.userId;
    } catch (e) {
      return false;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return false;
    }

    request.user = user;

    return true;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger('Auth');

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request?.headers?.authorization as string;

    try {
      jwt.verify(token, jwtSecret);
    } catch (e) {
      return false;
    }

    return true;
  }
}
