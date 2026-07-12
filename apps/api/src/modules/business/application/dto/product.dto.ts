import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CreateVariantDto {
  @ApiProperty({ example: "500g" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ description: "In paise" })
  @IsInt()
  @Min(0)
  pricePaise!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}

export class UpdateVariantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: "In paise" })
  @IsOptional()
  @IsInt()
  @Min(0)
  pricePaise?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ description: "URL-safe, unique within this business" })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ description: "In paise" })
  @IsInt()
  @Min(0)
  basePricePaise!: number;

  @ApiPropertyOptional({ description: "In paise" })
  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPricePaise?: number;

  @ApiProperty({ type: [CreateVariantDto], description: "At least one variant is required for a sellable product" })
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @ArrayMinSize(1)
  variants!: CreateVariantDto[];
}

// Not a PartialType(CreateProductDto): slug is immutable once set (it's part of the
// public URL), and variants are managed through their own add/update/remove endpoints,
// not a bulk replace here — so this DTO intentionally redeclares only what a whole-product
// update actually covers, rather than partial-typing fields that don't belong in it.
export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: "In paise" })
  @IsOptional()
  @IsInt()
  @Min(0)
  basePricePaise?: number;

  @ApiPropertyOptional({ description: "In paise" })
  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPricePaise?: number;
}
