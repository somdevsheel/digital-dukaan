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

interface Coupon {
  id: string;
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  expiresAt: string;
  isActive: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function inThirtyDaysIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

const couponSchema = z.object({
  code: z.string().min(3, "At least 3 characters"),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.coerce.number().min(0, "Enter a value"),
  minOrderAmountRupees: z.coerce.number().min(0).optional(),
  startsAt: z.string().min(1),
  expiresAt: z.string().min(1),
});
type CouponForm = z.infer<typeof couponSchema>;

function formatValue(coupon: Coupon): string {
  return coupon.type === "PERCENT" ? `${coupon.value}% off` : `₹${coupon.value.toFixed(2)} off`;
}

export default function CouponsPage() {
  const { id: businessId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["merchant", "coupons", businessId],
    queryFn: () => apiFetch<Coupon[]>(`/merchant/businesses/${businessId}/coupons`),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues: { type: "PERCENT", startsAt: todayIso(), expiresAt: inThirtyDaysIso() },
  });

  const createCoupon = useMutation({
    mutationFn: (values: CouponForm) =>
      apiFetch(`/merchant/businesses/${businessId}/coupons`, {
        method: "POST",
        body: {
          code: values.code,
          type: values.type,
          value: values.value,
          startsAt: values.startsAt,
          expiresAt: values.expiresAt,
          ...(values.minOrderAmountRupees !== undefined
            ? { minOrderAmountPaise: Math.round(values.minOrderAmountRupees * 100) }
            : {}),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["merchant", "coupons", businessId] });
      reset({ code: "", type: "PERCENT", value: 0, startsAt: todayIso(), expiresAt: inThirtyDaysIso() });
      setOpen(false);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ couponId, isActive }: { couponId: string; isActive: boolean }) =>
      apiFetch(`/merchant/businesses/${businessId}/coupons/${couponId}`, { method: "PATCH", body: { isActive } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "coupons", businessId] }),
  });

  const onSubmit = (values: CouponForm) => {
    setFormError(null);
    createCoupon.mutate(values);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Coupons</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Add Coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add coupon</DialogTitle>
              <DialogDescription>Scoped to this business only.</DialogDescription>
            </DialogHeader>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="coupon-code">Code</Label>
                <Input id="coupon-code" placeholder="WELCOME10" {...register("code")} />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="coupon-type">Type</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="coupon-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">Percent off</SelectItem>
                          <SelectItem value="FLAT">Flat amount off</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="coupon-value">Value</Label>
                  <Input id="coupon-value" type="number" step="any" min={0} {...register("value")} />
                  {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="coupon-min-order">Minimum order amount, ₹ (optional)</Label>
                <Input id="coupon-min-order" type="number" step="any" min={0} {...register("minOrderAmountRupees")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="coupon-starts">Starts</Label>
                  <Input id="coupon-starts" type="date" {...register("startsAt")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="coupon-expires">Expires</Label>
                  <Input id="coupon-expires" type="date" {...register("expiresAt")} />
                </div>
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || createCoupon.isPending}>
                  {createCoupon.isPending ? "Adding…" : "Add coupon"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !coupons || coupons.length === 0 ? (
        <p className="text-sm text-muted-foreground">No coupons yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                <TableCell>{formatValue(coupon)}</TableCell>
                <TableCell>{new Date(coupon.expiresAt).toLocaleDateString("en-IN")}</TableCell>
                <TableCell>
                  <Badge variant={coupon.isActive ? "success" : "secondary"}>{coupon.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={toggleActive.isPending}
                    onClick={() => toggleActive.mutate({ couponId: coupon.id, isActive: !coupon.isActive })}
                  >
                    {coupon.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
