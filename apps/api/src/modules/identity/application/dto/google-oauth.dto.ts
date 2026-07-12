import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GoogleOAuthDto {
  @ApiProperty({ description: "ID token returned by Google Sign-In on the client" })
  @IsString()
  idToken!: string;
}
