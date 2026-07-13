import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// No HTTP server — this process only runs BullMQ workers (@Processor classes register
// themselves via Nest DI). createApplicationContext gives us DI/lifecycle hooks without
// binding a port, since apps/worker never receives inbound requests (Architecture §3).
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.enableShutdownHooks();
  console.log("@app/worker running — consuming: notifications, maintenance");
}

void bootstrap();
