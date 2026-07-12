import { Global, Module } from "@nestjs/common";
import { FIELD_ENCRYPTION_PORT } from "./field-encryption.port";
import { AesFieldEncryptionAdapter } from "./aes-field-encryption.adapter";

@Global()
@Module({
  providers: [{ provide: FIELD_ENCRYPTION_PORT, useClass: AesFieldEncryptionAdapter }],
  exports: [FIELD_ENCRYPTION_PORT],
})
export class SecurityModule {}
