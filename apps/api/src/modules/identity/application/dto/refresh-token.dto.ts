import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

// Mobile clients send the refresh token in the body (secure storage, no ambient cookie);
// web dashboards rely on the httpOnly cookie instead — see Architecture §9. Presentation
// layer resolves whichever is present before calling the use case.
export class RefreshTokenDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
