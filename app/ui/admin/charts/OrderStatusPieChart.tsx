"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  PENDING:          "#c8b89a",
  AWAITING_PAYMENT: "#dfc98a",
  CONFIRMED:        "#7a9068",
  CANCELLED:        "#b87070",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:          "Procesando",
  AWAITING_PAYMENT: "Pendiente",
  CONFIRMED:        "Confirmado",
  CANCELLED:        "Cancelado",
};

interface Props {
  data: { status: string; count: number }[];
}

export default function OrderStatusPieChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={55}
          dataKey="count"
          nameKey="label"
        >
          {formatted.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLORS[entry.status] ?? "#c8b89a"}
            />
          ))}
        </Pie>
        <Tooltip formatter={(v, n) => [v, n]} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => (
            <span style={{ fontSize: 11, color: "#5a5450" }}>{v}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
