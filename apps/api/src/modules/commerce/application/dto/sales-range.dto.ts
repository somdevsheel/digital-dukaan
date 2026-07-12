import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";

export class SalesRangeDto {
  @ApiPropertyOptional({ enum: ["today", "week", "month"], default: "today" })
  @IsOptional()
  @IsIn(["today", "week", "month"])
  range?: "today" | "week" | "month";
}
