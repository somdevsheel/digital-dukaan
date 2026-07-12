import { IsPhoneNumber, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { OTP_LENGTH } from "../../domain/value-objects/otp";

export class VerifyOtpDto {
  @ApiProperty({ example: "+919812345678" })
  @IsPhoneNumber()
  phone!: string;

  @ApiProperty({ example: "482913" })
  @IsString()
  @Length(OTP_LENGTH, OTP_LENGTH)
  code!: string;
}
