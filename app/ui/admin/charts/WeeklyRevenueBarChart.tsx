"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const BAR_COLORS = [
  "#5d8c6a",
  "#378873",
  "#00827f",
  "#007b8e",
  "#00729a",
  "#4894a3",
  "#006170",
  "#41493b",
  "#a5ae9d",
  "#5d8c6a",
  "#378873",
  "#00827f",
  "#007b8e",
];

type Range = "daily" | "monthly" | "quarterly";

interface DataPoint {
  label: string;
  amount: number;
}

interface Props {
  daily: DataPoint[];
  monthly: DataPoint[];
  quarterly: DataPoint[];
}

const RANGE_BUTTONS: { id: Range; label: string }[] = [
  { id: "daily",     label: "SEMANA" },
  { id: "monthly",   label: "MES" },
  { id: "quarterly", label: "3 MESES" },
];

export default function WeeklyRevenueBarChart({ daily, monthly, quarterly }: Props) {
  const [range, setRange] = useState<Range>("monthly");

  const active = range === "daily" ? daily : range === "monthly" ? monthly : quarterly;
  const chartData = active.map((d) => ({ week: d.label, amount: d.amount }));

  return (
    <div>
      {/* Range toggle */}
      <div className="flex gap-2 mb-6">
        {RANGE_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setRange(btn.id)}
            className={`px-4 py-1.5 text-[10px] tracking-[0.12em] border transition-colors ${
              range === btn.id
                ? "border-brown text-brown"
                : "border-tan text-muted-foreground hover:border-brown hover:text-brown"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ede9e3" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: "#8a8278" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#8a8278" }}
            axisLine={false}
            tickLine={false}
            tickCount={7}
            domain={[0, (dataMax: number) => Math.ceil((dataMax * 1.4) / 1000) * 1000]}
            tickFormatter={(v) => (v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`)}
            width={42}
          />
          <Tooltip
            formatter={(v) => [
              `$${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`,
              "Ingresos",
            ]}
            contentStyle={{
              fontSize: 11,
              border: "1px solid #d4cfc5",
              borderRadius: 0,
              backgroundColor: "#faf8f5",
            }}
          />
          <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BAR_COLORS[index % BAR_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
