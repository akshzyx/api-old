import { Injectable, Logger } from '@nestjs/common';
import * as CSV from 'csv-string';
import { RedisService } from '../redis/redis.service';
import fetch from 'node-fetch';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ChartsService {
  private readonly logger = new Logger('Charts');
  options = { ttl: 0 };

  constructor(private redisService: RedisService) {
    this.handleCron();
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async handleCron() {
    this.logger.log('Running saveCharts...');
    await this.saveCharts();
  }

  async getCharts(type, country, date) {
    const data = {
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
    this._saveChart('regional', 'global', 'daily');
    this._saveChart('regional', 'global', 'weekly');
    this._saveChart('viral', 'global', 'daily');
    this._saveChart('viral', 'global', 'weekly');
    await this.redisService.set(
      'charts.snapshot',
      new Date().toISOString(),
      this.options,
    );
  }

  async _saveChart(type, country, date) {
    const charts = await this._getCharts(type, country, date);

    if (
      typeof charts != 'object' ||
      (charts.length != 50 && charts.length != 200) ||
      !charts[0].id ||
      !charts[0].artist ||
      !charts[0].track ||
      !charts[0].position
    ) {
      return;
    }

    await this.redisService.set(
      `charts.${type}.${country}.${date}`,
      JSON.stringify(charts),
      this.options,
    );
  }
}
