import { Module } from '@nestjs/common';
import { PlusController } from './plus.controller';
import { PlusService } from './plus.service';

@Module({
  controllers: [PlusController],
  providers: [PlusService],
})
export class PlusModule {}
