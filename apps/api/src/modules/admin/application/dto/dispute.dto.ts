import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, IsUUID, MinLength } from "class-validator";

const DISPUTE_TYPES = ["REFUND", "QUALITY", "DELIVERY", "OTHER"] as const;

export class CreateDisputeDto {
  @ApiProperty()
  @IsUUID()
  orderId!: string;

  @ApiProperty({ enum: DISPUTE_TYPES })
  @IsIn(DISPUTE_TYPES)
  type!: (typeof DISPUTE_TYPES)[number];
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ["RESOLVED", "REJECTED"] })
  @IsIn(["RESOLVED", "REJECTED"])
  status!: "RESOLVED" | "REJECTED";

  @ApiProperty()
  @IsString()
  @MinLength(1)
  resolutionNote!: string;
}
