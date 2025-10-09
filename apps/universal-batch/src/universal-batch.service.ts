import { Injectable } from '@nestjs/common';

@Injectable()
export class UniversalBatchService {
  getHello(): string {
    return 'Hello World!';
  }
}
