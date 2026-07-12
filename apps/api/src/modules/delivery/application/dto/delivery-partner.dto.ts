import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

const VEHICLE_TYPES = ["BIKE", "BICYCLE", "ON_FOOT", "VAN"] as const;

export class RegisterDeliveryPartnerDto {
  @ApiProperty()
  @IsUUID()
  cityId!: string;

  @ApiProperty({ enum: VEHICLE_TYPES })
  @IsIn(VEHICLE_TYPES)
  vehicleType!: (typeof VEHICLE_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;
}
