import {
  Controller,
  Get,
  HttpCode,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthInclude } from '../../decorators/AuthInclude.decorator';
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
  @Get('/stats/:userid')
  async userStats(@Param() params): Promise<Response> {
    return {
      data: await this.friendsService.userStats(params),
    };
  }
}
