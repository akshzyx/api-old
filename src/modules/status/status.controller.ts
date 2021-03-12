import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { Response } from '../../interfaces/response';
import { StatusService } from './status.service';

@Controller('/status')
@UseGuards(AuthGuard)
export class StatusController {
  constructor(private statusService: StatusService) {}

  @Get()
  async getStatus(): Promise<Response> {
    // await this.redisService.set('status', Date.now().toString());
    return {
      success: true,
      data: await this.statusService.getStatus(),
    };
  }

  @Post()
  async postStatus(@Req() req): Promise<Response> {
    return {
      success: true,
      data: await this.statusService.postStatus(req.body),
    };
  }
}
