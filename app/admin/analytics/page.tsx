import { unstable_cache } from "next/cache";
import { db } from "@/app/lib/prisma";
import { Prisma, type PurchaseOrderStatus } from "@/generated/prisma/client";
import type { UserRole } from "@/generated/prisma/enums";
import DbErrorBanner from "@/app/ui/admin/DbErrorBanner";
import {
  OrderStatusPieChart,
  WeeklyRevenueBarChart,
  HealthScoreGauge,
  TopFavouritesChart,
} from "@/app/ui/admin/charts/DynamicCharts";
import {
  getStoreInsights,
  getAbandonedCartInsights,
  getProductInsights,
  getRevenueForecast,
  getWeeklyActionPlan,
  getBusinessHealthScore,
  getAnomalyAlerts,
  getCustomerSegmentation,
  getFavouriteInsights,
} from "@/app/lib/gemini";

const GEMINI_TTL = { revalidate: 300 } as const;

const cachedGetStoreInsights      = unstable_cache(getStoreInsights,        ["gemini-store-insights"],    GEMINI_TTL);
const cachedGetAbandonedInsights  = unstable_cache(getAbandonedCartInsights, ["gemini-abandoned"],         GEMINI_TTL);
const cachedGetProductInsights    = unstable_cache(getProductInsights,       ["gemini-products"],          GEMINI_TTL);
const cachedGetRevenueForecast    = unstable_cache(getRevenueForecast,       ["gemini-revenue-forecast"],  GEMINI_TTL);
const cachedGetWeeklyActionPlan   = unstable_cache(getWeeklyActionPlan,      ["gemini-action-plan"],       GEMINI_TTL);
const cachedGetBusinessHealth     = unstable_cache(getBusinessHealthScore,   ["gemini-health-score"],      GEMINI_TTL);
const cachedGetAnomalyAlerts      = unstable_cache(getAnomalyAlerts,         ["gemini-anomalies"],         GEMINI_TTL);
const cachedGetCustomerSegment    = unstable_cache(getCustomerSegmentation,  ["gemini-segmentation"],      GEMINI_TTL);
const cachedGetFavouriteInsights  = unstable_cache(getFavouriteInsights,     ["gemini-favourites"],        GEMINI_TTL);

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN:  "Administradores",
  CLIENT: "Clientes",
  VENDOR: "Vendedores",
};

