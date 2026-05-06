import { db } from "@/lib/prisma";
import type { PurchaseStatus } from "@/generated/prisma/client";
import type { UserRole } from "@/generated/prisma/enums";

const STATUS_LABEL: Record<PurchaseStatus, string> = {
  PENDING:   "Procesando",
  PAID:      "Pagado",
  SHIPPED:   "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  DISPUTED:  "En disputa",
};

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN:  "Administradores",
  CLIENT: "Clientes",
  VENDOR: "Vendedores",
};

export default async function AnalyticsPage() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [purchasesByStatus, usersByRole, recentPurchases, totalCarts] = await Promise.all([
    db.purchase.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    db.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    db.purchase.count({ where: { createdAt: { gte: oneMonthAgo } } }),
    db.cart.count({ where: { status: "NOT_CHECKED_OUT" } }),
  ]);

  const totalRevenue = purchasesByStatus
    .filter((s) => ["PAID", "SHIPPED", "DELIVERED"].includes(s.status))
    .reduce((sum, s) => sum + Number(s._sum.totalAmount ?? 0), 0);

  const totalPurchases = purchasesByStatus.reduce((sum, s) => sum + s._count.id, 0);

  return (
    <div className="px-10 py-10">
      <div className="mb-10">
        <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">MÉTRICAS</p>
        <h1 className="font-serif text-5xl text-brown">Estadísticas</h1>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard
          label="INGRESOS TOTALES"
          value={`$${totalRevenue.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
          sub="Pedidos pagados + enviados + entregados"
        />
        <StatCard
          label="COMPRAS TOTALES"
          value={totalPurchases.toLocaleString()}
          sub={`${recentPurchases} en los últimos 30 días`}
        />
        <StatCard
          label="CARRITOS ACTIVOS"
          value={totalCarts.toLocaleString()}
          sub="Sin finalizar el checkout"
        />
        <StatCard
          label="USUARIOS TOTALES"
          value={usersByRole.reduce((sum, r) => sum + r._count.id, 0).toLocaleString()}
          sub="Registrados en la plataforma"
        />
      </div>

      <div className="grid grid-cols-2 gap-10">
        {/* Purchases by status */}
        <div>
          <h2 className="font-serif text-3xl text-brown mb-6">Compras por estado</h2>
          <div className="space-y-3">
            {purchasesByStatus.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">Sin datos todavía.</p>
            ) : (
              purchasesByStatus.map((s) => {
                const pct = totalPurchases > 0 ? Math.round((s._count.id / totalPurchases) * 100) : 0;
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span className="tracking-[0.12em]">{STATUS_LABEL[s.status as PurchaseStatus] ?? s.status}</span>
                      <span>{s._count.id} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-tan rounded-full overflow-hidden">
                      <div className="h-full bg-olive rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Users by role */}
        <div>
          <h2 className="font-serif text-3xl text-brown mb-6">Usuarios por rol</h2>
          <div className="space-y-4">
            {usersByRole.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">Sin datos todavía.</p>
            ) : (
              usersByRole.map((r) => (
                <div key={r.role} className="flex items-center justify-between border-b border-tan/60 pb-4">
                  <span className="text-xs tracking-[0.12em] text-muted-foreground">
                    {ROLE_LABEL[r.role as UserRole] ?? r.role}
                  </span>
                  <span className="font-serif text-2xl text-brown">{r._count.id}</span>
                </div>
              ))
            )}
          </div>
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
