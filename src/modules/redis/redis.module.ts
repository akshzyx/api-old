import { Module, Global, CacheModule } from '@nestjs/common';
import { RedisService } from './redis.service';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
