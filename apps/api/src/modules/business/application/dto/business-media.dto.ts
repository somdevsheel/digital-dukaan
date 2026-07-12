import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, IsString, IsUrl, Min } from "class-validator";

const MEDIA_TYPES = ["LOGO", "BANNER", "GALLERY"] as const;

export class AddBusinessMediaDto {
  @ApiProperty({ enum: MEDIA_TYPES })
  @IsIn(MEDIA_TYPES)
  type!: (typeof MEDIA_TYPES)[number];

  @ApiProperty()
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

const DOCUMENT_TYPES = ["GST", "PAN", "FSSAI", "BANK_PROOF", "ID_PROOF", "OTHER"] as const;

export class RecordBusinessDocumentDto {
  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsIn(DOCUMENT_TYPES)
  type!: (typeof DOCUMENT_TYPES)[number];

  @ApiProperty()
  @IsUrl()
  fileUrl!: string;
}

export class RequestBusinessUploadUrlDto {
  @ApiProperty({ enum: ["documents", "media"] })
  @IsIn(["documents", "media"])
  folder!: "documents" | "media";

  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty()
  @IsString()
  contentType!: string;
}
