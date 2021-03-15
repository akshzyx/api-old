import { Injectable, Logger } from '@nestjs/common';
import * as CSV from 'csv-string';
import { RedisService } from '../redis/redis.service';
import fetch from 'node-fetch';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ChartsService {
  private readonly logger = new Logger('Charts');

  constructor(private redisService: RedisService) {}

  @Cron(CronExpression.EVERY_2_HOURS)
  async handleCron() {
    this.logger.log('Running saveCharts...');
    await this.saveCharts();
  }

  async getCharts(type, country, date) {
    const data = {
      snapshot: await this.redisService.get('charts.snapshot'),
      data: JSON.parse(
        await this.redisService.get(`charts.${type}.${country}.${date}`),
      ), // TODO: is this safe?
    };

    return data;
  }

  async _getCharts(type, country, date) {
    const lastIndex = type == 'regional' ? 4 : 3;
    const csvData = await fetch(
      `https://spotifycharts.com/${type}/${country}/${date}/latest/download`,
    ).then((res) => res.text());

    return CSV.parse(csvData.trim())
      .splice(lastIndex - 2)
      .map((track) => {
        return {
          position: parseInt(track[0]),
          track: track[1],
          artist: track[2],
          streams: lastIndex == 4 ? parseInt(track[3]) : null,
          id: /track\/(?<id>[0-9a-zA-Z]+)$/.exec(track[lastIndex])?.groups?.id,
        };
      })
      .filter((t) => typeof t.id == 'string' && t?.id?.length > 5);
  }

  async saveCharts() {
    const options = { ttl: 10 * 60 };
    await this.redisService.set(
      'charts.regional.global.daily',
      JSON.stringify(await this._getCharts('regional', 'global', 'daily')),
      options,
    );
    await this.redisService.set(
      'charts.regional.global.weekly',
      JSON.stringify(await this._getCharts('regional', 'global', 'weekly')),
      options,
    );
    await this.redisService.set(
      'charts.viral.global.daily',
      JSON.stringify(await this._getCharts('viral', 'global', 'daily')),
      options,
    );
    await this.redisService.set(
      'charts.viral.global.weekly',
      JSON.stringify(await this._getCharts('viral', 'global', 'weekly')),
      options,
    );
    await this.redisService.set(
      'charts.snapshot',
      new Date().toISOString(),
      options,
    );
  }
}
