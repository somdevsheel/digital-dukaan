import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsLatitude, IsLongitude } from "class-validator";

export class UpdateAvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  isAvailable!: boolean;
}

export class UpdateLocationDto {
  @ApiProperty()
  @IsLatitude()
  latitude!: number;

  @ApiProperty()
  @IsLongitude()
  longitude!: number;
}
