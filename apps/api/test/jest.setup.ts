import "reflect-metadata";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Integration tests need real DATABASE_URL/REDIS_URL (unit tests never read process.env,
// so this is a no-op harmlessly run for both projects). Node 20.6+'s built-in loader —
// no dotenv dependency needed just for test bootstrapping.
const envPath = join(__dirname, "..", ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
