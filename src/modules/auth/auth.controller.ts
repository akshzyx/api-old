import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthInclude } from 'src/decorators/AuthInclude.decorator';
import { User } from 'src/decorators/user.decorator';
import { UserAuthGuard } from 'src/guards/auth.guard';
import { Response } from '../../interfaces/response';
import { AuthService } from './auth.service';

@Controller('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/client')
  async getClient(): Promise<Response> {
    return {
      data: await this.authService.getClient(),
    };
  }

  @Post('/token')
  async tokenExchange(@Req() req): Promise<Response> {
    return {
      data: await this.authService.tokenExchange(req.body),
    };
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude({ settings: true, apiClient: true })
  @Get('/token')
  async getToken(@User() user): Promise<Response> {
    return { data: await this.authService.getToken(user) };
  }

  @UseGuards(UserAuthGuard)
  @AuthInclude({ settings: true, apiClient: true })
  @Post('/token/refresh')
  async refreshToken(@User() user, @Req() req) {
    return {
      access_token: (await this.authService.getToken(user)).settings
        .accessToken,
      refresh_token: req.headers.authorization,
      token_type: 'Bearer',
      expires_in: 3599,
    };
  }
}
