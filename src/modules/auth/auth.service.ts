import { Injectable } from '@nestjs/common';
import { ApiClient, User, UserSettings } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import fetch from 'node-fetch';
import { decrypt, encrypt } from '../../utils/crypto';
import { resetSpotifyApiTokens } from '../../utils/spotify';
import { PrismaService } from '../prisma/prisma.service';
const SpotifyWebApi = require('spotify-web-api-node');

const redirectUri = process.env.SPOTISTATS_AUTH_REDIRECT_URL;
const jwtSecret = process.env.JWT_SECRET as string;

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async getClient() {
    const client: ApiClient = await this.prisma.apiClient.findFirst({
      orderBy: { count: 'asc' },
    });

    return client.id;
  }

  async getToken(
    user: User & {
      settings: UserSettings;
      apiClient: ApiClient;
    },
  ) {
    user.apiClient.secret = decrypt(user.apiClient.secret);
    const spotifyApi = new SpotifyWebApi({
      redirectUri,
      clientSecret: user.apiClient.secret,
      clientId: user.apiClient.id,
    });
    user.settings.refreshToken = decrypt(user.settings.refreshToken);
    spotifyApi.setRefreshToken(user.settings.refreshToken);

    if (new Date(user.settings.accessTokenExpiration).getTime() < Date.now()) {
      spotifyApi.refreshAccessToken().then(async (refreshResult) => {
        spotifyApi.setAccessToken(refreshResult.body.access_token);
        spotifyApi.setRefreshToken(refreshResult.body.refresh_token);

        const expirationDate = new Date(
          Date.now() + refreshResult.body.expires_in * 1000,
        );

        refreshResult.body.refresh_token = encrypt(
          refreshResult.body.refresh_token,
        );
        refreshResult.body.access_token = encrypt(
          refreshResult.body.access_token,
        );

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            settings: {
              update: {
                accessToken: refreshResult.body.access_token,
                refreshToken: refreshResult.body.refresh_token,
                accessTokenExpiration: expirationDate,
              },
            },
          },
        });
      });
    } else {
      user.settings.accessToken = decrypt(user.settings.accessToken);
    }

    delete user.settings.refreshToken;

    return user;
  }

  async tokenExchange(body) {
    const code: string = body?.code as string;
    const clientId: string = body?.client_id as string;
    const codeVerifier: string = body?.code_verifier as string;

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('code_verifier', codeVerifier);

    const client = await this.prisma.apiClient.findUnique({
      where: {
        id: clientId,
      },
    });

    client.secret = decrypt(client.secret);

    const data = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          client.id + ':' + client.secret,
        ).toString('base64')}`,
      },
      body: params,
    }).then((res) => res.json());

    const spotifyApi = new SpotifyWebApi({
      redirectUri: redirectUri,
      clientSecret: client.secret,
      clientId: client.id,
    });

    spotifyApi.setAccessToken(data.access_token);
    spotifyApi.setRefreshToken(data.refresh_token);
    const expiryDate = new Date(Date.now() + data.expires_in * 1000);

    const userData = await spotifyApi.getMe();
    const userId = userData.body.id;
    const displayName = userData.body.display_name as string;

    // @ts-ignore
    data.refresh_token = encrypt(
      // @ts-ignore
      data.refresh_token,
    );
    data.access_token = encrypt(data.access_token);

    const user = await this.prisma.user.upsert({
      where: { id: userId },
      update: {
        settings: {
          update: {
            refreshToken: data.refresh_token,
            accessToken: data.access_token,
            accessTokenExpiration: expiryDate,
          },
        },
        apiClient: {
          connect: {
            id: spotifyApi.getClientId(),
          },
        },
      },
      create: {
        id: userId,
        displayName: displayName,
        disabled: false,
        settings: {
          create: {
            refreshToken: data.refresh_token,
            accessToken: data.access_token,
            accessTokenExpiration: expiryDate,
          },
        },
        apiClient: {
          connect: {
            id: spotifyApi.getClientId(),
          },
        },
      },
      include: {
        settings: true,
      },
    });

    await this.prisma.apiClient.update({
      where: {
        id: spotifyApi.getClientId(),
      },
      data: {
        count: {
          increment: 1,
        },
      },
    });

    user.settings.refreshToken = decrypt(user.settings.refreshToken);
    user.settings.accessToken = decrypt(user.settings.accessToken);

    const token = sign({ userId, displayName }, jwtSecret);
    const authResponse = new _AuthResponse(user, token);

    resetSpotifyApiTokens(spotifyApi);
    return authResponse;
  }
}

class _AuthResponse {
  user: User;
  apiToken: string;

  constructor(user, apiToken) {
    this.user = user;
    this.apiToken = apiToken;
  }
}
