import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import ShortUniqueId from 'short-unique-id';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ImportService {
  private _dictionary: string[] = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789'.split('');
  private _uid = new ShortUniqueId({ length: 6, dictionary: this._dictionary });

  constructor(
    private redisService: RedisService,
    private prisma: PrismaService,
  ) {}

  async set(user: User): Promise<string> {
    const code = this._uid();
    if ((await this.redisService.get(this._formatCode(code))) != null) {
      return await this.set(user);
    }
    await this.redisService.set(this._formatCode(code), user.id, {
      ttl: 10 * 60,
    });
    return code;
  }

  async get(code: string): Promise<User> {
    const userId: string = await this.redisService.get(this._formatCode(code));
    if (!userId) return null;
    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async remove(code: string) {
    return await this.redisService.del(this._formatCode(code));
  }

  private _formatCode(code: string) {
    return `import.${code.toUpperCase()}`;
  }
}
