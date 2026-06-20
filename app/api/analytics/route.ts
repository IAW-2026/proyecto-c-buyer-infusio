import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!apiKey || apiKey !== process.env.ANALYTICS_APP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [
    orderStatusRows,
    totalUsers,
    newUsers,
    totalProducts,
    limitedProducts,
    revenueAgg,
    abandonedCartsData,
    topProductRows,
    recentPackages,
    favGrouped,
    favCatRows,
    totalFavourites,
    shareCount,
  ] = await Promise.all([
    db.purchaseOrder.groupBy({ by: ["status"], _count: { id: true } }),
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.product.count(),
    db.product.count({ where: { isLimitedEdition: true } }),
    db.package.aggregate({ _sum: { amount: true } }),
    db.cart.findMany({
      where: { status: "NOT_CHECKED_OUT", items: { some: {} } },
      include: { items: { select: { priceAtTime: true, quantity: true } } },
    }),
    db.packageItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 10,
    }),
    db.package.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: "asc" },
    }),
    db.favouriteProduct.groupBy({
      by: ["productName"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
    db.favouriteProduct.findMany({ select: { categories: true } }),
    db.favouriteProduct.count(),
    db.favouriteShare.count(),
  ]);

  // Overview
  const totalRevenue = (revenueAgg._sum.amount ?? new Prisma.Decimal(0)).toNumber();
  const totalOrders = orderStatusRows.reduce((s, r) => s + r._count.id, 0);
  const confirmedOrders = orderStatusRows.find((r) => r.status === "CONFIRMED")?._count.id ?? 0;
  const cancelledOrders = orderStatusRows.find((r) => r.status === "CANCELLED")?._count.id ?? 0;
  const activeOrders = totalOrders - confirmedOrders - cancelledOrders;

  const abandonedCartValue = abandonedCartsData.reduce(
    (sum, cart) => sum + cart.items.reduce((s, i) => s + i.priceAtTime.toNumber() * i.quantity, 0),
    0
  );

  // Revenue bucketing — build maps from raw package rows
  const dayMap: Record<string, number> = {};
  const weekMap: Record<string, number> = {};
  const monthMap: Record<string, number> = {};

  for (const p of recentPackages) {
    const d = new Date(p.createdAt);
    const amount = p.amount.toNumber();

    // daily: YYYY-MM-DD
    const dayKey = d.toISOString().slice(0, 10);
    dayMap[dayKey] = (dayMap[dayKey] ?? 0) + amount;

    // weekly: ISO date of Monday that starts this week
    const dw = new Date(d);
    const dow = dw.getDay() === 0 ? 6 : dw.getDay() - 1;
    dw.setDate(dw.getDate() - dow);
    dw.setHours(0, 0, 0, 0);
    const weekKey = dw.toISOString().slice(0, 10);
    weekMap[weekKey] = (weekMap[weekKey] ?? 0) + amount;

    // monthly: YYYY-MM
    const monthKey = d.toISOString().slice(0, 7);
    monthMap[monthKey] = (monthMap[monthKey] ?? 0) + amount;
  }

  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, revenue: dayMap[key] ?? 0 };
  });

  const weekly = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(now);
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - dow - (12 - i) * 7);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    return { weekStart: key, revenue: weekMap[key] ?? 0 };
  });

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = d.toISOString().slice(0, 7);
    return { month: key, revenue: monthMap[key] ?? 0 };
  });

  // Top products by revenue
  const topProducts = topProductRows.map((p) => ({
    productName: p.productName,
    totalRevenue: (p._sum.subtotal ?? new Prisma.Decimal(0)).toNumber(),
    totalQuantity: p._sum.quantity ?? 0,
  }));

  // Favourites
  const topFavouritedProducts = favGrouped.map((f) => ({
    productName: f.productName,
    userCount: f._count.userId,
  }));

  const catCounts: Record<string, number> = {};
  for (const row of favCatRows) {
    for (const cat of row.categories) {
      catCounts[cat] = (catCounts[cat] ?? 0) + 1;
    }
  }
  const topCategories = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  return NextResponse.json({
    meta: { generatedAt: now.toISOString() },
    overview: {
      totalRevenue,
      totalOrders,
      confirmedOrders,
      cancelledOrders,
      activeOrders,
      totalUsers,
      newUsersLast30Days: newUsers,
      totalProducts,
      limitedEditionProducts: limitedProducts,
      abandonedCarts: abandonedCartsData.length,
      abandonedCartValue,
    },
    orderStatusDistribution: orderStatusRows.map((r) => ({ status: r.status, count: r._count.id })),
    revenueTimeSeries: { daily, weekly, monthly },
    topProducts,
    favourites: {
      totalFavouriteEntries: totalFavourites,
      totalSharedLists: shareCount,
      topFavouritedProducts,
      topCategories,
    },
  });
}
