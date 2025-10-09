import { NestFactory } from '@nestjs/core';
import { UniversalBatchModule } from './universal-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(UniversalBatchModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
