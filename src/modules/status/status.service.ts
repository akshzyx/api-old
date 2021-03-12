import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

const statusToken = process.env.STATUS_TOKEN;

@Injectable()
export class StatusService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getStatus() {
    try {
      const data = JSON.parse(await this.cacheManager.get('status'));
      if (data?.enabled != true) throw Error();
      return { success: true, data: data };
    } catch (e) {
      return { success: true, data: null };
    }
  }

  async postStatus(body) {
    const token = body?.token;

    if (token != statusToken) {
      return { success: false, message: 'nice try' };
    }

    delete body.token;

    await this.cacheManager.set('status', JSON.stringify(body), { ttl: null });

    return { success: true, message: body };
  }
}
