import { Module } from '@nestjs/common';
import { UniversalBatchController } from './universal-batch.controller';
import { UniversalBatchService } from './universal-batch.service';

@Module({
  imports: [],
  controllers: [UniversalBatchController],
  providers: [UniversalBatchService],
})
export class UniversalBatchModule {}
