"use client";

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

interface KeywordsBarChartProps {
  rankings: Array<{
    keyword: string;
    position: number;
    trend: "up" | "down" | "stable";
  }>;
}

export default function KeywordsBarChart({ rankings }: KeywordsBarChartProps) {
  // Invertimos posición para que más alto = mejor (posición 1 = 100%)
  // Y limitamos al top 10 para que sea legible
  const data = rankings
    .filter((r) => r.position > 0)
    .slice(0, 10)
    .map((r) => ({
      name: r.keyword.length > 28 ? r.keyword.slice(0, 28) + "..." : r.keyword,
      keyword: r.keyword,
      score: Math.max(0, 100 - (r.position - 1) * 5), // #1=100, #20=5
      position: r.position,
      trend: r.trend,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No hay keywords en el top 20
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#4b5563", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0]?.payload;
              return (
                <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-medium">{item?.keyword}</p>
                  <p className="text-muted-foreground">
                    Posición: <span className="font-bold">#{item?.position}</span>
                  </p>
                  <p>
                    Tendencia:{" "}
                    {item?.trend === "up" ? "↑ Subiendo" : item?.trend === "down" ? "↓ Bajando" : "— Estable"}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.position <= 3
                    ? "#10b981"
                    : entry.position <= 10
                    ? "#3b82f6"
                    : entry.position <= 20
                    ? "#f59e0b"
                    : "#ef4444"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
