import "reflect-metadata";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import * as bodyParser from "body-parser";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { SettingsService } from "./infrastructure/settings/settings.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
  const settings = app.get(SettingsService).get();
  app.enableCors({ origin: true, credentials: false });

  const config = new DocumentBuilder()
    .setTitle("7router API")
    .setDescription("Unified cloud storage management API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);
  writeFileSync(join(process.cwd(), "src/generated/openapi.json"), JSON.stringify(document, null, 2));

  await app.listen(settings.server.port);
}

void bootstrap();
