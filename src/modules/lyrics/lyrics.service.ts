import { Injectable } from '@nestjs/common';

const delimiters = [
  '</div></div></div></div><div class="hwc"><div class="BNeawe tAd8D AP7Wnd"><div><div class="BNeawe tAd8D AP7Wnd">',
  '</div></div></div></div></div><div><span class="hwc"><div class="BNeawe uEec3 AP7Wnd">',
];

@Injectable()
export class LyricsService {
  getDelimiters(): string[] {
    return delimiters;
  }
}
