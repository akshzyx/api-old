import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

const statusToken = process.env.STATUS_TOKEN;

@Injectable()
export class StatusService {
  constructor(private redisService: RedisService) {}

  async getStatus() {
    try {
      const data = await this.getStatusList();
      return data[0];
    } catch (e) {
      return null;
    }
  }

  async getStatusList() {
    try {
      const data = JSON.parse(await this.redisService.get('status'));
      if (data?.length < 1) throw Error();
      return data;
    } catch (e) {
      return null;
    }
  }

  async postStatus(req) {
    const token = req?.headers?.authorization;
    const body = req?.body;

    if (token != statusToken) {
      return { success: false, message: 'nice try' };
    }

    await this.redisService.set('status', JSON.stringify(body), {
      ttl: 365 * 24 * 60 * 60,
    });

    return body;
  }
}
