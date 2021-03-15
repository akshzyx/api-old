import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { PlusController } from './plus.controller';
import { PlusService } from './plus.service';

@Module({
  imports: [AuthModule],
  controllers: [PlusController],
  providers: [PlusService],
})
export class PlusModule {}
