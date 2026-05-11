import { db } from "@/app/lib/prisma";
import { Prisma, type PurchaseOrderStatus } from "@/generated/prisma/client";
import type { UserRole } from "@/generated/prisma/enums";
import DbErrorBanner from "@/app/ui/admin/DbErrorBanner";
import {
  getStoreInsights,
  getAbandonedCartInsights,
  getProductInsights,
  getRevenueForecast,
} from "@/app/lib/gemini";

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  PENDING:   "Procesando",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
};

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN:  "Administradores",
  CLIENT: "Clientes",
  VENDOR: "Vendedores",
};

export default async function AnalyticsPage() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  type OrderGroup = { status: PurchaseOrderStatus; _count: { id: number } };
  type RoleCount = { role: UserRole; count: number };
  type TopProduct = { productName: string; _sum: { quantity: number | null; subtotal: Prisma.Decimal | null } };

  let ordersByStatus: OrderGroup[] = [];
  let usersByRole: RoleCount[] = [];
  let recentOrders = 0;
  let totalCarts = 0;
  let totalRevenue = 0;
  let abandonedCarts: { items: { priceAtTime: Prisma.Decimal; quantity: number; productName: string }[] }[] = [];
  let topProductRows: TopProduct[] = [];
  let recentPackages: { createdAt: Date; amount: Prisma.Decimal }[] = [];
  let dbError = false;

  try {
    const [og, ur, ro, tc, rev, ac, tp, rp] = await Promise.all([
      db.purchaseOrder.groupBy({ by: ["status"], _count: { id: true } }),
      Promise.all([
        db.user.count({ where: { roles: { has: "CLIENT" } } }),
        db.user.count({ where: { roles: { has: "VENDOR" } } }),
      ]),
      db.purchaseOrder.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      db.cart.count({ where: { status: "NOT_CHECKED_OUT" } }),
      db.package.aggregate({ _sum: { amount: true } }),
      db.cart.findMany({
        where: { status: "NOT_CHECKED_OUT", items: { some: {} } },
        include: { items: { select: { priceAtTime: true, quantity: true, productName: true } } },
      }),
      db.packageItem.groupBy({
        by: ["productName"],
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { subtotal: "desc" } },
        take: 10,
      }),
      db.package.findMany({
        where: { createdAt: { gte: eightWeeksAgo } },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    ordersByStatus = og;
    const [clientCount, vendorCount] = ur;
    usersByRole = [
      { role: "CLIENT" as UserRole, count: clientCount },
      { role: "VENDOR" as UserRole, count: vendorCount },
    ].filter((r) => r.count > 0);
    recentOrders = ro;
    totalCarts = tc;
    totalRevenue = Number(rev._sum.amount ?? 0);
    abandonedCarts = ac;
    topProductRows = tp;
    recentPackages = rp;
  } catch {
    dbError = true;
  }

  const totalOrders = ordersByStatus.reduce((sum, s) => sum + s._count.id, 0);
  const totalUsers = usersByRole.reduce((sum, r) => sum + r.count, 0);

  // Abandoned cart stats
  const totalLostRevenue = abandonedCarts.reduce(
    (sum, cart) => sum + cart.items.reduce((s, i) => s + Number(i.priceAtTime) * i.quantity, 0),
    0
  );
  const productCounts: Record<string, number> = {};
  for (const cart of abandonedCarts) {
    for (const item of cart.items) {
      productCounts[item.productName] = (productCounts[item.productName] ?? 0) + 1;
    }
  }
  const topAbandonedProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Top products
  const topProducts = topProductRows.map((p) => ({
    name: p.productName,
    unitsSold: Number(p._sum.quantity ?? 0),
    revenue: Number(p._sum.subtotal ?? 0),
  }));

  // Weekly revenue grouped in JS (avoids raw SQL)
  const weekMap: Record<string, number> = {};
  for (const p of recentPackages) {
    const d = new Date(p.createdAt);
    // Snap to Monday of that week
    const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon … 6=Sun
    d.setDate(d.getDate() - dayOfWeek);
    d.setHours(0, 0, 0, 0);
    const key = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    weekMap[key] = (weekMap[key] ?? 0) + Number(p.amount);
  }
  const weeklyRevenue = Object.entries(weekMap)
    .reverse()
    .map(([week, amount]) => ({ week, amount }));

  // All Gemini calls in parallel — failures are silently ignored
  const [insightsResult, abandonedResult, productsResult, trendResult] = await Promise.allSettled([
    getStoreInsights({
      totalRevenue,
      totalPurchases: totalOrders,
      recentPurchases: recentOrders,
      activeCarts: totalCarts,
      totalUsers,
      purchasesByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count.id })),
    }),
    getAbandonedCartInsights({
      cartCount: abandonedCarts.length,
      totalLostRevenue,
      topProducts: topAbandonedProducts,
    }),
    getProductInsights({ topProducts }),
    getRevenueForecast({ weeklyRevenue }),
  ]);

  const aiInsights  = insightsResult.status  === "fulfilled" ? insightsResult.value  : null;
  const aiAbandoned = abandonedResult.status === "fulfilled" ? abandonedResult.value : null;
  const aiProducts  = productsResult.status  === "fulfilled" ? productsResult.value  : null;
  const aiTrend     = trendResult.status     === "fulfilled" ? trendResult.value     : null;

  return (
    <div className="px-10 py-10">
      {dbError && <DbErrorBanner />}
      <div className="mb-10">
        <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">MÉTRICAS</p>
        <h1 className="font-serif text-5xl text-brown">Estadísticas</h1>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard
          label="INGRESOS TOTALES"
          value={`$${totalRevenue.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
          sub="Suma de todos los paquetes"
        />
        <StatCard
          label="PEDIDOS TOTALES"
          value={totalOrders.toLocaleString()}
          sub={`${recentOrders} nuevos esta semana`}
        />
        <StatCard
          label="CARRITOS ACTIVOS"
          value={totalCarts.toLocaleString()}
          sub="Sin finalizar el checkout"
        />
        <StatCard
          label="USUARIOS TOTALES"
          value={totalUsers.toLocaleString()}
          sub="Registrados en la plataforma"
        />
      </div>

      {/* General AI insights — always hidden if Gemini fails */}
      {aiInsights && (
        <GeminiCard title="Insights del negocio" label="INTELIGENCIA ARTIFICIAL">
          <GeminiText text={aiInsights} />
        </GeminiCard>
      )}

      {/* Abandoned carts — shown whenever there are carts, Gemini text is optional */}
      {abandonedCarts.length > 0 && (
        <GeminiCard title="Carritos Abandonados" label="RECUPERACIÓN">
          <p className="text-xs tracking-[0.12em] text-muted-foreground mb-6">
            {abandonedCarts.length} carrito{abandonedCarts.length !== 1 ? "s" : ""} con productos sin comprar
            {" · "}
            <span className="text-brown font-medium">
              ${totalLostRevenue.toLocaleString("es-AR", { minimumFractionDigits: 0 })} ARS en riesgo
            </span>
          </p>
          {aiAbandoned && <GeminiText text={aiAbandoned} />}
        </GeminiCard>
      )}

      {/* Top products — shown whenever there are products sold */}
      {topProducts.length > 0 && (
        <GeminiCard title="Top Productos" label="RENDIMIENTO">
          <div className="mb-6 space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-baseline justify-between text-xs border-b border-tan/40 pb-1.5">
                <span className="text-muted-foreground">
                  <span className="text-brown mr-2">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="text-brown ml-4 whitespace-nowrap">
                  {p.unitsSold} uds · ${p.revenue.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
          {aiProducts && <GeminiText text={aiProducts} />}
        </GeminiCard>
      )}

      {/* Revenue trend — shown whenever there are packages */}
      {weeklyRevenue.length > 0 && (
        <GeminiCard title="Tendencia de Ingresos" label="PROYECCIÓN">
          <div className="mb-6 space-y-1.5">
            {weeklyRevenue.map((w) => {
              const maxAmount = Math.max(...weeklyRevenue.map((x) => x.amount), 1);
              const pct = Math.round((w.amount / maxAmount) * 100);
              return (
                <div key={w.week} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-muted-foreground shrink-0">{w.week}</span>
                  <div className="flex-1 h-1.5 bg-tan rounded-full overflow-hidden">
                    <div className="h-full bg-olive rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-28 text-right text-brown shrink-0">
                    ${w.amount.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  </span>
                </div>
              );
            })}
          </div>
          {aiTrend && <GeminiText text={aiTrend} />}
        </GeminiCard>
      )}

      <div className="grid grid-cols-2 gap-10 mt-12">
        {/* Orders by status */}
        <div>
          <h2 className="font-serif text-3xl text-brown mb-6">Pedidos por estado</h2>
          <div className="space-y-3">
            {ordersByStatus.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">Sin datos todavía.</p>
            ) : (
              ordersByStatus.map((s) => {
                const pct = totalOrders > 0 ? Math.round((s._count.id / totalOrders) * 100) : 0;
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span className="tracking-[0.12em]">{STATUS_LABEL[s.status]}</span>
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
                      {ROLE_LABEL[r.role]}
                    </span>
                    <span className="font-serif text-2xl text-brown">{r.count}</span>
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

function GeminiCard({ title, label, children }: { title: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-10 border border-tan p-8">
      <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">{label}</p>
      <h2 className="font-serif text-3xl text-brown mb-6">{title}</h2>
      {children}
    </div>
  );
}

function GeminiText({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      {text.split("\n").filter((line) => line.trim()).map((line, i) => (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
      ))}
    </div>
  );
}