export default async function AnalyticsPage() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 91);

  type OrderGroup = { status: PurchaseOrderStatus; _count: { id: number } };
  type RoleCount = { role: UserRole; count: number };
  type TopProduct = { productName: string; _sum: { quantity: number | null; subtotal: Prisma.Decimal | null } };
  type FavGroup = { productId: string; productName: string; _count: { userId: number } };

  let ordersByStatus: OrderGroup[] = [];
  let usersByRole: RoleCount[] = [];
  let recentOrders = 0;
  let totalCarts = 0;
  let totalRevenue = 0;
  let abandonedCarts: { items: { priceAtTime: Prisma.Decimal; quantity: number; productName: string }[] }[] = [];
  let topProductRows: TopProduct[] = [];
  let recentPackages: { createdAt: Date; amount: Prisma.Decimal }[] = [];
  let favGrouped: FavGroup[] = [];
  let favCatRows: { categories: string[] }[] = [];
  let totalFavourites = 0;
  let shareCount = 0;
  let dbError = false;

  try {
    const [og, ur, ro, tc, rev, ac, tp, rp, fg, fc, fCount, sCount] = await Promise.all([
      db.purchaseOrder.groupBy({ by: ["status"], _count: { id: true } }),
      Promise.all([
        db.user.count({ where: { roles: { has: "CLIENT" } } }),
        db.user.count({ where: { roles: { has: "VENDOR" } } }),
      ]),
      db.purchaseOrder.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      db.cart.count({ where: { status: "NOT_CHECKED_OUT", items: { some: {} } } }),
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
        where: { createdAt: { gte: threeMonthsAgo } },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: "asc" },
      }),
      db.favouriteProduct.groupBy({
        by: ["productId", "productName"],
        _count: { userId: true },
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
      db.favouriteProduct.findMany({ select: { categories: true } }),
      db.favouriteProduct.count(),
      db.favouriteShare.count(),
    ]);

    ordersByStatus = og;
    const [clientCount, vendorCount] = ur;
    usersByRole = [
      { role: "CLIENT" as UserRole, count: clientCount },
      { role: "VENDOR" as UserRole, count: vendorCount },
    ].filter((r) => r.count > 0);
    recentOrders    = ro;
    totalCarts      = tc;
    totalRevenue    = (rev._sum.amount ?? new Prisma.Decimal(0)).toNumber();
    abandonedCarts  = ac;
    topProductRows  = tp;
    recentPackages  = rp;
    favGrouped      = fg as FavGroup[];
    favCatRows      = fc;
    totalFavourites = fCount;
    shareCount      = sCount;
  } catch {
    dbError = true;
  }

  const totalOrders = ordersByStatus.reduce((sum, s) => sum + s._count.id, 0);
  const totalUsers  = usersByRole.reduce((sum, r) => sum + r.count, 0);
  const clientCount = usersByRole.find((r) => r.role === "CLIENT")?.count ?? 0;
  const vendorCount = usersByRole.find((r) => r.role === "VENDOR")?.count ?? 0;

  const confirmedOrders = ordersByStatus.find((s) => s.status === "CONFIRMED")?._count.id ?? 0;
  const cancelledOrders = ordersByStatus.find((s) => s.status === "CANCELLED")?._count.id ?? 0;

  // Abandoned cart stats
  const totalLostRevenue = abandonedCarts.reduce(
    (sum, cart) => sum + cart.items.reduce((s, i) => s + i.priceAtTime.toNumber() * i.quantity, 0),
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
    unitsSold: p._sum.quantity ?? 0,
    revenue: (p._sum.subtotal ?? new Prisma.Decimal(0)).toNumber(),
  }));

  // Favourites derived data
  const topFavProducts = favGrouped.map((f) => ({ name: f.productName, count: f._count.userId }));
  const catCounts: Record<string, number> = {};
  for (const row of favCatRows) {
    for (const cat of row.categories) {
      catCounts[cat] = (catCounts[cat] ?? 0) + 1;
    }
  }
  const topFavCategories = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, count]) => ({ category, count }));

  // Revenue — build weekMap from all 91 days of packages
  const weekMap: Record<string, number> = {};
  const dayMap: Record<string, number> = {};
  for (const p of recentPackages) {
    // Day key
    const dayKey = new Date(p.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    dayMap[dayKey] = (dayMap[dayKey] ?? 0) + p.amount.toNumber();
    // Week key (Monday-anchored)
    const dw = new Date(p.createdAt);
    const dow = dw.getDay() === 0 ? 6 : dw.getDay() - 1;
    dw.setDate(dw.getDate() - dow);
    dw.setHours(0, 0, 0, 0);
    const wk = dw.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    weekMap[wk] = (weekMap[wk] ?? 0) + p.amount.toNumber();
  }

  // dailyRevenue — 7 day slots oldest→newest
  const dailyRevenue = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    return { label: key, amount: dayMap[key] ?? 0 };
  });

  // monthlyRevenue — last 5 Monday-anchored weeks
  const monthlyRevenue = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - dow - (4 - i) * 7);
    d.setHours(0, 0, 0, 0);
    const key = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    return { label: key, amount: weekMap[key] ?? 0 };
  });

  // quarterlyRevenue — last 13 Monday-anchored weeks
  const quarterlyRevenue = Array.from({ length: 13 }, (_, i) => {
    const d = new Date();
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - dow - (12 - i) * 7);
    d.setHours(0, 0, 0, 0);
    const key = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    return { label: key, amount: weekMap[key] ?? 0 };
  });

  // Pie chart data
  const pieData = ordersByStatus.map((s) => ({ status: s.status, count: s._count.id }));

  // All Gemini calls in parallel
  const [
    insightsResult,
    abandonedResult,
    productsResult,
    trendResult,
    actionPlanResult,
    healthResult,
    anomalyResult,
    segmentResult,
    favouriteResult,
  ] = await Promise.allSettled([
    cachedGetStoreInsights({
      totalRevenue,
      totalPurchases: totalOrders,
      recentPurchases: recentOrders,
      activeCarts: totalCarts,
      totalUsers,
      purchasesByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count.id })),
    }),
    cachedGetAbandonedInsights({
      cartCount: abandonedCarts.length,
      totalLostRevenue,
      topProducts: topAbandonedProducts,
    }),
    cachedGetProductInsights({ topProducts }),
    cachedGetRevenueForecast({ weeklyRevenue: quarterlyRevenue.map((d) => ({ week: d.label, amount: d.amount })) }),
    cachedGetWeeklyActionPlan({
      totalRevenue,
      recentPurchases: recentOrders,
      abandonedCartCount: abandonedCarts.length,
      totalLostRevenue,
      topProducts,
      cancelledOrders,
      totalOrders,
    }),
    cachedGetBusinessHealth({
      totalRevenue,
      recentPurchases: recentOrders,
      totalUsers,
      abandonedCartCount: abandonedCarts.length,
      confirmedOrders,
      cancelledOrders,
      totalOrders,
    }),
    cachedGetAnomalyAlerts({
      weeklyRevenue: quarterlyRevenue.map((d) => ({ week: d.label, amount: d.amount })),
      cancelledOrders,
      totalOrders,
      abandonedCartCount: abandonedCarts.length,
      recentPurchases: recentOrders,
    }),
    cachedGetCustomerSegment({
      totalUsers,
      clientCount,
      vendorCount,
      totalOrders,
      confirmedOrders,
      recentPurchases: recentOrders,
    }),
    totalFavourites > 0
      ? cachedGetFavouriteInsights({
          totalFavourites,
          shareCount,
          topProducts: topFavProducts,
          topCategories: topFavCategories,
        })
      : Promise.resolve(null),
  ]);

  const aiInsights     = insightsResult.status     === "fulfilled" ? insightsResult.value     : null;
  const aiAbandoned    = abandonedResult.status    === "fulfilled" ? abandonedResult.value    : null;
  const aiProducts     = productsResult.status     === "fulfilled" ? productsResult.value     : null;
  const aiTrend        = trendResult.status        === "fulfilled" ? trendResult.value        : null;
  const aiActionPlan   = actionPlanResult.status   === "fulfilled" ? actionPlanResult.value   : null;
  const aiHealth       = healthResult.status       === "fulfilled" ? healthResult.value       : null;
  const aiAnomalies    = anomalyResult.status      === "fulfilled" ? (anomalyResult.value ?? []) : [];
  const aiSegmentation = segmentResult.status      === "fulfilled" ? segmentResult.value      : null;
  const aiFavourites   = favouriteResult.status    === "fulfilled" ? favouriteResult.value    : null;

  return (
    <div className="px-10 py-10">
      {dbError && <DbErrorBanner />}
      <div className="mb-10">
        <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">MÉTRICAS</p>
        <h1 className="font-serif text-5xl text-brown">Estadísticas</h1>
      </div>

      {/* Health Score + Action Plan side by side */}
      {(aiHealth || aiActionPlan) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {aiHealth && (
            <div className="border border-tan p-8">
              <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">INTELIGENCIA ARTIFICIAL</p>
              <h2 className="font-serif text-3xl text-brown mb-6">Salud del Negocio</h2>
              <div className="flex items-center gap-8">
                <HealthScoreGauge score={aiHealth.score} label={aiHealth.label} />
                <p className="text-sm text-muted-foreground leading-relaxed">{aiHealth.explanation}</p>
              </div>
            </div>
          )}
          {aiActionPlan && (
            <GeminiCard title="Plan de Acción Semanal" label="INTELIGENCIA ARTIFICIAL">
              <GeminiText text={aiActionPlan} />
            </GeminiCard>
          )}
        </div>
      )}

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

      {/* Anomaly alerts */}
      {aiAnomalies.length > 0 && (
        <div className="mb-10 border border-[#c8902a]/40 bg-[#fdf6e8] p-8">
          <p className="text-xs tracking-[0.2em] text-[#c8902a] italic mb-2">ALERTAS</p>
          <h2 className="font-serif text-3xl text-brown mb-6">Anomalías Detectadas</h2>
          <div className="space-y-3">
            {aiAnomalies.map((alert, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[#c8902a] mt-0.5 shrink-0">⚠</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{alert}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General AI insights */}
      {aiInsights && (
        <GeminiCard title="Insights del Negocio" label="INTELIGENCIA ARTIFICIAL">
          <GeminiText text={aiInsights} />
        </GeminiCard>
      )}

      {/* Abandoned carts */}
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

      {/* Top products */}
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

      {/* Favourites analytics */}
      {totalFavourites > 0 && (
        <GeminiCard title="Favoritos" label="COMPORTAMIENTO">
          <p className="text-xs tracking-[0.12em] text-muted-foreground mb-6">
            {totalFavourites} producto{totalFavourites !== 1 ? "s" : ""} guardado{totalFavourites !== 1 ? "s" : ""}
            {shareCount > 0 && (
              <>
                {" · "}
                <span className="text-brown font-medium">{shareCount} lista{shareCount !== 1 ? "s" : ""} compartida{shareCount !== 1 ? "s" : ""}</span>
              </>
            )}
          </p>
          {topFavProducts.length > 0 && (
            <div className="mb-6">
              <TopFavouritesChart data={topFavProducts} />
            </div>
          )}
          {aiFavourites && <GeminiText text={aiFavourites} />}
        </GeminiCard>
      )}

      {/* Revenue trend — multi-range bar chart */}
      <GeminiCard title="Tendencia de Ingresos" label="PROYECCIÓN">
        <div className="mb-6">
          <WeeklyRevenueBarChart
            daily={dailyRevenue}
            monthly={monthlyRevenue}
            quarterly={quarterlyRevenue}
          />
        </div>
        {aiTrend && <GeminiText text={aiTrend} />}
      </GeminiCard>

      <div className="grid grid-cols-2 gap-10 mt-12">
        {/* Orders by status — pie chart */}
        <div>
          <h2 className="font-serif text-3xl text-brown mb-6">Pedidos por Estado</h2>
          {ordersByStatus.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">Sin datos todavía.</p>
          ) : (
            <OrderStatusPieChart data={pieData} />
          )}
        </div>

        {/* Users by role */}
        <div>
          <h2 className="font-serif text-3xl text-brown mb-6">Usuarios por Rol</h2>
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

      {/* Customer segmentation */}
      {aiSegmentation && (
        <div className="mt-12">
          <GeminiCard title="Segmentación de Clientes" label="INTELIGENCIA ARTIFICIAL">
            <GeminiText text={aiSegmentation} />
          </GeminiCard>
        </div>
      )}
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
