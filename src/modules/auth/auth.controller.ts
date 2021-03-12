import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { Response } from '../../interfaces/response';
import { AuthService } from './auth.service';

@Controller('/auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/client')
  async getClient(): Promise<Response> {
    return {
      success: true,
      data: await this.authService.getClient(),
    };
  }

  @Post('/token')
  async refreshToken(@Req() req): Promise<Response> {
    return {
      success: true,
      data: await this.authService.refreshToken(req.body.json()),
    };
  }
}
