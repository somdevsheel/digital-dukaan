import { plainToInstance } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsUrl, validateSync } from "class-validator";

enum NodeEnv {
  Development = "development",
  Test = "test",
  Production = "production",
}

// Fails fast on boot with a clear message if a required env var is missing/malformed,
// rather than the app starting and failing confusingly on the first request that
// touches the missing config (e.g. a checkout call blowing up because RAZORPAY_KEY_ID
// was never set). Not exhaustive over every optional integration key — only what the
// app cannot run without.
class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsNumberString()
  @IsOptional()
  PORT?: string;

  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsNotEmpty()
  REDIS_URL!: string;

  @IsUrl({ require_tld: false })
  MEILISEARCH_HOST!: string;

  @IsNotEmpty()
  MEILISEARCH_API_KEY!: string;

  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsNotEmpty()
  FIELD_ENCRYPTION_KEY!: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors.map((e) => Object.values(e.constraints ?? {}).join(", ")).join("; ");
    throw new Error(`Invalid environment configuration: ${messages}`);
  }

  return validated;
}
