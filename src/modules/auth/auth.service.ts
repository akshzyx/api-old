import { Injectable } from '@nestjs/common';
import { ApiClient, User } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import fetch from 'node-fetch';
import SpotifyWebApi from 'spotify-web-api-node';
import { decrypt, encrypt } from '../../utils/crypto';
import { resetSpotifyApiTokens } from '../../utils/spotify';
import { PrismaService } from '../prisma/prisma.service';

const spotistatsRedirectUri = process.env.SPOTISTATS_AUTH_REDIRECT_URL;
const serverUrl = process.env.SERVER_URL;
const apiPrefix = process.env.API_PREFIX;
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
  // user: User
  async refreshToken(body) {
    const code: string = body?.code as string;
    const clientId: string = body?.client_id as string;
    const codeVerifier: string = body?.code_verifier as string;

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', spotistatsRedirectUri);
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
      redirectUri: spotistatsRedirectUri,
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
    body.refresh_token = encrypt(
      // @ts-ignore
      body.refresh_token,
    );
    body.access_token = encrypt(body.access_token);

    let user = await this.prisma.user.upsert({
      where: { id: userId },
      update: {
        settings: {
          update: {
            refreshToken: body.refresh_token,
            accessToken: body.access_token,
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
            refreshToken: body.refresh_token,
            accessToken: body.access_token,
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
    return { success: true, data: authResponse };
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
