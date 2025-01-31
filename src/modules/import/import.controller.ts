import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthInclude } from '../../decorators/AuthInclude.decorator';
import { User } from '../../decorators/user.decorator';
import { UserAuthGuard } from '../../guards/auth.guard';
import { Response } from '../../interfaces/response';
import { ImportService } from './import.service';

@Controller('/import')
export class ImportController {
  constructor(private importService: ImportService) {}

  @UseGuards(UserAuthGuard)
  @AuthInclude({ settings: true, apiClient: true })
  @Get('/code')
  async getCode(@User() user): Promise<Response> {
    return {
      data: await this.importService.getCode(user),
    };
  }

  @HttpCode(200)
  @Post('/code')
  async postCode(@Req() req): Promise<Response> {
    return {
      data: await this.importService.postCode(req.body),
    };
  }

  @UseGuards(UserAuthGuard)
  @Get('/list')
  async listFiles(@User() user): Promise<Response> {
    return {
      data: await this.importService.listFiles(user),
    };
  }

  @UseGuards(UserAuthGuard)
  @Get('/download')
  async getDownloadURL(@User() user, @Req() req): Promise<Response> {
    return {
      data: await this.importService.getDownloadURL(user, req.query),
    };
  }

  @HttpCode(200)
  @Post('/upload')
  @UseInterceptors(FilesInterceptor('files'))
  async upload(@UploadedFiles() files, @Req() req): Promise<Response> {
    return {
      data: await this.importService.upload(files, req.body),
    };
  }
}
