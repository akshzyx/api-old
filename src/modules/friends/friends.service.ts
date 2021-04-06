import { SharingSettings } from '.prisma/client';
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

  async getUserByID(userid) {
    return await this.prisma.user.findUnique({
      where: {
        id: userid,
      },
      select: {
        id: true,
        displayName: true,
        image: true,
        country: true,
      },
    });
  }

  async friendStatus(user, userid) {
    if (user.id == userid) return;
    return await this.prisma.user.findFirst({
      where: {
        id: user.id,
      },
      select: {
        friendsFrom: {
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
        friendsWith: {
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
    });
  }

  async addFriend(user, userid) {
    if (user.id == userid) return;
    try {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          friendsWith: {
            connect: { id: userid },
          },
        },
      });
    } catch (e) {
      console.log(e.message);
      if (e.message.indexOf('are not connected') == -1) throw Error(e);
    }
  }

  async removeFriend(user, userid) {
    if (user.id == userid) return;
    try {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          friendsWith: {
            disconnect: { id: userid },
          },
        },
      });
    } catch (e) {
      console.log(e.message);
      if (e.message.indexOf('are not connected') == -1) throw Error(e);
    }
  }

  async getFriends(user) {
    const friends = [];

    user.friendsWith.forEach((friend) => {
      if (!!user.friendsFrom.find((friendId) => friend.id === friendId.id)) {
        friends.push(friend);
      }
    });

    return friends;
  }

  async getFriendsFrom(user) {
    return user.friendsFrom.filter(
      (friend) =>
        !user.friendsWith.find((friendId) => friend.id === friendId.id),
    );
  }

  async getFriendsWith(user) {
    return user.friendsWith.filter(
      (friend) =>
        !user.friendsFrom.find((friendId) => friend.id === friendId.id),
    );
  }

  async userStats(user, userid) {
    switch (user.shareSettings) {
      case SharingSettings.ALL:
        break;
      case SharingSettings.SELECTED:
        const friends =
          user.friendsFrom.filter((a) => a.id == userid).length == 1;
        if (!friends && user.id != userid) {
          throw new HttpException('user doesnt share stats', 400);
        }
        break;
      case SharingSettings.NONE:
        throw new HttpException('user doesnt share stats', 400);
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

    const user = await this.authService.getToken(dbUser);
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(user.settings.accessToken);

    return spotifyApi;
  }
}
