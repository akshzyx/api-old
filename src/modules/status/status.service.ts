import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

const statusToken = process.env.STATUS_TOKEN;

@Injectable()
export class StatusService {
  constructor(private redisService: RedisService) {}

  async getStatus() {
    try {
      const data = JSON.parse(await this.redisService.get('status'));
      if (data?.enabled != true) throw Error();
      return data;
    } catch (e) {
      return null;
    }
  }

  async postStatus(body) {
    const token = body?.token;
    console.log(body);

    if (token != statusToken) {
      return { success: false, message: 'nice try' };
    }

    delete body.token;

    await this.redisService.set('status', JSON.stringify(body), {
      ttl: 24 * 60 * 60,
    });

    return body;
  }
}
