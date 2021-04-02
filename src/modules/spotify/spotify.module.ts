import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SpotifyService } from './spotify.service';
import { SpotifyController } from './spotify.controller';

@Module({
  imports: [AuthModule],
  controllers: [SpotifyController],
  providers: [SpotifyService],
})
export class SpotifyModule {}
