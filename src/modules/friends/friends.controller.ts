import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthInclude } from '../../decorators/AuthInclude.decorator';
import { User } from '../../decorators/user.decorator';
import { AuthGuard, UserAuthGuard } from '../../guards/auth.guard';
import { Response } from '../../interfaces/response';
import { FriendsService } from './friends.service';

@Controller('/friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @UseGuards(UserAuthGuard)
  @AuthInclude({
    friendsWith: {
      select: {
        id: true,
        displayName: true,
        image: true,
        country: true,
      },
    },
    friendsFrom: {
      select: {
        id: true,
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

  @UseGuards(UserAuthGuard)
  @AuthInclude({
    friendsWith: {
      select: {
        id: true,
        displayName: true,
        image: true,
        country: true,
      },
    },
    friendsFrom: {
      select: {
        id: true,
      },
    },
  })
  @HttpCode(200)
  @Get('/with')
  async getFriendsWith(@User() user): Promise<Response> {
    return {
      data: await this.friendsService.getFriendsWith(user),
    };
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude({
    friendsFrom: {
      select: {
        id: true,
        displayName: true,
        image: true,
        country: true,
      },
    },
    friendsWith: {
      select: {
        id: true,
      },
    },
  })
  @HttpCode(200)
  @Get('/from')
  async getFriendsFrom(@User() user): Promise<Response> {
    return {
      data: await this.friendsService.getFriendsFrom(user),
    };
  }

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Get('/search')
  async searchUser(@Query('query') query): Promise<Response> {
    return {
      data: await this.friendsService.searchUser(query),
    };
  }

  @UseGuards(UserAuthGuard)
  @HttpCode(200)
  @Get('/status/:userid')
  async friendStatus(@User() user, @Param('userid') userid): Promise<Response> {
    return {
      data: await this.friendsService.friendStatus(user, userid),
    };
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Post('/add/:userid')
  async addFriend(@User() user, @Param('userid') userid) {
    await this.friendsService.addFriend(user, userid);
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Post('/remove/:userid')
  async removeFriend(@User() user, @Param('userid') userid) {
    await this.friendsService.removeFriend(user, userid);
  }

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Get('/get/:userid')
  async getUserByID(@Param('userid') userid): Promise<Response> {
    return {
      data: await this.friendsService.getUserByID(userid),
    };
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude({ friendsFrom: { select: { id: true } } })
  @HttpCode(200)
  @Get('/stats/:userid')
  async userStats(@User() user, @Param('userid') userid): Promise<Response> {
    return {
      data: await this.friendsService.userStats(user, userid),
    };
  }
}
