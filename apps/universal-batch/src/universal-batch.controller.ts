import { Controller, Get } from '@nestjs/common';
import { UniversalBatchService } from './universal-batch.service';

@Controller()
export class UniversalBatchController {
  constructor(private readonly universalBatchService: UniversalBatchService) {}

  @Get()
  getHello(): string {
    return this.universalBatchService.getHello();
  }
}
