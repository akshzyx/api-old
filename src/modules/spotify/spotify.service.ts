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

    const image = userinfo.body.images[0]?.url;
    await this.prisma.user.update({
      where: {
        id: userinfo.body.id,
      },
      data: {
        email: userinfo.body.email,
        displayName: userinfo.body.displayName,
        country: userinfo.body.country,
        image: image,
        product: userinfo.body.product,
      },
    });

    // PATCH
    if (!image || userinfo.body.images.length == 0) {
      userinfo.body.images = [
        {
          height: null,
          url:
            'https://media.discordapp.net/attachments/830562126560231464/834151346470387752/image-14-3.png',
          width: null,
        },
      ];
    }
    // PATCH

    return userinfo;
  }

  async getApi(dbUser) {
    const user = await this.authService.getToken(dbUser);
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(user.settings.accessToken);

    return spotifyApi;
  }
}
