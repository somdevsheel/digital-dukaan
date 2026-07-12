"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
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
import { apiFetch } from "../../../lib/api-client";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

interface Business {
  id: string;
  name: string;
  businessTypeId: string;
  cityId: string;
  verificationStatus: VerificationStatus;
  commissionRatePercent: number;
}

interface LookupItem {
  id: string;
  name: string;
}

const STATUS_BADGE: Record<VerificationStatus, "success" | "warning" | "destructive" | "secondary"> = {
  VERIFIED: "success",
  PENDING: "warning",
  REJECTED: "destructive",
  SUSPENDED: "secondary",
};

const ALL = "__all__";

export default function BusinessManagementPage() {
  const queryClient = useQueryClient();
  const [cityId, setCityId] = useState<string>(ALL);
  const [businessTypeId, setBusinessTypeId] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);

  const params = new URLSearchParams();
  if (cityId !== ALL) params.set("cityId", cityId);
  if (businessTypeId !== ALL) params.set("businessTypeId", businessTypeId);
  if (status !== ALL) params.set("status", status);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["admin", "businesses", "all", cityId, businessTypeId, status],
    queryFn: () => apiFetch<Business[]>(`/admin/businesses?${params.toString()}`),
  });
  const { data: businessTypes } = useQuery({
    queryKey: ["business-types"],
    queryFn: () => apiFetch<LookupItem[]>("/business-types"),
  });
  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: () => apiFetch<LookupItem[]>("/cities"),
  });

  const typeNames = useMemo(() => new Map(businessTypes?.map((t) => [t.id, t.name])), [businessTypes]);
  const cityNames = useMemo(() => new Map(cities?.map((c) => [c.id, c.name])), [cities]);

  const setSuspension = useMutation({
    mutationFn: ({ id, suspend }: { id: string; suspend: boolean }) =>
      apiFetch(`/admin/businesses/${id}/suspend`, { method: "PATCH", body: { suspend } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "businesses", "all"] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Businesses</h1>

      <div className="flex gap-3">
        <Select value={cityId} onValueChange={setCityId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cities</SelectItem>
            {cities?.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={businessTypeId} onValueChange={setBusinessTypeId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {businessTypes?.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !businesses || businesses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No businesses match these filters.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.map((business) => (
              <TableRow key={business.id}>
                <TableCell className="font-medium">{business.name}</TableCell>
                <TableCell>{typeNames.get(business.businessTypeId) ?? "—"}</TableCell>
                <TableCell>{cityNames.get(business.cityId) ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[business.verificationStatus]}>{business.verificationStatus}</Badge>
                </TableCell>
                <TableCell>{business.commissionRatePercent}%</TableCell>
                <TableCell>
                  {(business.verificationStatus === "VERIFIED" || business.verificationStatus === "SUSPENDED") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={setSuspension.isPending}
                      onClick={() =>
                        setSuspension.mutate({ id: business.id, suspend: business.verificationStatus === "VERIFIED" })
                      }
                    >
                      {business.verificationStatus === "VERIFIED" ? "Suspend" : "Reactivate"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
