import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsUUID()
  businessId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({ example: "2026-07-18" })
  @IsDateString()
  preferredDate!: string;

  @ApiProperty({ example: "10:00-12:00" })
  @IsString()
  @MinLength(1)
  preferredTimeWindow!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RespondToServiceRequestDto {
  @ApiProperty({ enum: ["CONFIRMED", "DECLINED"] })
  @IsIn(["CONFIRMED", "DECLINED"])
  status!: "CONFIRMED" | "DECLINED";
}
