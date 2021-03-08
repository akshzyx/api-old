import { prisma, User } from "../core/Prisma";
import redis from "../core/Redis";
import ShortUniqueId from "short-unique-id";

class ImportCodeService {
  private _dictionary: string[] = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789".split("");
  private _uid = new ShortUniqueId({ length: 6, dictionary: this._dictionary });

  async set(user: User): Promise<string> {
    const code = this._uid().toUpperCase();
    if ((await redis.get(code)) != null) return await this.set(user);
    await redis.set(code, user.id, 10 * 60);
    return code;
  }

  async get(code: string): Promise<User> {
    code = code.toUpperCase();
    const userId: string = await redis.get(code);
    if (!userId) return null;
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async remove(code: string) {
    code = code.toUpperCase();
    return await redis.del(code);
  }
}

export default ImportCodeService;
