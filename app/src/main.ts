import "dotenv/config";
import "reflect-metadata";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import * as bodyParser from "body-parser";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(bodyParser.json({ limit: "200mb" }));
  app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "*",
    credentials: false,
  });

  const config = new DocumentBuilder()
    .setTitle("7router API")
    .setDescription("Unified cloud storage management API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);
  if (process.env.NODE_ENV !== "production") {
    writeFileSync(join(process.cwd(), "src/generated/openapi.json"), JSON.stringify(document, null, 2));
  }

  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT ?? "20131", 10);
  await app.listen(port);
}

void bootstrap();
