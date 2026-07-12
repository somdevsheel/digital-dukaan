import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  code!: string;

  @ApiProperty({ enum: ["PERCENT", "FLAT"] })
  @IsIn(["PERCENT", "FLAT"])
  type!: "PERCENT" | "FLAT";

  @ApiProperty({ description: "Percent (0-100) or flat paise, depending on type" })
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ description: "In paise" })
  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderAmountPaise?: number;

  @ApiPropertyOptional({ description: "In paise — caps a PERCENT discount" })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscountPaise?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @ApiProperty()
  @IsDateString()
  startsAt!: string;

  @ApiProperty()
  @IsDateString()
  expiresAt!: string;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
