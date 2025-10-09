import { Test, TestingModule } from '@nestjs/testing';
import { UniversalBatchController } from './universal-batch.controller';
import { UniversalBatchService } from './universal-batch.service';

describe('UniversalBatchController', () => {
  let universalBatchController: UniversalBatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UniversalBatchController],
      providers: [UniversalBatchService],
    }).compile();

    universalBatchController = app.get<UniversalBatchController>(UniversalBatchController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(universalBatchController.getHello()).toBe('Hello World!');
    });
  });
});
