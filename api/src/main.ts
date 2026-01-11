import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable cookie parser
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://journal.app.dev.nusa.work",
      "https://journal.app.dev.nusa.work",
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Nusa Journal API running on: http://localhost:${port}`);
}

bootstrap();
