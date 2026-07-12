import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn } from "class-validator";

export class InviteStaffDto {
  @ApiProperty({ description: "Must already have a platform account (register/OTP first)" })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ["BUSINESS_OWNER", "BUSINESS_STAFF"] })
  @IsIn(["BUSINESS_OWNER", "BUSINESS_STAFF"])
  role!: "BUSINESS_OWNER" | "BUSINESS_STAFF";
}
