import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

export class RequestUploadUrlDto {
  @ApiProperty({ example: "logo.png" })
  @IsString()
  fileName!: string;

  @ApiProperty({ enum: ALLOWED_CONTENT_TYPES })
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType!: (typeof ALLOWED_CONTENT_TYPES)[number];
}
