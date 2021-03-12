import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { Response } from '../../interfaces/response';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('/charts')
@UseGuards(AuthGuard)
export class ChartsController {
  constructor(private chartsService: ChartsService) {}

  @Get('/:type/:country/:date')
  async getCharts(
    @Param('type') type: string,
    @Param('country') country: string,
    @Param('date') date: string,
  ): Promise<Response> {
    return {
      success: true,
      data: await this.chartsService.getCharts(type, country, date),
    };
  }
}
