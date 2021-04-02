import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthInclude } from '../../decorators/AuthInclude.decorator';
import { User } from '../../decorators/user.decorator';
import { UserAuthGuard } from '../../guards/auth.guard';
import { Response } from '../../interfaces/response';
import { PlusService } from './plus.service';

@Controller('/plus')
export class PlusController {
  constructor(private plusService: PlusService) {}

  @UseGuards(UserAuthGuard)
  @AuthInclude({ inAppPurchase: true })
  @HttpCode(200)
  @Post(['/receipt', '']) // TODO remove '' after app is updated
  async postReceipt(@User() user, @Req() req): Promise<Response> {
    return {
      data: await this.plusService.postReceipt(user, req.body),
    };
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude()
  @HttpCode(200)
  @Get('/stats/:userid') // TODO remove '' after app is updated
  async userStats(@Param() params): Promise<Response> {
    return {
      data: await this.plusService.userStats(params),
    };
  }

  @HttpCode(200)
  @Get('/status/:userid') // TODO remove '' after app is updated
  async getStatus(
    @Req() req,
    @Param('userid') userid: string,
  ): Promise<Response> {
    return {
      data: await this.plusService.getStatus(req.headers, userid),
    };
  }
}
