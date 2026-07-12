import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsUrl, Min } from "class-validator";

/** Shared by product images and service images — same two fields, same rules. */
export class AddMediaAssetDto {
  @ApiProperty({ description: "The publicUrl returned by the upload-url endpoint, after the client PUTs to uploadUrl" })
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
