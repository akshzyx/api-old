import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
// import { createClient, RedisClient } from 'redis';
import { Cache, CachingConfig } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async set(key, value, options?: CachingConfig) {
    return this.cacheManager.set(key, value, options);
  }

  async get(key): Promise<string> {
    return this.cacheManager.get(key);
  }
}
// @Injectable()
// export class RedisService {
//   private _client: RedisClient;

//   constructor() {
//     this._client = createClient();
//     this._client.on('error', this._error);
//   }

//   get client() {
//     return this._client;
//   }

//   _error(e): void {
//     console.error(e);
//   }

//   async set(key, value, ttl = 5 * 60): Promise<string> {
//     const expire = ttl < 0 ? [] : ['EX', ttl];
//     return new Promise((resolve, reject) =>
//       // @ts-ignore
//       this._client.set(key, value, ...expire, (e, reply) =>
//         e ? reject(e) : resolve(reply?.toString()),
//       ),
//     );
//   }

//   async get(key): Promise<string> {
//     return new Promise((resolve, reject) =>
//       this._client.get(key, (e, reply) =>
//         e ? reject(e) : resolve(reply?.toString()),
//       ),
//     );
//   }

//   async del(key) {
//     return new Promise((resolve, reject) =>
//       this._client.del(key, (e, reply) =>
//         e ? reject(e) : resolve(reply?.toString()),
//       ),
//     );
//   }
// }
