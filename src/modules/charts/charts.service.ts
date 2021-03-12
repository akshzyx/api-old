import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import * as CSV from 'csv-string';
import fetch from 'node-fetch';
import { Cache } from 'cache-manager';

@Injectable()
export class ChartsService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    setInterval(this.saveCharts, 5 * 60 * 1000); // every 5 minutes
    this.saveCharts();
  }

  async getCharts(type, country, date) {
    const data = {
      snapshot: await this.cacheManager.get('charts.snapshot'),
      data: JSON.parse(
        await this.cacheManager.get(`charts.${type}.${country}.${date}`),
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
    await this.cacheManager.set(
      'charts.regional.global.daily',
      JSON.stringify(await this._getCharts('regional', 'global', 'daily')),
    );
    await this.cacheManager.set(
      'charts.regional.global.weekly',
      JSON.stringify(await this._getCharts('regional', 'global', 'weekly')),
    );
    await this.cacheManager.set(
      'charts.viral.global.daily',
      JSON.stringify(await this._getCharts('viral', 'global', 'daily')),
    );
    await this.cacheManager.set(
      'charts.viral.global.weekly',
      JSON.stringify(await this._getCharts('viral', 'global', 'weekly')),
    );
    await this.cacheManager.set('charts.snapshot', new Date().toISOString());
  }
}
