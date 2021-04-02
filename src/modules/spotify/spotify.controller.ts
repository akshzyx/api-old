import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { AuthInclude } from '../../decorators/AuthInclude.decorator';
import { User } from '../../decorators/user.decorator';
import { UserAuthGuard } from '../../guards/auth.guard';
import { SpotifyService } from './spotify.service';

@Controller('/spotify')
export class SpotifyController {
  constructor(private spotifyService: SpotifyService) {}

  @UseGuards(UserAuthGuard)
  @AuthInclude({ settings: true, apiClient: true })
  @HttpCode(200)
  @Get('/userinfo')
  async refreshToken(@User() user) {
    return await this.spotifyService.getUserinfo(user);
  }
}
