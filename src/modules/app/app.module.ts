import { Module } from '@nestjs/common';
import { LyricsModule } from '../lyrics/lyrics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [LyricsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
