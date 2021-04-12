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
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            id: {
              contains: query,
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

  async friendStatus(selfUserId, friendUserId) {
    if (selfUserId === friendUserId) return;

    const friendShip = await this._getFriendShip(selfUserId, friendUserId);

    let status = _FriendStatus.NONE;
    if (friendShip) {
      status = _FriendStatus.FRIENDS;
    } else {
      const friendRequest = await this.prisma.friendRequest.findFirst({
        where: {
          OR: [
            {
              toId: selfUserId,
              fromId: friendUserId,
            },
            {
              toId: friendUserId,
              fromId: selfUserId,
            },
          ],
        },
      });
      if (
        friendRequest?.toId === selfUserId &&
        friendRequest?.fromId === friendUserId
      ) {
        status = _FriendStatus.REQUEST_INCOMING;
      } else if (
        friendRequest?.toId === friendUserId &&
        friendRequest?.fromId === selfUserId
      ) {
        status = _FriendStatus.REQUEST_OUTGOING;
      }
    }

    return _FriendStatus[status];
  }

  async getIncomingRequests(selfUserId) {
    return await this.prisma.friendRequest.findMany({
      where: {
        toId: selfUserId,
      },
      include: {
        from: {
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

  async getOutgoingRequests(selfUserId) {
    return await this.prisma.friendRequest.findMany({
      where: {
        fromId: selfUserId,
      },
      include: {
        to: {
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

  async sendFriendRequest(selfUserId, friendUserId) {
    if (selfUserId === friendUserId) return;

    const friendShip = await this._getFriendShip(selfUserId, friendUserId);
    if (friendShip) throw new HttpException('users are already friends', 400);

    await this.prisma.friendRequest
      .create({
        data: {
          toId: friendUserId,
          fromId: selfUserId,
        },
      })
      .catch((e) => {
        throw new HttpException(e.message, 400);
      });
  }

  async cancelFriendRequest(selfUserId, friendUserId) {
    if (selfUserId === friendUserId) return;
    await this.prisma.friendRequest
      .delete({
        where: {
          fromId_toId: {
            toId: friendUserId,
            fromId: selfUserId,
          },
        },
      })
      .catch((e) => {
        throw new HttpException(e.message, 400);
      });
  }

  async acceptFriendRequest(selfUserId, friendUserId) {
    if (selfUserId === friendUserId) return;
    const friendRequest = await this.prisma.friendRequest
      .delete({
        where: {
          fromId_toId: {
            toId: selfUserId,
            fromId: friendUserId,
          },
        },
      })
      .catch((e) => {
        throw new HttpException(e.message, 400);
      });
    if (friendRequest) {
      const [aId, bId] = [selfUserId, friendUserId].sort();
      await this.prisma.friend.create({
        data: {
          aId,
          bId,
        },
      });
    }
  }

  async denyFriendRequest(selfUserId, friendUserId) {
    if (selfUserId === friendUserId) return;
    await this.prisma.friendRequest
      .delete({
        where: {
          fromId_toId: {
            toId: selfUserId,
            fromId: friendUserId,
          },
        },
      })
      .catch((e) => {
        throw new HttpException(e.message, 400);
      });
  }

  async removeFriend(selfUserId, friendUserId) {
    const [aId, bId] = [selfUserId, friendUserId].sort();
    await this.prisma.friend
      .delete({
        where: {
          aId_bId: {
            aId,
            bId,
          },
        },
      })
      .catch((e) => {
        throw new HttpException(e.message, 400);
      });
  }

  async getFriends(user) {
    return user.friendsA.concat(user.friendsB).map((f) => (f.a ? f.a : f.b));
  }

  async userStats(selfUserId, friendUserId) {
    const friend = await this.prisma.user.findUnique({
      where: {
        id: friendUserId,
      },
    });

    switch (friend.shareSettings) {
      case SharingSettings.ALL:
        break;
      case SharingSettings.FRIENDS:
        const friendShip = await this._getFriendShip(selfUserId, friendUserId);

        if (!friendShip) {
          throw new HttpException('user doesnt share stats', 400);
        }
        break;
      case SharingSettings.NONE:
        throw new HttpException('user doesnt share stats', 400);
    }

    const spotifyApi = await this.getApi(friendUserId);

    const [userInfo, recentlyPlayed, topArtists, topTracks] = (
      await Promise.all([
        spotifyApi.getUser(friendUserId),
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

  async setSharingSettings(selfUserId, body) {
    const sharingSettings: SharingSettings = this._getSharingSettingsFromString(
      body.sharingSettings,
    );

    return await this.prisma.user.update({
      where: {
        id: selfUserId,
      },
      data: {
        shareSettings: sharingSettings,
      },
    });
  }

  async getApi(userid) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userid },
      include: { apiClient: true, settings: true },
    });

    if (!dbUser) {
      throw new HttpException('no user found', 400);
    }

    const user = await this.authService.getToken(dbUser);
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(user.settings.accessToken);

    return spotifyApi;
  }

  private _getSharingSettingsFromString(string): SharingSettings {
    string = string.toUpperCase();
    if (string === 'NONE') {
      return SharingSettings.NONE;
    } else if (string === 'FRIENDS') {
      return SharingSettings.FRIENDS;
    } else if (string === 'ALL') {
      return SharingSettings.ALL;
    }
    throw new HttpException('invalid sharingsettings', 400);
  }

  private async _getFriendShip(a, b) {
    const [aId, bId] = [a, b].sort();

    return await this.prisma.friend.findUnique({
      where: {
        aId_bId: {
          aId,
          bId,
        },
      },
      select: {
        createdAt: true,
      },
    });
  }
}

enum _FriendStatus {
  NONE,
  FRIENDS,
  REQUEST_INCOMING,
  REQUEST_OUTGOING,
}
