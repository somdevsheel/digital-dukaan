// Reference data required before the app is usable — see DATABASE_DESIGN.md §7.
// Idempotent (upsert-based): safe to run repeatedly, including once against production
// on first deploy. Deliberately does NOT create any user/admin account — seeding a
// known-credential account into a script that also runs in production is a real
// vulnerability. Bootstrapping the first Super Admin is a separate, documented,
// one-off operational step (promote an existing OTP-registered user's UserRole).

import { PrismaClient, CommerceModel, RoleScope, NotificationChannel } from "@prisma/client";

const prisma = new PrismaClient();

const BUSINESS_TYPES: Array<{ name: string; commerceModel: CommerceModel; sortOrder: number }> = [
  // Model A — product commerce (PRD §6)
  { name: "Grocery Shops", commerceModel: CommerceModel.PRODUCT, sortOrder: 1 },
  { name: "Vegetable Shops", commerceModel: CommerceModel.PRODUCT, sortOrder: 2 },
  { name: "Medical Stores", commerceModel: CommerceModel.PRODUCT, sortOrder: 3 },
  { name: "Bakeries", commerceModel: CommerceModel.PRODUCT, sortOrder: 4 },
  { name: "Restaurants", commerceModel: CommerceModel.PRODUCT, sortOrder: 5 },
  { name: "Computer Stores", commerceModel: CommerceModel.PRODUCT, sortOrder: 6 },
  { name: "Electronics Stores", commerceModel: CommerceModel.PRODUCT, sortOrder: 7 },
  { name: "Mobile Shops", commerceModel: CommerceModel.PRODUCT, sortOrder: 8 },
  { name: "Stationery Stores", commerceModel: CommerceModel.PRODUCT, sortOrder: 9 },
  { name: "Hardware Shops", commerceModel: CommerceModel.PRODUCT, sortOrder: 10 },
  { name: "Clothing Shops", commerceModel: CommerceModel.PRODUCT, sortOrder: 11 },
  { name: "Furniture Stores", commerceModel: CommerceModel.PRODUCT, sortOrder: 12 },
  // Model B — appointment/service commerce (PRD §6, ServiceRequest-only at MVP)
  { name: "Salons", commerceModel: CommerceModel.SERVICE, sortOrder: 13 },
  { name: "Clinics", commerceModel: CommerceModel.SERVICE, sortOrder: 14 },
  { name: "Coaching Centers", commerceModel: CommerceModel.SERVICE, sortOrder: 15 },
  { name: "Repair Centers", commerceModel: CommerceModel.SERVICE, sortOrder: 16 },
  { name: "Service Providers", commerceModel: CommerceModel.SERVICE, sortOrder: 17 },
  { name: "Consultants", commerceModel: CommerceModel.SERVICE, sortOrder: 18 },
  { name: "CA Offices", commerceModel: CommerceModel.SERVICE, sortOrder: 19 },
  { name: "Lawyers", commerceModel: CommerceModel.SERVICE, sortOrder: 20 },
  { name: "Agencies", commerceModel: CommerceModel.SERVICE, sortOrder: 21 },
  { name: "Freelancers", commerceModel: CommerceModel.SERVICE, sortOrder: 22 },
  { name: "Offices", commerceModel: CommerceModel.SERVICE, sortOrder: 23 },
];

const PERMISSIONS: Array<{ key: string; description: string }> = [
  { key: "business.verify", description: "Approve or reject business verification submissions" },
  { key: "business.manage", description: "Edit a business's own profile, hours, delivery settings" },
  { key: "product.manage", description: "Create/edit/delete a business's catalog" },
  { key: "order.manage", description: "View and manage a business's orders" },
  { key: "order.accept", description: "Accept/reject/transition order status" },
  { key: "coupon.manage", description: "Create/edit a business's coupons" },
  { key: "staff.manage", description: "Invite/remove business staff and assign roles" },
  { key: "analytics.view", description: "View sales/revenue analytics" },
  { key: "dispute.manage", description: "Investigate and resolve disputes" },
  { key: "support.manage", description: "Work the support ticket queue" },
  { key: "payout.manage", description: "Trigger/review merchant payout batches" },
  { key: "audit.view", description: "Read the audit log" },
  { key: "role.manage", description: "Manage roles and permissions (super admin only)" },
  { key: "taxonomy.manage", description: "Manage business types and cities" },
];

