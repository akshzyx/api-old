import { Router, Request, Response } from "express";
import SpotifyWebApi from "spotify-web-api-node";
import jwt from "jsonwebtoken";
import { resetSpotifyApiTokens } from "../utils/spotify-api.utils";
import { prisma, User } from "../core/Prisma";

const authRouter = Router();

const scopes = [
  "user-read-recently-played",
  "user-top-read",
  "playlist-modify-public",
  "playlist-modify-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-follow-read",
  "user-library-read",
  "user-read-email",
  "user-read-private",
];
const redirectUri = process.env.SPOTIFY_AUTH_CALLBACK_URL;
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecrect = process.env.SPOTIFY_CLIENT_SECRET;

const getAuthorizeURL = () => {
  const spotifyApi = new SpotifyWebApi({
    redirectUri,
    clientSecret: clientSecrect,
    clientId,
  });
  // TODO make state depend on the request. Maybe a hash of a cookie or something?
  const state = "spotify_auth_state";
  // Return the authorization URL
  return spotifyApi.createAuthorizeURL(scopes, state);
};

authRouter.get("/v1/auth/redirect", (req, res) => {
  const authorizeURL = getAuthorizeURL();
  res.redirect(301, authorizeURL);
});

authRouter.get("/v1/auth/redirect/url", (req, res) => {
  const authorizeURL = getAuthorizeURL();
  res.send({ authUrl: authorizeURL });
});

authRouter.get("/v1/auth/callback", async (req: Request, res: Response) => {
  try {
    const code: string = req.query.code as string;
    // The returnedState should be compared with the sent one.
    // const returnedState = req.query.state || null;
    const spotifyApi = new SpotifyWebApi({
      redirectUri,
      clientSecret: clientSecrect,
      clientId,
    });

    const data = await spotifyApi.authorizationCodeGrant(code);
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);
    const expiryDate = new Date(Date.now() + data.body.expires_in * 1000);

    const userData = await spotifyApi.getMe();
    const userId = userData.body.id;
    const displayName = userData.body.display_name as string;
    // search if user already exists
    const foundUser = await prisma.user.findUnique({where: {id: userId}, include: {settings: true}})

    let user: User
    // if user doenst exist create one
    if (!foundUser) {
      user = await prisma.user.create({
        data: {
          id: userId,
          displayName: displayName,
          disabled: false,
          settings: {
            create: {
              refreshToken: data.body.refresh_token,
              accessToken: data.body.access_token,
              accessTokenExpiration: expiryDate,
              hasImported: false
          }}
        }
      })
    }

    const jwtSecret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ userId, displayName }, jwtSecret);

    // res.setHeader("Authorization", token);
    // res.send({ token });
    res
      .status(200)
      .redirect(`http://localhost:3000/import#complete?token=${token}`);
    resetSpotifyApiTokens(spotifyApi);
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

export default authRouter;
