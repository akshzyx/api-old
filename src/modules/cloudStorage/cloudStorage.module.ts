import { Module } from '@nestjs/common';
import { CloudStorageService } from './cloudStorage.service';

@Module({ providers: [CloudStorageService] })
export class CloudStorageModule {}