const ROLES: Array<{ name: string; scope: RoleScope; description: string; permissions: string[] }> = [
  {
    name: "SUPER_ADMIN",
    scope: RoleScope.PLATFORM,
    description: "Unrestricted platform access",
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    name: "OPS_VERIFIER",
    scope: RoleScope.PLATFORM,
    description: "Business/delivery-partner verification queue",
    permissions: ["business.verify", "audit.view"],
  },
  {
    name: "FINANCE",
    scope: RoleScope.PLATFORM,
    description: "Payout and revenue oversight",
    permissions: ["payout.manage", "analytics.view", "audit.view"],
  },
  {
    name: "SUPPORT",
    scope: RoleScope.PLATFORM,
    description: "Support ticket and dispute handling",
    permissions: ["support.manage", "dispute.manage", "audit.view"],
  },
  {
    name: "BUSINESS_OWNER",
    scope: RoleScope.BUSINESS,
    description: "Full control of a single business",
    permissions: [
      "business.manage",
      "product.manage",
      "order.manage",
      "order.accept",
      "coupon.manage",
      "staff.manage",
      "analytics.view",
    ],
  },
  {
    name: "BUSINESS_STAFF",
    scope: RoleScope.BUSINESS,
    description: "Day-to-day order/catalog operations, no bank/staff/settings access",
    permissions: ["product.manage", "order.manage", "order.accept"],
  },
];

// One row per (templateKey), each designed for exactly one channel — matches how
// NotificationListener (apps/api) always dispatches a given key on the same channel,
// and how the worker's NotificationsProcessor looks templates up (key + channel + locale).
const NOTIFICATION_TEMPLATES: Array<{ key: string; channel: NotificationChannel; subject?: string; bodyTemplate: string }> = [
  { key: "order.new_for_merchant", channel: NotificationChannel.PUSH, bodyTemplate: "New order received — tap to view and accept." },
  { key: "order.placed_confirmation", channel: NotificationChannel.IN_APP, bodyTemplate: "Your order has been placed." },
  { key: "order.status_changed", channel: NotificationChannel.PUSH, bodyTemplate: "Your order status changed to {{status}}." },
  { key: "business.verified", channel: NotificationChannel.PUSH, bodyTemplate: "Your business has been verified and is now live!" },
  { key: "business.rejected", channel: NotificationChannel.PUSH, bodyTemplate: "Your business verification was rejected: {{reason}}" },
  { key: "service_request.new", channel: NotificationChannel.PUSH, bodyTemplate: "New service request received — tap to respond." },
];

// Placeholder launch city — PRD confirmed "single city at MVP" but deferred which one
// to go-to-market planning. Update before first production seed run.
const LAUNCH_CITY = { name: "Mumbai", state: "Maharashtra" };

async function main() {
  console.log("Seeding business types...");
  for (const bt of BUSINESS_TYPES) {
    await prisma.businessType.upsert({
      where: { name: bt.name },
      update: { commerceModel: bt.commerceModel, sortOrder: bt.sortOrder },
      create: bt,
    });
  }

  console.log("Seeding permissions...");
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: perm,
    });
  }

  console.log("Seeding roles + role-permission grants...");
  for (const role of ROLES) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description, scope: role.scope },
      create: { name: role.name, description: role.description, scope: role.scope },
    });

    const permissionRows = await prisma.permission.findMany({
      where: { key: { in: role.permissions } },
    });

    for (const permission of permissionRows) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: created.id, permissionId: permission.id } },
        update: {},
        create: { roleId: created.id, permissionId: permission.id },
      });
    }
  }

  console.log(`Seeding launch city (${LAUNCH_CITY.name})...`);
  await prisma.city.upsert({
    where: { name_state: { name: LAUNCH_CITY.name, state: LAUNCH_CITY.state } },
    update: {},
    create: { ...LAUNCH_CITY, isActive: true, launchedAt: new Date() },
  });

  console.log("Seeding notification templates...");
  for (const template of NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { key: template.key },
      update: {
        channel: template.channel,
        ...(template.subject !== undefined ? { subject: template.subject } : {}),
        bodyTemplate: template.bodyTemplate,
      },
      create: template,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
