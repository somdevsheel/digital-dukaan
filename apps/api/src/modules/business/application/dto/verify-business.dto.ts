import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";

export class VerifyBusinessDto {
  @ApiProperty({ enum: ["VERIFIED", "REJECTED"] })
  @IsIn(["VERIFIED", "REJECTED"])
  status!: "VERIFIED" | "REJECTED";

  @ApiPropertyOptional({ description: "Required when rejecting" })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SuspendBusinessDto {
  @ApiProperty({ description: "true to suspend, false to reactivate a suspended business" })
  @IsBoolean()
  suspend!: boolean;
}
