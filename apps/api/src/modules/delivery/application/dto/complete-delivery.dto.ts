import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CompleteDeliveryDto {
  @ApiProperty({ example: "4821" })
  @IsString()
  @Length(4, 4)
  otp!: string;
}
