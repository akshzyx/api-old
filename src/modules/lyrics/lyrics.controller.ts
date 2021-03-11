import { Controller, Get, UseGuards } from '@nestjs/common';
import { LyricsService } from './lyrics.service';
import { Response } from '../../interfaces/response';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('/lyrics')
@UseGuards(AuthGuard)
export class LyricsController {
  constructor(private lyricsService: LyricsService) {}

  @Get('/delimiters')
  getDelimiters(): Response {
    return { success: true, data: this.lyricsService.getDelimiters() };
  }
}
