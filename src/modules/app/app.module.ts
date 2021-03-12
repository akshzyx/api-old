import { CacheModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../../guards/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { ChartsModule } from '../charts/charts.module';
import { LyricsModule } from '../lyrics/lyrics.module';
import { PlusModule } from '../plus/plus.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StatusModule } from '../status/service.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    // CacheModule.register({
    //   store: redisStore,
    // }),
    PrismaModule,
    AuthModule,
    LyricsModule,
    ChartsModule,
    PlusModule,
    StatusModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
