"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@platform/ui";
import { apiFetch, ApiError } from "../../../../lib/api-client";
import { setAccessToken } from "../../../../lib/token-store";

interface BusinessType {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  state: string;
}

const registerBusinessSchema = z.object({
  businessTypeId: z.string().min(1, "Select a business type"),
  cityId: z.string().min(1, "Select a city"),
  name: z.string().min(2, "Enter a business name"),
  description: z.string().optional(),
  addressLine: z.string().min(1, "Enter an address"),
  pinCode: z.string().min(1, "Enter a PIN code"),
  latitude: z.coerce.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  longitude: z.coerce.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
  minOrderAmountRupees: z.coerce.number().min(0).optional(),
});
type RegisterBusinessForm = z.infer<typeof registerBusinessSchema>;

export default function NewBusinessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const { data: businessTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ["business-types"],
    queryFn: () => apiFetch<BusinessType[]>("/business-types"),
  });
  const { data: cities, isLoading: loadingCities } = useQuery({
    queryKey: ["cities"],
    queryFn: () => apiFetch<City[]>("/cities"),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterBusinessForm>({ resolver: zodResolver(registerBusinessSchema) });

  const registerBusiness = useMutation({
    mutationFn: (values: RegisterBusinessForm) =>
      apiFetch<{ business: { id: string }; accessToken: string }>("/merchant/businesses", {
        method: "POST",
        body: {
          businessTypeId: values.businessTypeId,
          cityId: values.cityId,
          name: values.name,
          ...(values.description ? { description: values.description } : {}),
          addressLine: values.addressLine,
          pinCode: values.pinCode,
          latitude: values.latitude,
          longitude: values.longitude,
          ...(values.minOrderAmountRupees !== undefined
            ? { minOrderAmountPaise: Math.round(values.minOrderAmountRupees * 100) }
            : {}),
        },
      }),
    onSuccess: async (result) => {
      // The API re-mints the access token with this business's BUSINESS_OWNER grant baked
      // in (register-business.use-case.ts) — without swapping to it immediately, every
      // request against the new business (categories, products) 403s on the old token
      // until the next login/refresh.
      setAccessToken(result.accessToken);
      await queryClient.invalidateQueries({ queryKey: ["merchant", "businesses"] });
      router.push("/");
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    },
  });

  const onSubmit = (values: RegisterBusinessForm) => {
    setFormError(null);
    registerBusiness.mutate(values);
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Register your business</CardTitle>
        <CardDescription>This creates your storefront in pending verification — you can start building your catalog right away.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Business name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="businessTypeId">Business type</Label>
              <Controller
                name="businessTypeId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={loadingTypes}>
                    <SelectTrigger id="businessTypeId">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.businessTypeId && <p className="text-xs text-destructive">{errors.businessTypeId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cityId">City</Label>
              <Controller
                name="cityId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={loadingCities}>
                    <SelectTrigger id="cityId">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities?.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}, {city.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.cityId && <p className="text-xs text-destructive">{errors.cityId.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addressLine">Address</Label>
            <Input id="addressLine" {...register("addressLine")} />
            {errors.addressLine && <p className="text-xs text-destructive">{errors.addressLine.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pinCode">PIN code</Label>
              <Input id="pinCode" {...register("pinCode")} />
              {errors.pinCode && <p className="text-xs text-destructive">{errors.pinCode.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" type="number" step="any" {...register("latitude")} />
              {errors.latitude && <p className="text-xs text-destructive">{errors.latitude.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" type="number" step="any" {...register("longitude")} />
              {errors.longitude && <p className="text-xs text-destructive">{errors.longitude.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minOrderAmountRupees">Minimum order amount, ₹ (optional)</Label>
            <Input id="minOrderAmountRupees" type="number" step="any" min={0} {...register("minOrderAmountRupees")} />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" disabled={isSubmitting || registerBusiness.isPending} className="mt-2 self-start">
            {registerBusiness.isPending ? "Creating…" : "Create business"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
