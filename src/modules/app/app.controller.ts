import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/ping')
  ping() {
    return {
      success: true,
    };
  }

  @Get()
  root(): string {
    return 'Spotistats API\n\nhttps://spotistats.app/\nhttps://github.com/Netlob/spotistats-api';
  }
}
