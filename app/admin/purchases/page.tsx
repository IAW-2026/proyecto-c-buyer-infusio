import { db } from "@/app/lib/prisma";
import { type PurchaseOrderStatus } from "@/generated/prisma/client";
import Link from "next/link";
import DbErrorBanner from "@/app/ui/admin/DbErrorBanner";
import PurchasesTable, { type AdminOrderRow } from "@/app/ui/admin/PurchasesTable";
import { getShipmentTracking, type ShipmentStatusValue } from "@/app/lib/services/externalApis";

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  PENDING:           "PROCESANDO",
  AWAITING_PAYMENT:  "PENDIENTE",
  CONFIRMED:         "CONFIRMADO",
  CANCELLED:         "CANCELADO",
};

const ALL_STATUSES: PurchaseOrderStatus[] = ["PENDING", "AWAITING_PAYMENT", "CONFIRMED", "CANCELLED"];

function formatId(id: string) {
  return `#INF-${id.slice(-4).toUpperCase()}`;
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = ALL_STATUSES.includes(status as PurchaseOrderStatus)
    ? (status as PurchaseOrderStatus)
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

  try {
    const [orders, statusGroups] = await Promise.all([
      db.purchaseOrder.findMany({
        where: activeStatus ? { status: activeStatus } : undefined,
        include: {
          user: { select: { name: true, lastName: true, email: true } },
          cart: { include: { items: { select: { productName: true, quantity: true, priceAtTime: true } } } },
          packages: { select: { amount: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.purchaseOrder.groupBy({ by: ["status"], _count: { id: true } }),
    ]);
    rawOrders = orders;
    countByStatus = Object.fromEntries(statusGroups.map((s) => [s.status, s._count.id]));
  } catch {
    dbError = true;
  }

  const totalCount = Object.values(countByStatus).reduce((s, n) => s + (n ?? 0), 0);

  // Fetch shipping statuses in parallel for orders that have a shippingId
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

  // Serialize Prisma Decimals and Dates before passing to the client component
  const orders: AdminOrderRow[] = rawOrders.map((o) => ({
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
            !activeStatus
              ? "border-brown text-brown"
              : "border-tan text-muted-foreground hover:border-brown hover:text-brown"
          }`}
        >
          TODOS ({totalCount})
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/purchases?status=${s}`}
            className={`px-4 py-1.5 text-xs tracking-[0.12em] border transition-colors ${
              activeStatus === s
                ? "border-brown text-brown"
                : "border-tan text-muted-foreground hover:border-brown hover:text-brown"
            }`}
          >
            {STATUS_LABEL[s]} ({countByStatus[s] ?? 0})
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
