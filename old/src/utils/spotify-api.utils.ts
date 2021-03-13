import SpotifyWebApi from "spotify-web-api-node";
import { decrypt, encrypt } from "../misc/crypto";
import { prisma } from "../core/Prisma";

const redirectUri = process.env.SPOTIFY_AUTH_CALLBACK_URL;
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecrect = process.env.SPOTIFY_CLIENT_SECRET;

/**
 * Resets the tokens for a given SpotifyWebApi oject
 * @param {SpotifyWebApi} spotifyApi SpotifyWebApi oject to reset
 */
export function resetSpotifyApiTokens(spotifyApi: SpotifyWebApi): void {
  spotifyApi.resetAccessToken();
  spotifyApi.resetRefreshToken();
}

/**
 * Gets the spotify api for a given user. Refreshes token if expired.
 * @param {String} userId userId of wanted user
 * @returns {Promise<SpotifyWebApi>} Promise of SpotifyWebApi object for the given user
 */
export async function getUserSpotifyApi(
  userId: string
): Promise<SpotifyWebApi> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true, apiClient: true },
  });

  if (!user) {
    throw "user does not exist";
  }

  user.apiClient.secret = decrypt(user.apiClient.secret);
  const spotifyApi = new SpotifyWebApi({
    redirectUri,
    clientSecret: user.apiClient.secret,
    clientId: user.apiClient.id,
  });

  return new Promise((resolve, reject) => {
    user.settings.refreshToken = decrypt(user.settings.refreshToken);
    spotifyApi.setRefreshToken(user.settings.refreshToken);

    if (new Date(user.settings.accessTokenExpiration).getTime() < Date.now()) {
      spotifyApi.refreshAccessToken().then(
        async (refreshResult) => {
          spotifyApi.setAccessToken(refreshResult.body.access_token);
          // @ts-ignore
          spotifyApi.setRefreshToken(refreshResult.body.refresh_token);

          const expirationDate = new Date(
            Date.now() + refreshResult.body.expires_in * 1000
          );

          // @ts-ignore
          refreshResult.body.refresh_token = encrypt(
            // @ts-ignore
            refreshResult.body.refresh_token
          );
          refreshResult.body.access_token = encrypt(
            refreshResult.body.access_token
          );

          await prisma.user.update({
            where: { id: user.id },
            data: {
              settings: {
                update: {
                  accessToken: refreshResult.body.access_token,
                  // @ts-ignore
                  refreshToken: refreshResult.body.refresh_token,
                  accessTokenExpiration: expirationDate,
                },
              },
            },
          });

          resolve(spotifyApi);
        },
        (refreshError) => {
          reject(refreshError);
        }
      );
    } else {
      user.settings.accessToken = decrypt(user.settings.accessToken);
      spotifyApi.setAccessToken(user.settings.accessToken);
      resolve(spotifyApi);
    }
  });
}
