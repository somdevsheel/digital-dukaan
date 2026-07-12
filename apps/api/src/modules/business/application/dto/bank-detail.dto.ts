import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length, Matches } from "class-validator";

export class UpsertBankDetailDto {
  @ApiProperty()
  @IsString()
  accountHolderName!: string;

  @ApiProperty()
  @IsString()
  @Length(9, 18)
  accountNumber!: string;

  @ApiProperty({ example: "HDFC0001234" })
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: "ifsc must be a valid IFSC code" })
  ifsc!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  upiId?: string;
}
