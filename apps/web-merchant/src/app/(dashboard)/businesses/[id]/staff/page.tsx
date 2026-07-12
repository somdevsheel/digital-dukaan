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

interface StaffMember {
  userRoleId: string;
  userFullName: string | null;
  userEmail: string | null;
  roleName: string;
}

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["BUSINESS_OWNER", "BUSINESS_STAFF"]),
});
type InviteForm = z.infer<typeof inviteSchema>;

export default function StaffPage() {
  const { id: businessId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["merchant", "staff", businessId],
    queryFn: () => apiFetch<StaffMember[]>(`/merchant/businesses/${businessId}/staff`),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({ resolver: zodResolver(inviteSchema), defaultValues: { role: "BUSINESS_STAFF" } });

  const invite = useMutation({
    mutationFn: (values: InviteForm) =>
      apiFetch(`/merchant/businesses/${businessId}/staff/invite`, { method: "POST", body: values }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["merchant", "staff", businessId] });
      reset({ email: "", role: "BUSINESS_STAFF" });
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    },
  });

  const remove = useMutation({
    mutationFn: (userRoleId: string) => apiFetch(`/merchant/businesses/${businessId}/staff/${userRoleId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "staff", businessId] }),
  });

  const onSubmit = (values: InviteForm) => {
    setFormError(null);
    invite.mutate(values);
  };

  return (
    <div className="flex flex-col gap-6">
      <form className="flex items-end gap-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="staff-email">Invite by email</Label>
          <Input id="staff-email" placeholder="teammate@example.com" className="w-64" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="staff-role">Role</Label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="staff-role" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUSINESS_STAFF">Staff</SelectItem>
                  <SelectItem value="BUSINESS_OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting || invite.isPending}>
          {invite.isPending ? "Inviting…" : "Invite"}
        </Button>
      </form>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <p className="text-xs text-muted-foreground">
        The invitee must already have a platform account under this email — they register or sign in first, then you invite them here.
      </p>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !staff || staff.length === 0 ? (
        <p className="text-sm text-muted-foreground">No staff yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.userRoleId}>
                <TableCell className="font-medium">{member.userFullName ?? "—"}</TableCell>
                <TableCell>{member.userEmail ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={member.roleName === "BUSINESS_OWNER" ? "default" : "secondary"}>
                    {member.roleName === "BUSINESS_OWNER" ? "Owner" : "Staff"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(member.userRoleId)}
                  >
                    Remove
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
