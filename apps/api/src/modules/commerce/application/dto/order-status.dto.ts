import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

// DELIVERED is deliberately excluded — that transition belongs to the delivery partner's
// OTP-gated handoff (Delivery module), not a merchant-initiated status change. COMPLETED
// is included because pickup orders have no delivery partner in the loop at all; the
// merchant is the only actor who can mark a pickup order finished.
const MERCHANT_SETTABLE_STATUSES = ["ACCEPTED", "REJECTED", "PACKING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"] as const;

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: MERCHANT_SETTABLE_STATUSES })
  @IsIn(MERCHANT_SETTABLE_STATUSES)
  status!: (typeof MERCHANT_SETTABLE_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CancelOrderDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  reason!: string;
}
