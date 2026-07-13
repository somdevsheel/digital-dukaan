import { randomUUID } from "node:crypto";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap(): Promise<void> {
  // rawBody: true preserves req.rawBody (Buffer) alongside the normally-parsed req.body —
  // needed by the Razorpay webhook's HMAC signature check, which must hash the exact
  // bytes Razorpay signed, not a reserialized JSON.parse(...)/JSON.stringify(...) of it.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
    credentials: true,
  });

  // Correlation ID — propagated into every log line and into queue jobs the request
  // triggers, per Architecture §16. Honors an upstream-supplied ID (e.g. from a load
  // balancer) rather than always minting a fresh one.
  app.use((req: { headers: Record<string, string> }, _res: unknown, next: () => void) => {
    req.headers["x-correlation-id"] ??= randomUUID();
    next();
  });

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Generated from the same controller decorators the app runs on — never hand-maintained,
  // see Architecture §8.
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Hyperlocal Marketplace API")
    .setDescription("See docs/04-api-design/API_DESIGN.md for the design this implements.")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  // Set up outside the "api" prefix — SwaggerModule registers its own Express routes
  // directly, unaffected by setGlobalPrefix, so "docs" here means /docs, not /api/docs.
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument);

  app.enableShutdownHooks();

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`@app/api listening on :${port} — docs at /docs`);
}

void bootstrap();
