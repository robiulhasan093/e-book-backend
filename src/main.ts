import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter, PrismaExceptionFilter } from './common/filters';
import {
  LoggingInterceptor,
  TransformInterceptor,
} from './common/interceptors';
import {
  getAvailablePort,
  initializeAPM,
  setupRateLimiting,
  setupRequestLogging,
  setupSecurity,
  setupSwagger,
} from './common/server/server.main.file';
import { HttpAdapterHost } from '@nestjs/core';

export async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get('NODE_ENV', 'development');

  initializeAPM(configService, nodeEnv);

  const port = await getAvailablePort(configService.get<number>('PORT', 3000));

  // Global prefix: all routes are served under /api/v1/<route>
  app.setGlobalPrefix('api');

  app.use('/', (req: any, res: any, next: any) => {
    if (req.path === '/' && req.method === 'GET') {
      return res.status(200).json({
        statusCode: 200,
        message: 'Success',
        meta: null,
        data: `${configService.get<string>('APP_NAME')} Running Successfully!`,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  setupSecurity(app, configService, nodeEnv);

  const { httpAdapter } = app.get(HttpAdapterHost);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(httpAdapter),
  );
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  setupRateLimiting(app, configService, nodeEnv);
  setupRequestLogging(app, logger);
  // setupSwagger(app, nodeEnv, port);
  setupSwagger(app, nodeEnv, port, configService);

  const server = await app.listen(port, '0.0.0.0');

  logger.log(`App: http://localhost:${port}`);
  logger.log(`API: http://localhost:${port}`);
  logger.log(`Docs: http://localhost:${port}/docs`);

  const shutdown = async () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 30000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
