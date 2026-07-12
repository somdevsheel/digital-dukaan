import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsString } from "class-validator";

export class UpdateNotificationPreferenceDto {
  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty({ enum: ["PUSH", "EMAIL", "SMS", "IN_APP"] })
  @IsIn(["PUSH", "EMAIL", "SMS", "IN_APP"])
  channel!: "PUSH" | "EMAIL" | "SMS" | "IN_APP";

  @ApiProperty()
  @IsBoolean()
  isEnabled!: boolean;
}
