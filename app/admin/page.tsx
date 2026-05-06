import { db } from "@/lib/prisma";
import type { PurchaseStatus } from "@/generated/prisma/client";

const STATUS_LABEL: Record<PurchaseStatus, string> = {
  PENDING:   "PROCESANDO",
  PAID:      "PAGADO",
  SHIPPED:   "ENVIADO",
  DELIVERED: "ENTREGADO",
  CANCELLED: "CANCELADO",
  DISPUTED:  "EN DISPUTA",
};

const STATUS_COLOR: Record<PurchaseStatus, string> = {
  PENDING:   "text-terracotta",
  PAID:      "text-olive",
  SHIPPED:   "text-muted-foreground",
  DELIVERED: "text-olive",
  CANCELLED: "text-muted-foreground",
  DISPUTED:  "text-terracotta",
};

function formatOrderId(id: string) {
  return `#INF-${id.slice(-4).toUpperCase()}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPage() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setTime(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [statusCounts, purchases, totalUsers, newUsersThisWeek] = await Promise.all([
    db.purchase.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    db.purchase.findMany({
      include: {
        user: { select: { name: true, lastName: true } },
        purchaseOrder: {
          include: {
            cart: {
              include: {
                items: { select: { productName: true, quantity: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
  ]);

  const totalRevenue = statusCounts
    .filter((s) => ["PAID", "SHIPPED", "DELIVERED"].includes(s.status))
    .reduce((sum, s) => sum + Number(s._sum.totalAmount ?? 0), 0);

  const activeOrders = statusCounts
    .filter((s) => ["PENDING", "PAID", "SHIPPED"].includes(s.status))
    .reduce((sum, s) => sum + s._count.id, 0);

  const pendingOrders = statusCounts
    .find((s) => s.status === "PENDING")?._count.id ?? 0;

  const revenueFormatted = totalRevenue.toLocaleString("en-US", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });

  return (
    <div className="px-10 py-10">

      {/* Page header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">PANORAMA OPERATIVO</p>
          <h1 className="font-serif text-5xl text-brown">Consola de Administración</h1>
        </div>
        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2 bg-tan/50 border border-tan rounded-full px-4 py-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <circle cx="7" cy="7" r="5" />
              <line x1="11" y1="11" x2="15" y2="15" />
            </svg>
            <input
              type="text"
              placeholder="Buscar órdenes, vendedores..."
              className="bg-transparent text-xs text-brown placeholder:text-muted-foreground outline-none w-52"
            />
          </div>
          <button className="text-xs tracking-[0.15em] text-brown hover:text-terracotta transition-colors">
            EXPORTAR DATOS
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard
          label="TOTAL REVENUE"
          value={revenueFormatted}
          sub="Pedidos pagados y enviados"
        />
        <StatCard
          label="PEDIDOS ACTIVOS"
          value={activeOrders.toLocaleString()}
          sub={`${pendingOrders} pendientes de proceso`}
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

      {/* Recent purchases */}
      <div className="mb-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-serif text-3xl text-brown">Compras Recientes</h2>
          <button className="text-xs tracking-[0.15em] text-muted-foreground hover:text-brown transition-colors">
            VER REGISTRO COMPLETO
          </button>
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
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center font-serif text-xl text-muted-foreground">
                  No hay compras registradas todavía.
                </td>
              </tr>
            ) : (
              purchases.map((p) => {
                const items = p.purchaseOrder?.cart?.items ?? [];
                const itemsLabel = items.length > 0
                  ? items.map((i) => `${i.productName} (${i.quantity})`).join(", ")
                  : "—";
                const total = p.totalAmount
                  ? `$${Number(p.totalAmount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                  : "—";

                return (
                  <tr key={p.id} className="border-b border-tan/60">
                    <td className="py-4 text-sm text-brown">{formatOrderId(p.id)}</td>
                    <td className="py-4 text-sm text-brown">
                      {p.user.name} {p.user.lastName}
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{formatDate(p.createdAt)}</td>
                    <td className="py-4 text-sm text-muted-foreground max-w-xs truncate">{itemsLabel}</td>
                    <td className="py-4 text-sm font-medium text-brown">{total}</td>
                    <td className={`py-4 text-xs tracking-[0.12em] ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom two-col section */}
      <div className="grid grid-cols-2 gap-12">
        {/* Verified vendors placeholder */}
        <div>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-serif text-3xl text-brown">Vendedores Verificados</h2>
            <button className="text-xs tracking-[0.15em] text-muted-foreground hover:text-brown transition-colors">
              ADMINISTRAR
            </button>
          </div>
          <p className="text-sm italic text-muted-foreground">
            La gestión de vendedores se administra desde el Seller App.
          </p>
        </div>

        {/* New registered users placeholder */}
        <div>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-serif text-3xl text-brown">Nuevos Usuarios</h2>
            <button className="text-xs tracking-[0.15em] text-muted-foreground hover:text-brown transition-colors">
              DIRECTORIO
            </button>
          </div>
          <p className="text-sm italic text-muted-foreground">
            {newUsersThisWeek > 0
              ? `${newUsersThisWeek} usuario${newUsersThisWeek !== 1 ? "s" : ""} registrado${newUsersThisWeek !== 1 ? "s" : ""} esta semana.`
              : "Ningún usuario nuevo esta semana."}
          </p>
        </div>
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
