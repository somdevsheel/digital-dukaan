import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";

export class RegisterBusinessDto {
  @ApiProperty()
  @IsUUID()
  businessTypeId!: string;

  @ApiProperty()
  @IsUUID()
  cityId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  addressLine!: string;

  @ApiProperty()
  @IsString()
  pinCode!: string;

  @ApiProperty()
  @IsLatitude()
  latitude!: number;

  @ApiProperty()
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ description: "In paise" })
  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderAmountPaise?: number;
}
