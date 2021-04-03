import { HttpException, Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
const SpotifyWebApi = require('spotify-web-api-node');

@Injectable()
export class FriendsService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async searchUser(query) {
    const users = await this.prisma.user.findMany({
      take: 15,
      where: {
        OR: [
          {
            displayName: {
              startsWith: query,
              mode: 'insensitive',
            },
          },
          {
            id: {
              startsWith: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        displayName: true,
        image: true,
        country: true,
      },
    });

    return users;
  }

  async getFollowers(userid) {
    return (
      await this.prisma.user.findUnique({
        where: {
          id: userid,
        },
        include: {
          followedBy: {
            select: {
              id: true,
              displayName: true,
              image: true,
              country: true,
            },
          },
        },
      })
    ).followedBy;
  }

  async checkFollowing(user, userid) {
    if (user.id == userid) return;
    return (
      await this.prisma.user.findFirst({
        where: {
          id: user.id,
        },
        select: {
          following: {
            where: {
              id: userid,
            },
            select: {
              id: true,
              displayName: true,
              image: true,
              country: true,
            },
          },
        },
      })
    ).following;
  }

  async followUser(user, userid) {
    if (user.id == userid) return;
    try {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          following: {
            connect: { id: userid },
          },
        },
      });
    } catch (e) {
      if (
        e.message.indexOf(
          'The records for relation `UserFollows` between the `User` and `User` models are not connected.',
        ) == -1
      ) {
        throw Error(e);
      }
    }
  }

  async unfollowUser(user, userid) {
    if (user.id == userid) return;
    try {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          following: {
            disconnect: { id: userid },
          },
        },
      });
    } catch (e) {
      if (
        e.message.indexOf(
          'The records for relation `UserFollows` between the `User` and `User` models are not connected.',
        ) == -1
      ) {
        throw Error(e);
      }
    }
  }

  async getFollowing(user) {
    return user.following.map((user) => {
      return {
        id: user.id,
        displayName: user.displayName,
        image: user.image,
        country: user.country,
      };
    });
  }

  async userStats(user, userid) {
    const follows = user.following.filter((a) => a.id == userid).length == 1;
    const followed = user.followedBy.filter((a) => a.id == userid).length == 1;

    if (!follows || (!followed && user.id != userid)) {
      throw new HttpException('users arent friends', 401);
    }

    const spotifyApi = await this.getApi(userid);

    const [userInfo, recentlyPlayed, topArtists, topTracks] = (
      await Promise.all([
        spotifyApi.getUser(userid),
        spotifyApi.getMyRecentlyPlayedTracks({
          limit: 50,
        }),
        spotifyApi.getMyTopArtists({
          limit: 50,
          time_range: 'short_term',
        }),
        spotifyApi.getMyTopTracks({
          limit: 50,
          time_range: 'short_term',
        }),
      ])
    ).map((a) => a.body);

    return {
      userInfo,
      recentlyPlayed: recentlyPlayed,
      topArtists,
      topTracks,
    };
  }

  async getApi(userid) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userid },
      include: { apiClient: true, settings: true },
    });

    if (dbUser == null) {
      throw new HttpException('no user found', 400);
    }

    if (!dbUser.settings.sharesStats) {
      throw new HttpException('user doesnt share stats', 400);
    }

    const user = await this.authService.getToken(dbUser);
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(user.settings.accessToken);

    return spotifyApi;
  }
}
