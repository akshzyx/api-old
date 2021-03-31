import { Controller, Get, Res } from '@nestjs/common';

@Controller('/redirect')
export class MiscController {
  @Get('/discord')
  async getDiscord(@Res() res) {
    return res.redirect(301, 'https://discord.gg/aV9EtB3');
  }

  @Get('/instagram')
  async getnstagram(@Res() res) {
    return res.redirect(301, 'https://instagram.com/spotistats');
  }

  @Get('/twitter')
  async getTwitter(@Res() res) {
    return res.redirect(301, 'https://twitter.com/spotistats');
  }
}
