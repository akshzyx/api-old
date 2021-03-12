import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
