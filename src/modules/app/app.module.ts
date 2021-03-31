import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ChartsModule } from '../charts/charts.module';
import { CloudStorageModule } from '../cloudStorage/cloudStorage.module';
import { ImportModule } from '../import/import.module';
import { LyricsModule } from '../lyrics/lyrics.module';
import { MiscModule } from '../misc/misc.module';
import { PlusModule } from '../plus/plus.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { StatusModule } from '../status/service.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    RedisModule,
    PrismaModule,
    CloudStorageModule,
    AuthModule,
    ImportModule,
    LyricsModule,
    ChartsModule,
    PlusModule,
    StatusModule,
    MiscModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
