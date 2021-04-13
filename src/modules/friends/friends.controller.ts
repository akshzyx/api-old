import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthInclude } from '../../decorators/AuthInclude.decorator';
import { User, UserId } from '../../decorators/user.decorator';
import { AuthGuard, UserAuthGuard } from '../../guards/auth.guard';
import { Response } from '../../interfaces/response';
import { friendSelect, FriendsService } from './friends.service';

@Controller('/friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Get('/search')
  async searchUser(@Query('query') query): Promise<Response> {
    return {
      data: await this.friendsService.searchUser(query),
    };
  }

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Get('/status/:userid')
  async friendStatus(
    @UserId() selfUserId,
    @Param('userid') friendUserId,
  ): Promise<Response> {
    return {
      data: await this.friendsService.friendStatus(selfUserId, friendUserId),
    };
  }

  @UseGuards(AuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Post('/requests/send/:userid')
  async sendFriendRequest(@UserId() selfUserId, @Param('userid') friendUserId) {
    await this.friendsService.sendFriendRequest(selfUserId, friendUserId);
  }

  @UseGuards(AuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Post('/requests/cancel/:userid')
  async cancelFriendRequest(
    @UserId() selfUserId,
    @Param('userid') friendUserId,
  ) {
    await this.friendsService.cancelFriendRequest(selfUserId, friendUserId);
  }

  @UseGuards(AuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Post('/requests/accept/:userid')
  async acceptFriendRequest(
    @UserId() selfUserId,
    @Param('userid') friendUserId,
  ) {
    await this.friendsService.acceptFriendRequest(selfUserId, friendUserId);
  }

  @UseGuards(AuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Post('/requests/deny/:userid')
  async denyFriendRequest(@UserId() selfUserId, @Param('userid') friendUserId) {
    await this.friendsService.denyFriendRequest(selfUserId, friendUserId);
  }

  @UseGuards(AuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Get('/requests/incoming')
  async getIncomingRequests(@UserId() selfUserId) {
    return {
      data: await this.friendsService.getIncomingRequests(selfUserId),
    };
  }

  @UseGuards(AuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Get('/requests/outgoing')
  async getOutgoingRequests(@UserId() selfUserId) {
    return {
      data: await this.friendsService.getOutgoingRequests(selfUserId),
    };
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude({
    friendsA: {
      include: {
        b: {
          select: friendSelect,
        },
      },
    },
    friendsB: {
      include: {
        a: {
          select: friendSelect,
        },
      },
    },
  })
  @HttpCode(200)
  @Get('/')
  async getFriends(@User() user): Promise<Response> {
    return {
      data: await this.friendsService.getFriends(user),
    };
  }

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Get('/get/:userid')
  async getUserByID(@Param('userid') userid): Promise<Response> {
    return {
      data: await this.friendsService.getUserByID(userid),
    };
  }

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Post('/remove/:userid')
  async removeFriend(
    @UserId() selfUserId,
    @Param('userid') friendUserId,
  ): Promise<Response> {
    return {
      data: await this.friendsService.removeFriend(selfUserId, friendUserId),
    };
  }

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Get('/stats/:userid')
  async userStats(
    @UserId() selfUserId,
    @Param('userid') friendUserId,
  ): Promise<Response> {
    return {
      data: await this.friendsService.userStats(selfUserId, friendUserId),
    };
  }

  @UseGuards(AuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Post('/settings')
  async setSharingSettings(
    @UserId() selfUserId,
    @Body() body,
  ): Promise<Response> {
    return {
      data: await this.friendsService.setSharingSettings(selfUserId, body),
    };
  }
}
