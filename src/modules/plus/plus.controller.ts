import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthInclude } from 'src/decorators/AuthInclude.decorator';
import { User } from 'src/decorators/user.decorator';
import { UserAuthGuard } from 'src/guards/auth.guard';
import { Response } from '../../interfaces/response';
import { PlusService } from './plus.service';

@Controller('/plus')
export class PlusController {
  constructor(private plusService: PlusService) {}

  @UseGuards(UserAuthGuard)
  @AuthInclude({ inAppPurchase: true })
  @Post()
  async postReceipt(@User() user, @Req() req): Promise<Response> {
    return {
      success: true,
      data: await this.plusService.postReceipt(user, req.body),
    };
  }
}
