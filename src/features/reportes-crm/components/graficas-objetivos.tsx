"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MedidorObjetivo } from "../lib/series-actividades";

export function GraficasObjetivos({
  datos,
  medidores,
  tipos,
}: Readonly<{
  datos: Array<{ semana: number; [tipo: string]: string | number }>;
  tipos: string[];
  medidores: MedidorObjetivo[];
}>) {
  return (
    <div className="mt-4 space-y-4">
      <div className="h-80 rounded-lg border p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={datos} margin={{ top: 8, right: 12, left: 0, bottom: 42 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="semana"
              label={{ value: "Semana ISO", position: "bottom", offset: 20 }}
            />
            <YAxis
              allowDecimals={false}
              label={{ value: "Actividades", angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend />
            {tipos.map((tipo, indice) => (
              <Area
                dataKey={tipo}
                fill={COLORES[indice % COLORES.length] ?? "#2563eb"}
                fillOpacity={0.12}
                key={tipo}
                name={tipo}
                stroke={COLORES[indice % COLORES.length] ?? "#2563eb"}
                strokeWidth={2}
                type="monotone"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {medidores.map((medidor) => (
          <div className="rounded-lg border p-3" key={medidor.id}>
            <p className="truncate text-sm font-medium" title={medidor.empleado}>
              {medidor.empleado}
            </p>
            <p className="truncate text-xs text-muted-foreground" title={medidor.objetivo}>
              {medidor.objetivo}
            </p>
            <div className="mx-auto h-32 w-32">
              <meter
                aria-label={`${medidor.empleado}: ${medidor.actividades} de ${medidor.meta} actividades`}
                className="sr-only"
                max={medidor.meta || 1}
                min={0}
                value={Math.min(medidor.actividades, medidor.meta)}
              >
                {medidor.actividades} de {medidor.meta}
              </meter>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  data={[{ porcentaje: medidor.porcentaje }]}
                  endAngle={-270}
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={90}
                >
                  <RadialBar background dataKey="porcentaje" fill="hsl(var(--primary))" />
                  <text
                    dominantBaseline="middle"
                    fill="currentColor"
                    textAnchor="middle"
                    x="50%"
                    y="50%"
                  >
                    {medidor.actividades}/{medidor.meta}
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {medidor.porcentaje}% de la meta
            </p>
            <p className="mt-2 text-center text-sm font-semibold text-primary">
              {medidor.tipoActividad}
            </p>
            <p className="text-center text-sm">
              Calculado por: <strong>{medidor.periodicidadUnidad}</strong>
            </p>
            <p className="text-center text-xs font-semibold text-primary">{medidor.objetivo}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const COLORES = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#dc2626"];
