import express, { Router, Request, Response } from "express";
import SpotifyWebApi from "spotify-web-api-node";
import jwt from "jsonwebtoken";
import { resetSpotifyApiTokens } from "../utils/spotify-api.utils";
import { prisma, User } from "../core/Prisma";
import fetch from "node-fetch";
import { URLSearchParams } from "url";

const authRouter = Router();

authRouter.use(express.urlencoded({ extended: true }));

const scopes = [
  "ugc-image-upload",
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-read-email",
  "user-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-read-private",
  "playlist-modify-private",
  "user-library-modify",
  "user-library-read",
  "user-top-read",
  "user-read-playback-position",
  "user-read-recently-played",
  "user-follow-read",
  "user-follow-modify",
];
const redirectUri = process.env.SPOTIFY_AUTH_CALLBACK_URL;
const spotistatsRedirectUri = process.env.SPOTISTATS_AUTH_REDIRECT_URL;
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecrect = process.env.SPOTIFY_CLIENT_SECRET;
const serverUrl = process.env.SERVER_URL;
const apiPrefix = process.env.API_PREFIX;

const getAuthorizeURL = (state: string) => {
  const spotifyApi = new SpotifyWebApi({
    redirectUri,
    clientSecret: clientSecrect,
    clientId,
  });
  return spotifyApi.createAuthorizeURL(scopes, state, false);
};

authRouter.get(`${apiPrefix}/auth/client`, (req, res) => {
  res.json({ success: true, data: process.env.SPOTIFY_CLIENT_ID });
});

authRouter.post(`${apiPrefix}/auth/token`, async (req, res) => {
  const code: string = req.body?.code as string;
  const codeVerifier: string = req.body?.code_verifier as string;

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", spotistatsRedirectUri);
  params.append("code_verifier", codeVerifier);

  const data = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        clientId + ":" + clientSecrect
      ).toString("base64")}`,
    },
    body: params,
  }).then((res) => res.json());

  const spotifyApi = new SpotifyWebApi({
    redirectUri: spotistatsRedirectUri,
    clientSecret: clientSecrect,
    clientId,
  });

  saveUser(spotifyApi, data, res, false);
});

authRouter.get(`${apiPrefix}/auth/redirect`, (req, res) => {
  const state = req.query?.state?.toString() ?? "state";
  const authorizeURL = getAuthorizeURL(state);
  res.redirect(301, authorizeURL);
});

authRouter.get(`${apiPrefix}/auth/redirect/url`, (req, res) => {
  const state = req.query?.state?.toString() ?? "state";
  const authorizeURL = getAuthorizeURL(state);
  res.send({ authUrl: authorizeURL });
});

authRouter.get(
  `${apiPrefix}/auth/callback`,
  async (req: Request, res: Response) => {
    try {
      const code: string = req.query.code as string;
      const spotifyApi = new SpotifyWebApi({
        redirectUri,
        clientSecret: clientSecrect,
        clientId,
      });

      const data = await spotifyApi.authorizationCodeGrant(code);
      saveUser(spotifyApi, data, res, true);
    } catch (e) {
      res.status(500).send(e.toString());
    }
  }
);

const saveUser = async (
  spotifyApi: SpotifyWebApi,
  body,
  res: Response,
  redirect: boolean
) => {
  spotifyApi.setAccessToken(body.access_token);
  spotifyApi.setRefreshToken(body.refresh_token);
  const expiryDate = new Date(Date.now() + body.expires_in * 1000);

  const userData = await spotifyApi.getMe();
  const userId = userData.body.id;
  const displayName = userData.body.display_name as string;
  const foundUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });

  let user: User;
  if (!foundUser) {
    user = await prisma.user.create({
      data: {
        id: userId,
        displayName: displayName,
        disabled: false,
        importCode: Math.floor(1000 + Math.random() * 9000).toString(),
        settings: {
          create: {
            refreshToken: body.refresh_token,
            accessToken: body.access_token,
            accessTokenExpiration: expiryDate,
          },
        },
      },
    });
  }

  const jwtSecret = process.env.JWT_SECRET as string;
  const token = jwt.sign({ userId, displayName }, jwtSecret);
  if (redirect) {
    res
      .status(200)
      .redirect(`${spotistatsRedirectUri}#complete?token=${token}`);
  } else {
    res.status(200).json({ success: true, data: user });
  }
  resetSpotifyApiTokens(spotifyApi);
};

export default authRouter;
