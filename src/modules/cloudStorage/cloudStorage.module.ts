import { Global, Module } from '@nestjs/common';
import { CloudStorageService } from './cloudStorage.service';

@Global()
@Module({ providers: [CloudStorageService], exports: [CloudStorageService] })
export class CloudStorageModule {}
