import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class CheckoutDto {
  @ApiProperty()
  @IsUUID()
  businessId!: string;

  @ApiProperty()
  @IsUUID()
  cartId!: string;

  @ApiProperty({ enum: ["DELIVERY", "PICKUP"] })
  @IsIn(["DELIVERY", "PICKUP"])
  fulfillmentType!: "DELIVERY" | "PICKUP";

  @ApiPropertyOptional({ description: "Required when fulfillmentType is DELIVERY" })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiProperty({ enum: ["ONLINE", "COD"] })
  @IsIn(["ONLINE", "COD"])
  paymentMethod!: "ONLINE" | "COD";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;
}
