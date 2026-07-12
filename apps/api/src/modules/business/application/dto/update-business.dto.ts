import { ApiPropertyOptional, PartialType, PickType } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { RegisterBusinessDto } from "./register-business.dto";

export class UpdateBusinessDto extends PartialType(
  PickType(RegisterBusinessDto, ["name", "description", "addressLine", "pinCode", "latitude", "longitude", "minOrderAmountPaise"] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryRadiusMeters?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  avgPrepTimeMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pickupEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  codEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fssaiNumber?: string;
}
