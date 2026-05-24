"use client";

import dynamic from "next/dynamic";

export const OrderStatusPieChart = dynamic(
  () => import("./OrderStatusPieChart"),
  { ssr: false, loading: () => <div className="h-64 bg-tan/10 animate-pulse rounded" /> }
);

export const WeeklyRevenueBarChart = dynamic(
  () => import("./WeeklyRevenueBarChart"),
  { ssr: false, loading: () => <div className="h-52 bg-tan/10 animate-pulse rounded" /> }
);

export const HealthScoreGauge = dynamic(
  () => import("./HealthScoreGauge"),
  { ssr: false, loading: () => <div className="w-36 h-36 bg-tan/10 animate-pulse rounded-full" /> }
);

export const TopFavouritesChart = dynamic(
  () => import("./TopFavouritesChart"),
  { ssr: false, loading: () => <div className="h-52 bg-tan/10 animate-pulse rounded" /> }
);
