"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@platform/ui";
import { apiFetch, ApiError } from "../../lib/api-client";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

interface Business {
  id: string;
  name: string;
  businessTypeId: string;
  cityId: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

interface LookupItem {
  id: string;
  name: string;
}

const TABS: { status: VerificationStatus; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "VERIFIED", label: "Approved" },
  { status: "REJECTED", label: "Rejected" },
];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function VerificationQueuePage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<VerificationStatus>("PENDING");
  const [rejecting, setRejecting] = useState<Business | null>(null);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["admin", "businesses", status],
    queryFn: () => apiFetch<Business[]>(`/admin/businesses?status=${status}`),
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

  const verify = useMutation({
    mutationFn: ({ id, decision, reason: rejectReason }: { id: string; decision: "VERIFIED" | "REJECTED"; reason?: string }) =>
      apiFetch(`/admin/businesses/${id}/verify`, {
        method: "PATCH",
        body: { status: decision, ...(rejectReason ? { reason: rejectReason } : {}) },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "businesses"] });
      setRejecting(null);
      setReason("");
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={status} onValueChange={(v) => setStatus(v as VerificationStatus)}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.status} value={tab.status}>
              {tab.label}
              {tab.status === status && businesses ? ` (${businesses.length})` : ""}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !businesses || businesses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No businesses {status === "PENDING" ? "awaiting review" : `with status ${status.toLowerCase()}`}.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Submitted</TableHead>
              {status === "PENDING" && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.map((business) => (
              <TableRow key={business.id}>
                <TableCell className="font-medium">{business.name}</TableCell>
                <TableCell>{typeNames.get(business.businessTypeId) ?? "—"}</TableCell>
                <TableCell>{cityNames.get(business.cityId) ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{timeAgo(business.createdAt)}</TableCell>
                {status === "PENDING" && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={verify.isPending}
                        onClick={() => {
                          setFormError(null);
                          setRejecting(business);
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={verify.isPending}
                        onClick={() => verify.mutate({ id: business.id, decision: "VERIFIED" })}
                      >
                        Approve
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejecting?.name}</DialogTitle>
            <DialogDescription>The reason is recorded on the audit log and isn&apos;t shown to the merchant yet.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={verify.isPending || !reason.trim()}
              onClick={() => rejecting && verify.mutate({ id: rejecting.id, decision: "REJECTED", reason: reason.trim() })}
            >
              {verify.isPending ? "Rejecting…" : "Reject business"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
