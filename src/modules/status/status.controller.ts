import {
  CACHE_MANAGER,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { AuthGuard } from 'src/guards/auth.guard';
import { Response } from '../../interfaces/response';
// import { StatusService } from './status.service';

@Controller('/status')
@UseGuards(AuthGuard)
export class StatusController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // private statusService: StatusService,
  ) {}

  @Get('/status')
  async getStatus(): Promise<Response> {
    await this.cacheManager.set('status', Date.now().toString());
    return {
      success: true,
      data: await this.cacheManager.get('status'),
    };
  }

  //   @Post('/status')
  //   async postStatus(@Req() req): Promise<Response> {
  //     return {
  //       success: true,
  //       data: await this.statusService.postStatus(req.body.json()),
  //     };
  //   }
}
