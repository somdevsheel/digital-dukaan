import { IsPhoneNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RequestOtpDto {
  @ApiProperty({ example: "+919812345678" })
  @IsPhoneNumber()
  phone!: string;
}
