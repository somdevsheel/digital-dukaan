import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsBoolean, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";

export class DayHoursDto {
  @ApiProperty({ minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: "09:00", required: false })
  @IsOptional()
  @IsString()
  openTime?: string;

  @ApiProperty({ example: "21:00", required: false })
  @IsOptional()
  @IsString()
  closeTime?: string;

  @ApiProperty()
  @IsBoolean()
  isClosed!: boolean;
}

export class ReplaceBusinessHoursDto {
  @ApiProperty({ type: [DayHoursDto] })
  @ValidateNested({ each: true })
  @Type(() => DayHoursDto)
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  days!: DayHoursDto[];
}
