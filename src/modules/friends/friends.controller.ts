import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
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

  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Get('/search')
  async searchUser(@Query('query') query): Promise<Response> {
    return {
      data: await this.friendsService.searchUser(query),
    };
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Get('/:userid/followers')
  async getFollowers(@Param('userid') userid): Promise<Response> {
    return {
      data: await this.friendsService.getFollowers(userid),
    };
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Put('/:userid/followers')
  async followUser(@User() user, @Param('userid') userid) {
    await this.friendsService.followUser(user, userid);
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Delete('/:userid/followers')
  async unfollowUser(@User() user, @Param('userid') userid) {
    await this.friendsService.unfollowUser(user, userid);
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude({ following: true })
  @HttpCode(200)
  @Get('/following')
  async getFollowing(@User() user): Promise<Response> {
    return {
      data: await this.friendsService.getFollowing(user),
    };
  }

  @UseGuards(UserAuthGuard)
  @HttpCode(200)
  @Get('/stats/:userid')
  async userStats(@Param() params): Promise<Response> {
    return {
      data: await this.friendsService.userStats(params),
    };
  }
}
