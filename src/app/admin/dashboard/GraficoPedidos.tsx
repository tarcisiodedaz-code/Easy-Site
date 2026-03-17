"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { PedidoPorDia } from "@/lib/dashboard";

type Props = { dados: PedidoPorDia[] };

export function GraficoPedidos({ dados }: Props) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#fafafa",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value: number) => [value, "Pedidos"]}
            labelFormatter={(label) => `Dia: ${label}`}
          />
          <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} name="Pedidos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
