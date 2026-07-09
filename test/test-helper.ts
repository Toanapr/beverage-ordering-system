import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { DataSource } from 'typeorm';

export interface TestContext {
  app: INestApplication;
  dataSource: DataSource;
}

export async function setupTestContext(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.init();

  const dataSource = moduleFixture.get<DataSource>(DataSource);
  await dataSource.runMigrations();

  return { app, dataSource };
}

export async function teardownTestContext(context: TestContext): Promise<void> {
  const { app, dataSource } = context;
  if (dataSource && dataSource.isInitialized) {
    await dataSource.dropDatabase();
    await dataSource.destroy();
  }
  if (app) {
    await app.close();
  }
}
