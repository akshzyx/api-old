import { Controller, Get } from '@nestjs/common';
import { LyricsService } from './lyrics.service';
import { Response } from '../../interfaces/response';

@Controller('/lyrics')
export class LyricsController {
  constructor(private lyricsService: LyricsService) {}

  @Get('/delimiters')
  getDelimiters(): Response {
    return { success: true, data: this.lyricsService.getDelimiters() };
  }
}
