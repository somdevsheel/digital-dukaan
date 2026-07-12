"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@platform/ui";
import { apiFetch, ApiError } from "../../../../../lib/api-client";

interface Category {
  id: string;
  parentId: string | null;
  name: string;
  isActive: boolean;
}

interface Product {
  id: string;
  categoryId: string | null;
  name: string;
  basePricePaise: number;
  isActive: boolean;
  variants: { id: string; stockQuantity: number }[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

const addProductSchema = z.object({
  name: z.string().min(1, "Enter a product name"),
  categoryId: z.string().optional(),
  priceRupees: z.coerce.number().min(0, "Enter a price"),
  stockQuantity: z.coerce.number().int().min(0).optional(),
});
type AddProductForm = z.infer<typeof addProductSchema>;

export default function ProductsPage() {
  const { id: businessId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["merchant", "categories", businessId],
    queryFn: () => apiFetch<Category[]>(`/merchant/businesses/${businessId}/categories`),
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["merchant", "products", businessId, activeCategoryId],
    queryFn: () =>
      apiFetch<Product[]>(
        `/merchant/businesses/${businessId}/products${activeCategoryId ? `?categoryId=${activeCategoryId}` : ""}`,
      ),
  });

  const createCategory = useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/merchant/businesses/${businessId}/categories`, {
        method: "POST",
        body: { name, appliesTo: "PRODUCT" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["merchant", "categories", businessId] });
      setNewCategoryName("");
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddProductForm>({ resolver: zodResolver(addProductSchema) });

  const createProduct = useMutation({
    mutationFn: (values: AddProductForm) => {
      const pricePaise = Math.round(values.priceRupees * 100);
      return apiFetch(`/merchant/businesses/${businessId}/products`, {
        method: "POST",
        body: {
          ...(values.categoryId ? { categoryId: values.categoryId } : {}),
          name: values.name,
          slug: `${slugify(values.name)}-${Date.now().toString(36)}`,
          basePricePaise: pricePaise,
          variants: [
            {
              name: "Default",
              pricePaise,
              stockQuantity: values.stockQuantity ?? 0,
            },
          ],
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["merchant", "products", businessId] });
      reset();
      setAddProductOpen(false);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    },
  });

  const onSubmitProduct = (values: AddProductForm) => {
    setFormError(null);
    createProduct.mutate(values);
  };

  return (
    <div className="flex gap-6">
      <aside className="w-48 flex-shrink-0">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Categories</h2>
        <div className="flex flex-col gap-1">
          <button
            className={`rounded-md px-2 py-1.5 text-left text-sm ${activeCategoryId === null ? "bg-secondary font-medium" : "hover:bg-muted"}`}
            onClick={() => setActiveCategoryId(null)}
          >
            All products
          </button>
          {loadingCategories && <Skeleton className="h-8 w-full" />}
          {categories?.map((category) => (
            <button
              key={category.id}
              className={`rounded-md px-2 py-1.5 text-left text-sm ${activeCategoryId === category.id ? "bg-secondary font-medium" : "hover:bg-muted"}`}
              onClick={() => setActiveCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex flex-col gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (newCategoryName.trim()) createCategory.mutate(newCategoryName.trim());
          }}
        >
          <Input
            placeholder="New category"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="h-8 text-sm"
          />
          <Button type="submit" size="sm" variant="outline" disabled={createCategory.isPending}>
            + Add category
          </Button>
        </form>
      </aside>

      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Products</h1>
          <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
            <DialogTrigger asChild>
              <Button>+ Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add product</DialogTitle>
                <DialogDescription>Creates a product with a single default variant. Add more variants later.</DialogDescription>
              </DialogHeader>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitProduct)}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="product-name">Name</Label>
                  <Input id="product-name" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="product-category">Category (optional)</Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} {...(field.value !== undefined ? { value: field.value } : {})}>
                        <SelectTrigger id="product-category">
                          <SelectValue placeholder="Uncategorized" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="product-price">Price, ₹</Label>
                    <Input id="product-price" type="number" step="any" min={0} {...register("priceRupees")} />
                    {errors.priceRupees && <p className="text-xs text-destructive">{errors.priceRupees.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="product-stock">Stock</Label>
                    <Input id="product-stock" type="number" min={0} {...register("stockQuantity")} />
                  </div>
                </div>

                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting || createProduct.isPending}>
                    {createProduct.isPending ? "Adding…" : "Add product"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loadingProducts ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !products || products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products yet. Add your first one to start selling.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{formatRupees(product.basePricePaise)}</TableCell>
                  <TableCell>{product.variants[0]?.stockQuantity ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "success" : "secondary"}>{product.isActive ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
