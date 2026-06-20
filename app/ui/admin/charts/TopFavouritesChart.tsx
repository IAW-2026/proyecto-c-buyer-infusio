"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
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
];

type View = "favourites" | "users";

const VIEW_BUTTONS: { id: View; label: string }[] = [
  { id: "favourites", label: "FAVORITOS" },
  { id: "users",      label: "USUARIOS"  },
];

interface Props {
  data: { name: string; count: number }[];
  totalFavourites: number;
  totalUsers: number;
}

export default function TopFavouritesChart({ data, totalFavourites, totalUsers }: Props) {
  const [view, setView] = useState<View>("favourites");
  const xMax = view === "favourites" ? totalFavourites : totalUsers;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {VIEW_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setView(btn.id)}
            className={`px-4 py-1.5 text-[10px] tracking-[0.12em] border transition-colors ${
              view === btn.id
                ? "border-brown text-brown"
                : "border-tan text-muted-foreground hover:border-brown hover:text-brown"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 38)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
        >
          <XAxis
            type="number"
            domain={[0, xMax]}
            tick={{ fontSize: 10, fill: "#8a8278" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 11, fill: "#5a5450", textAnchor: "middle", dx: -80 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => [v, "favoritos"]}
            contentStyle={{
              fontSize: 11,
              border: "1px solid #d4cfc5",
              borderRadius: 0,
              backgroundColor: "#faf8f5",
            }}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
