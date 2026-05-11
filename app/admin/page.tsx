import { Suspense } from "react";
import { db } from "@/app/lib/prisma";
import { type PurchaseOrderStatus } from "@/generated/prisma/client";
import Link from "next/link";
import DbErrorBanner from "@/app/ui/admin/DbErrorBanner";
import ExportDropdown from "@/app/ui/admin/ExportDropdown";
import AdminSearch from "@/app/ui/admin/AdminSearch";

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  PENDING:   "PROCESANDO",
  CONFIRMED: "CONFIRMADO",
  CANCELLED: "CANCELADO",
};

const STATUS_CLS: Record<PurchaseOrderStatus, string> = {
  PENDING:   "bg-tan/60 text-brown",
  CONFIRMED: "bg-[#dce6d8] text-[#4e7048]",
  CANCELLED: "bg-[#eedede] text-[#904545]",
};

function formatOrderId(id: string) {
  return `#INF-${id.slice(-4).toUpperCase()}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const oneWeekAgo = new Date();
  oneWeekAgo.setTime(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);

  type StatusCount = { status: PurchaseOrderStatus; _count: { id: number } };
  type OrderRow = {
    id: string; status: PurchaseOrderStatus; createdAt: Date;
    user: { name: string; lastName: string };
    cart: { items: { productName: string; quantity: number }[] };
    packages: { amount: import("@/generated/prisma/client").Prisma.Decimal }[];
  };

  let statusCounts: StatusCount[] = [];
  let orders: OrderRow[] = [];
  let totalUsers = 0;
  let newUsersThisWeek = 0;
  let totalRevenue = 0;
  let dbError = false;

  try {
    const [sc, o, u, uw, rev] = await Promise.all([
      db.purchaseOrder.groupBy({ by: ["status"], _count: { id: true } }),
      db.purchaseOrder.findMany({
        where: query
          ? {
              OR: [
                // Strip the display prefix (#INF-) so users can paste the formatted ID
                { id: { contains: query.replace(/^#?inf-?/i, "").trim(), mode: "insensitive" } },
                { user: { name: { contains: query, mode: "insensitive" } } },
                { user: { lastName: { contains: query, mode: "insensitive" } } },
                { user: { email: { contains: query, mode: "insensitive" } } },
              ],
            }
          : { createdAt: { gte: oneWeekAgo } },
        include: {
          user: { select: { name: true, lastName: true } },
          cart: { include: { items: { select: { productName: true, quantity: true } } } },
          packages: { select: { amount: true } },
        },
        orderBy: { createdAt: "desc" },
        take: query ? 50 : undefined,
      }),
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      db.package.aggregate({ _sum: { amount: true } }),
    ]);
    statusCounts = sc;
    orders = o;
    totalUsers = u;
    newUsersThisWeek = uw;
    totalRevenue = Number(rev._sum.amount ?? 0);
  } catch {
    dbError = true;
  }

  const activeOrders = statusCounts
    .filter((s) => s.status === "PENDING")
    .reduce((sum, s) => sum + s._count.id, 0);

  const revenueFormatted = totalRevenue.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });

  return (
    <div className="px-10 py-10">

      {dbError && <DbErrorBanner />}

      {/* Page header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">PANORAMA OPERATIVO</p>
          <h1 className="font-serif text-5xl text-brown">Consola de Administración</h1>
        </div>
        <div className="flex items-center gap-6 pt-2">
          <Suspense>
            <AdminSearch />
          </Suspense>
          <ExportDropdown />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard
          label="INGRESOS TOTALES"
          value={revenueFormatted}
          sub="Suma de todos los paquetes"
        />
        <StatCard
          label="PEDIDOS ACTIVOS"
          value={activeOrders.toLocaleString()}
          sub="Pendientes de procesamiento"
        />
        <StatCard
          label="BASE DE CLIENTES"
          value={totalUsers.toLocaleString()}
          sub={`${newUsersThisWeek} nuevos esta semana`}
        />
        <StatCard
          label="ESTADO PLATAFORMA"
          value="Activo"
          sub="Todos los servicios operativos"
        />
      </div>

      {/* Recent orders */}
      <div className="mb-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-serif text-3xl text-brown">
            {query ? `Resultados para "${query}"` : "Pedidos — Última Semana"}
          </h2>
          <Link
            href="/admin/purchases"
            className="text-xs tracking-[0.15em] text-muted-foreground hover:text-brown transition-colors"
          >
            VER REGISTRO COMPLETO →
          </Link>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-tan">
              {["ORDER ID", "CLIENTE", "FECHA", "PRODUCTOS", "TOTAL", "ESTADO"].map((h) => (
                <th
                  key={h}
                  className="pb-3 text-left text-xs tracking-[0.15em] text-terracotta font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center font-serif text-xl text-muted-foreground">
                  No hay pedidos registrados todavía.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const items = o.cart.items;
                const itemsLabel = items.length > 0
                  ? items.map((i) => `${i.productName} (${i.quantity})`).join(", ")
                  : "—";
                const total = o.packages.length > 0
                  ? `$${o.packages.reduce((s, p) => s + Number(p.amount), 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                  : "—";

                return (
                  <tr key={o.id} className="border-b border-tan/60">
                    <td className="py-4 text-sm text-brown">{formatOrderId(o.id)}</td>
                    <td className="py-4 text-sm text-brown">{o.user.name} {o.user.lastName}</td>
                    <td className="py-4 text-sm text-muted-foreground">{formatDate(o.createdAt)}</td>
                    <td className="py-4 text-sm text-muted-foreground max-w-xs truncate">{itemsLabel}</td>
                    <td className="py-4 text-sm font-medium text-brown">{total}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs tracking-widest ${STATUS_CLS[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New registered users */}
      <div>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-serif text-3xl text-brown">Nuevos Usuarios</h2>
          <Link
            href="/admin/users"
            className="text-xs tracking-[0.15em] text-muted-foreground hover:text-brown transition-colors"
          >
            DIRECTORIO →
          </Link>
        </div>
        <p className="text-sm italic text-muted-foreground">
          {newUsersThisWeek > 0
            ? `${newUsersThisWeek} usuario${newUsersThisWeek !== 1 ? "s" : ""} registrado${newUsersThisWeek !== 1 ? "s" : ""} esta semana.`
            : "Ningún usuario nuevo esta semana."}
        </p>
      </div>

    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border border-tan p-6">
      <p className="text-xs tracking-[0.15em] text-muted-foreground mb-4">{label}</p>
      <p className="font-serif text-3xl text-brown mb-2">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
