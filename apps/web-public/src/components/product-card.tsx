import type { Product } from "@/lib/api";
import { formatRupees } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const lowestPrice = product.variants.length
    ? Math.min(...product.variants.map((v) => v.pricePaise))
    : product.basePricePaise;
  const inStock = product.variants.some((v) => v.stockQuantity > 0);

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-muted">
        {product.images[0] ? (
          <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">No image</span>
        )}
      </div>
      <h3 className="truncate text-sm font-medium">{product.name}</h3>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-sm font-semibold">{formatRupees(lowestPrice)}</span>
        {!inStock && <span className="text-xs text-destructive">Out of stock</span>}
      </div>
    </div>
  );
}
