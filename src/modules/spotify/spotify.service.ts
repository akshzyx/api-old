import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
const SpotifyWebApi = require('spotify-web-api-node');

@Injectable()
export class SpotifyService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async getUserinfo(user) {
    const spotifyApi = await this.getApi(user);
    const userinfo = await spotifyApi.getMe();

    await this.prisma.user.update({
      where: {
        id: userinfo.body.id,
      },
      data: {
        email: userinfo.body.email,
        displayName: userinfo.body.displayName,
        country: userinfo.body.country,
        image: userinfo.body.images[0]?.url,
        product: userinfo.body.product,
      },
    });

    return userinfo;
  }

  async getApi(dbUser) {
    const user = await this.authService.getToken(dbUser);
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(user.settings.accessToken);

    return spotifyApi;
  }
}
