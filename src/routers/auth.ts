import express, { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import SpotifyWebApi from "spotify-web-api-node";
import { URLSearchParams } from "url";
import { ApiClient, prisma, User } from "../core/Prisma";
import {
  getUserSpotifyApi,
  resetSpotifyApiTokens,
} from "../utils/spotify-api.utils";
import { decrypt, encrypt } from "../misc/crypto";

const authRouter = Router();

authRouter.use(express.urlencoded({ extended: true }));

const spotistatsRedirectUri = process.env.SPOTISTATS_AUTH_REDIRECT_URL;
const serverUrl = process.env.SERVER_URL;
const apiPrefix = process.env.API_PREFIX;
const jwtSecret = process.env.JWT_SECRET as string;

authRouter.get(`${apiPrefix}/auth/client`, async (req, res) => {
  const client: ApiClient = await prisma.apiClient.findFirst({
    orderBy: { count: "asc" },
  });

  res.json({ success: true, data: client.id });
});

authRouter.post(`${apiPrefix}/auth/token`, async (req, res) => {
  try {
    const code: string = req.body?.code as string;
    const clientId: string = req.body?.client_id as string;
    const codeVerifier: string = req.body?.code_verifier as string;

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", spotistatsRedirectUri);
    params.append("code_verifier", codeVerifier);

    const client = await prisma.apiClient.findUnique({
      where: {
        id: clientId,
      },
    });

    const data = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          client.id + ":" + client.secret
        ).toString("base64")}`,
      },
      body: params,
    }).then((res) => res.json());

    const spotifyApi = new SpotifyWebApi({
      redirectUri: spotistatsRedirectUri,
      clientSecret: client.secret,
      clientId: client.id,
    });

    saveUser(spotifyApi, data, res, false);
  } catch (e) {
    return res.status(500).json({ success: false, message: e });
  }
});

authRouter.get(`${apiPrefix}/auth/token`, async (req, res) => {
  try {
    const token: string = req.headers?.authorization as string;
    const decodedToken = jwt.verify(token, jwtSecret);
    // @ts-ignore
    let userId = decodedToken.userId;

    await getUserSpotifyApi(userId); // refresh the tokens (if necessary)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "user not found" });

    delete user.settings.refreshToken;

    user.settings.accessToken = decrypt(user.settings.accessToken);

    res.status(200).json({ success: true, data: user });
  } catch (e) {
    return res.status(500).json({ success: false, message: e });
  }
});

authRouter.post(`${apiPrefix}/auth/token/refresh`, async (req, res) => {
  try {
    const token: string = req.body?.refresh_token as string;

    const decodedToken = jwt.verify(token, jwtSecret);
    // @ts-ignore
    let userId = decodedToken.userId;

    const spotifyApi: SpotifyWebApi = await getUserSpotifyApi(userId);

    res.status(200).json({
      access_token: spotifyApi.getCredentials().accessToken,
      refresh_token: token,
      token_type: "Bearer",
      expires_in: 3550,
    });
  } catch (e) {
    return res.status(404).json({ success: false, message: e });
  }
});

const saveUser = async (
  spotifyApi: SpotifyWebApi,
  body,
  res: Response,
  redirect: boolean
) => {
  try {
    spotifyApi.setAccessToken(body.access_token);
    spotifyApi.setRefreshToken(body.refresh_token);
    const expiryDate = new Date(Date.now() + body.expires_in * 1000);

    const userData = await spotifyApi.getMe();
    const userId = userData.body.id;
    const displayName = userData.body.display_name as string;

    // @ts-ignore
    body.refresh_token = encrypt(
      // @ts-ignore
      body.refresh_token
    );
    body.access_token = encrypt(body.access_token);

    let user = await prisma.user.upsert({
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

    await prisma.apiClient.update({
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

    const token = jwt.sign({ userId, displayName }, jwtSecret);

    const authResponse = new _AuthResponse(user, token);

    if (redirect) {
      res.status(200).redirect(`${serverUrl}/import#complete?token=${token}`);
    } else {
      res.status(200).json({ success: true, data: authResponse });
    }
    resetSpotifyApiTokens(spotifyApi);
  } catch (e) {
    return res.status(500).json({ success: false, message: e });
  }
};

export default authRouter;

class _AuthResponse {
  user: User;
  apiToken: string;

  constructor(user, apiToken) {
    this.user = user;
    this.apiToken = apiToken;
  }
}
