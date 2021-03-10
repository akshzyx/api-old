import { prisma, User } from "../core/Prisma";
import redis from "../core/Redis";
import ShortUniqueId from "short-unique-id";

class ImportCodeService {
  private _dictionary: string[] = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789".split("");
  private _uid = new ShortUniqueId({ length: 6, dictionary: this._dictionary });

  async set(user: User): Promise<string> {
    const code = this._uid();
    if ((await redis.get(this._formatCode(code))) != null) {
      return await this.set(user);
    }
    await redis.set(this._formatCode(code), user.id, 10 * 60);
    return code;
  }

  async get(code: string): Promise<User> {
    const userId: string = await redis.get(this._formatCode(code));
    if (!userId) return null;
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async remove(code: string) {
    return await redis.del(this._formatCode(code));
  }

  private _formatCode(code: string) {
    return `import.${code.toUpperCase()}`;
  }
}

export default ImportCodeService;
