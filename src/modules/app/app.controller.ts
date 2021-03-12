import { All, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/ping')
  ping() {
    return {
      success: true,
      data: null,
    };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
