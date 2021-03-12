import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { PlusService } from './plus.service';
import { Response } from '../../interfaces/response';
import { UserAuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';

@Controller('/plus')
@UseGuards(UserAuthGuard)
export class PlusController {
  constructor(private plusService: PlusService) {}

  @Post()
  async postReceipt(@User() user): Promise<Response> {
    return {
      success: true,
      data: await this.plusService.postReceipt(user),
    };
  }
}
