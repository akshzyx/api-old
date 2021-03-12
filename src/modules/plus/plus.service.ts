import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class PlusService {
  async postReceipt(user: User) {
    return user;
  }
}
