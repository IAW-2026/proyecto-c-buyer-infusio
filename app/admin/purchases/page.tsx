import { db } from "@/lib/prisma";
import type { PurchaseStatus } from "@/generated/prisma/client";
import Link from "next/link";

const STATUS_LABEL: Record<PurchaseStatus, string> = {
  PENDING:   "PROCESANDO",
  PAID:      "PAGADO",
  SHIPPED:   "ENVIADO",
  DELIVERED: "ENTREGADO",
  CANCELLED: "CANCELADO",
  DISPUTED:  "EN DISPUTA",
};

const STATUS_COLOR: Record<PurchaseStatus, string> = {
  PENDING:   "text-terracotta bg-terracotta/10",
  PAID:      "text-olive bg-olive/10",
  SHIPPED:   "text-muted-foreground bg-tan/50",
  DELIVERED: "text-olive bg-olive/10",
  CANCELLED: "text-muted-foreground bg-tan/50",
  DISPUTED:  "text-terracotta bg-terracotta/10",
};

const ALL_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "DISPUTED"] as const;

function formatDate(date: Date) {
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

function formatId(id: string) {
  return `#INF-${id.slice(-4).toUpperCase()}`;
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = ALL_STATUSES.includes(status as PurchaseStatus) ? (status as PurchaseStatus) : null;

  const purchases = await db.purchase.findMany({
    where: activeStatus ? { status: activeStatus } : undefined,
    include: {
      user: { select: { name: true, lastName: true, email: true } },
      purchaseOrder: {
        include: {
          cart: {
            include: { items: { select: { productName: true, quantity: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-10 py-10">
      <div className="mb-10">
        <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">GESTIÓN</p>
        <h1 className="font-serif text-5xl text-brown">Compras</h1>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/admin/purchases"
          className={`px-4 py-1.5 text-xs tracking-[0.12em] border transition-colors ${
            !activeStatus ? "border-brown text-brown" : "border-tan text-muted-foreground hover:border-brown hover:text-brown"
          }`}
        >
          TODOS ({purchases.length})
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/purchases?status=${s}`}
            className={`px-4 py-1.5 text-xs tracking-[0.12em] border transition-colors ${
              activeStatus === s ? "border-brown text-brown" : "border-tan text-muted-foreground hover:border-brown hover:text-brown"
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-tan">
            {["ORDER ID", "CLIENTE", "EMAIL", "FECHA", "PRODUCTOS", "TOTAL", "ESTADO"].map((h) => (
              <th key={h} className="pb-3 text-left text-xs tracking-[0.15em] text-terracotta font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {purchases.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-16 text-center font-serif text-xl text-muted-foreground">
                No hay compras para este filtro.
              </td>
            </tr>
          ) : (
            purchases.map((p) => {
              const items = p.purchaseOrder?.cart?.items ?? [];
              const itemsLabel = items.length > 0
                ? items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")
                : "—";
              const total = p.totalAmount
                ? `$${Number(p.totalAmount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                : "—";

              return (
                <tr key={p.id} className="border-b border-tan/60 hover:bg-tan/20 transition-colors">
                  <td className="py-4 text-sm text-brown">{formatId(p.id)}</td>
                  <td className="py-4 text-sm text-brown">{p.user.name} {p.user.lastName}</td>
                  <td className="py-4 text-xs text-muted-foreground">{p.user.email}</td>
                  <td className="py-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(p.createdAt)}</td>
                  <td className="py-4 text-xs text-muted-foreground max-w-xs truncate">{itemsLabel}</td>
                  <td className="py-4 text-sm font-medium text-brown">{total}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-xs tracking-[0.1em] ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
