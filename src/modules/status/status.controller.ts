import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../guards/auth.guard';
import { Response } from '../../interfaces/response';
import { StatusService } from './status.service';

@Controller('/status')
export class StatusController {
  constructor(private statusService: StatusService) {}

  @Get()
  async getStatus(): Promise<Response> {
    return {
      data: await this.statusService.getStatus(),
    };
  }

  @Get('/list')
  async getStatusList(): Promise<Response> {
    return {
      data: await this.statusService.getStatusList(),
    };
  }

  @HttpCode(200)
  @Post()
  async postStatus(@Req() req): Promise<Response> {
    return {
      data: await this.statusService.postStatus(req),
    };
  }
}
