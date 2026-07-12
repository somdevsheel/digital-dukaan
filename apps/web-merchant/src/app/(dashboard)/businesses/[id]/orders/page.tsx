"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton, StatusStepper } from "@platform/ui";
import { apiFetch } from "../../../../../lib/api-client";

type OrderStatus = "PLACED" | "ACCEPTED" | "REJECTED" | "PACKING" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED" | "COMPLETED" | "CANCELLED";

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentType: "DELIVERY" | "PICKUP";
  totalPaise: number;
  items: { id: string; nameSnapshot: string; quantity: number }[];
}

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: "PLACED", label: "New" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "PACKING", label: "Packing" },
  { status: "READY", label: "Ready" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
];

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

function stepsFor(order: Order) {
  const flow: OrderStatus[] =
    order.fulfillmentType === "DELIVERY"
      ? ["PLACED", "ACCEPTED", "PACKING", "READY", "OUT_FOR_DELIVERY"]
      : ["PLACED", "ACCEPTED", "PACKING", "READY", "COMPLETED"];
  const labels = order.fulfillmentType === "DELIVERY" ? ["Placed", "Accepted", "Packing", "Ready", "Out"] : ["Placed", "Accepted", "Packing", "Ready", "Done"];
  const currentIndex = flow.indexOf(order.status);
  return flow.map((status, i) => ({ label: labels[i]!, done: i < currentIndex, active: i === currentIndex }));
}

// The next merchant-initiated status for each stage — READY branches by fulfillment type
// since pickup orders have no delivery partner in the loop (Commerce API Design §4.7):
// the merchant marks them COMPLETED directly instead of handing off to OUT_FOR_DELIVERY.
function nextAction(order: Order): { label: string; status: OrderStatus } | null {
  switch (order.status) {
    case "ACCEPTED":
      return { label: "Start packing", status: "PACKING" };
    case "PACKING":
      return { label: "Mark ready", status: "READY" };
    case "READY":
      return order.fulfillmentType === "DELIVERY"
        ? { label: "Send for delivery", status: "OUT_FOR_DELIVERY" }
        : { label: "Mark complete", status: "COMPLETED" };
    default:
      return null;
  }
}

export default function OrdersPage() {
  const { id: businessId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["merchant", "orders", businessId],
    queryFn: () => apiFetch<Order[]>(`/merchant/businesses/${businessId}/orders`),
    refetchInterval: 15_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      apiFetch(`/merchant/businesses/${businessId}/orders/${orderId}/status`, {
        method: "PATCH",
        body: { status },
        idempotencyKey: crypto.randomUUID(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "orders", businessId] }),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {COLUMNS.map((col) => (
          <Skeleton key={col.status} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  const byStatus = (status: OrderStatus) => orders?.filter((o) => o.status === status) ?? [];

  return (
    <div className="grid grid-cols-5 gap-4">
      {COLUMNS.map((col) => (
        <div key={col.status} className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {col.label} ({byStatus(col.status).length})
          </h2>
          {byStatus(col.status).map((order) => {
            const action = nextAction(order);
            return (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{order.orderNumber}</span>
                    <span className="font-mono text-xs">{formatRupees(order.totalPaise)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-0">
                  <p className="text-xs text-muted-foreground">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </p>
                  <StatusStepper steps={stepsFor(order)} />
                  {order.status === "PLACED" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ orderId: order.id, status: "REJECTED" })}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ orderId: order.id, status: "ACCEPTED" })}
                      >
                        Accept
                      </Button>
                    </div>
                  ) : action ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ orderId: order.id, status: action.status })}
                    >
                      {action.label}
                    </Button>
                  ) : (
                    <Badge variant="secondary">Awaiting delivery partner</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
