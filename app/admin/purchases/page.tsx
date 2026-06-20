import { db } from "@/app/lib/prisma";
import { type PurchaseOrderStatus } from "@/generated/prisma/client";
import Link from "next/link";
import DbErrorBanner from "@/app/ui/admin/DbErrorBanner";
import PurchasesTable, { type AdminOrderRow } from "@/app/ui/admin/PurchasesTable";
import { getShipmentTracking, type ShipmentStatusValue } from "@/app/lib/services/externalApis";

type FilterValue = PurchaseOrderStatus | "FINALIZADO";

const DB_STATUSES: PurchaseOrderStatus[] = ["PENDING", "AWAITING_PAYMENT", "CONFIRMED", "CANCELLED"];

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "PENDING",           label: "PROCESANDO" },
  { value: "AWAITING_PAYMENT",  label: "PENDIENTE" },
  { value: "CONFIRMED",         label: "CONFIRMADO" },
  { value: "FINALIZADO",        label: "FINALIZADO" },
  { value: "CANCELLED",         label: "CANCELADO" },
];

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const activeFilter: FilterValue | null =
    [...DB_STATUSES, "FINALIZADO" as FilterValue].includes(status as FilterValue)
      ? (status as FilterValue)
      : null;

  type RawOrder = {
    id: string;
    status: PurchaseOrderStatus;
    shippingId: string | null;
    createdAt: Date;
    user: { name: string; lastName: string; email: string };
    cart: { items: { productName: string; quantity: number; priceAtTime: import("@/generated/prisma/client").Prisma.Decimal }[] };
    packages: { amount: import("@/generated/prisma/client").Prisma.Decimal }[];
  };

  let rawOrders: RawOrder[] = [];
  let countByStatus: Partial<Record<PurchaseOrderStatus, number>> = {};
  let dbError = false;

  const include = {
    user: { select: { name: true, lastName: true, email: true } },
    cart: { include: { items: { select: { productName: true, quantity: true, priceAtTime: true } } } },
    packages: { select: { amount: true } },
  } as const;

  try {
    const [statusGroups] = await Promise.all([
      db.purchaseOrder.groupBy({ by: ["status"], _count: { id: true } }),
    ]);
    countByStatus = Object.fromEntries(statusGroups.map((s) => [s.status, s._count.id]));

    if (activeFilter === "FINALIZADO") {
      // Fetch all CONFIRMED orders that have a shippingId — candidates for FINALIZADO
      rawOrders = await db.purchaseOrder.findMany({
        where: { status: "CONFIRMED", shippingId: { not: null } },
        include,
        orderBy: { createdAt: "desc" },
      });
    } else {
      rawOrders = await db.purchaseOrder.findMany({
        where: activeFilter ? { status: activeFilter } : undefined,
        include,
        orderBy: { createdAt: "desc" },
      });
    }
  } catch {
    dbError = true;
  }

  // Fetch shipment tracking in parallel for orders that have a shippingId
  const trackingMap: Record<string, ShipmentStatusValue | null> = {};
  await Promise.all(
    rawOrders
      .filter((o) => o.shippingId)
      .map(async (o) => {
        try {
          const t = await getShipmentTracking(o.shippingId!);
          trackingMap[o.id] = t.status;
        } catch {
          trackingMap[o.id] = null;
        }
      })
  );

  // When filtering by FINALIZADO keep only orders whose shipment was delivered
  const filteredOrders =
    activeFilter === "FINALIZADO"
      ? rawOrders.filter((o) => trackingMap[o.id] === "DELIVERED")
      : rawOrders;

  const totalCount = Object.values(countByStatus).reduce((s, n) => s + (n ?? 0), 0);

  // Compute FINALIZADO count
  let finalizedCount: number;
  if (activeFilter === "FINALIZADO") {
    // Already know it from the filter result
    finalizedCount = filteredOrders.length;
  } else if (activeFilter === null) {
    // TODOS: we fetched all orders and their tracking
    finalizedCount = rawOrders.filter(
      (o) => o.status === "CONFIRMED" && trackingMap[o.id] === "DELIVERED"
    ).length;
  } else {
    // Another status filter: fetch CONFIRMED+shippingId orders separately
    try {
      const candidates = await db.purchaseOrder.findMany({
        where: { status: "CONFIRMED", shippingId: { not: null } },
        select: { id: true, shippingId: true },
      });
      const statuses = await Promise.all(
        candidates.map(async (o) => {
          try {
            const t = await getShipmentTracking(o.shippingId!);
            return t.status;
          } catch { return null; }
        })
      );
      finalizedCount = statuses.filter((s) => s === "DELIVERED").length;
    } catch {
      finalizedCount = 0;
    }
  }

  const orders: AdminOrderRow[] = filteredOrders.map((o) => ({
    id: o.id,
    status: o.status,
    shippingId: o.shippingId,
    shipStatus: o.shippingId ? (trackingMap[o.id] ?? null) : null,
    createdAt: o.createdAt.toISOString(),
    userName: `${o.user.name} ${o.user.lastName}`,
    userEmail: o.user.email,
    items: o.cart.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime.toNumber(),
    })),
    total: o.packages.reduce((s, p) => s + p.amount.toNumber(), 0),
  }));

  return (
    <div className="px-10 py-10">
      {dbError && <DbErrorBanner />}
      <div className="mb-10">
        <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">GESTIÓN</p>
        <h1 className="font-serif text-5xl text-brown">Compras</h1>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/admin/purchases"
          className={`px-4 py-1.5 text-xs tracking-[0.12em] border transition-colors ${
            !activeFilter
              ? "border-brown text-brown"
              : "border-tan text-muted-foreground hover:border-brown hover:text-brown"
          }`}
        >
          TODOS ({totalCount})
        </Link>
        {FILTERS.map(({ value, label }) => (
          <Link
            key={value}
            href={`/admin/purchases?status=${value}`}
            className={`px-4 py-1.5 text-xs tracking-[0.12em] border transition-colors ${
              activeFilter === value
                ? "border-brown text-brown"
                : "border-tan text-muted-foreground hover:border-brown hover:text-brown"
            }`}
          >
            {label} ({value === "FINALIZADO" ? finalizedCount : (countByStatus[value as PurchaseOrderStatus] ?? 0)})
          </Link>
        ))}
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-tan">
            {["ORDER ID", "CLIENTE", "FECHA", "PRODUCTOS", "TOTAL", "ESTADO", "ESTADO ENVÍO"].map((h) => (
              <th key={h} className="pb-3 text-left text-xs tracking-[0.15em] text-terracotta font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <PurchasesTable orders={orders} />
        </tbody>
      </table>
    </div>
  );
}
