"use client";

import NivelesBuilder, { type CampoConfig } from "@/shared/components/tabla-double/niveles-builder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { ConfiguracionResumen } from "../lib/resumen-agrupado";

/** El Select de Radix no acepta "" como valor: "sin columnas" se guarda como "". */
const SIN_COLUMNA = "__ninguna__";

/**
 * "Personaliza tu reporte": mismos controles que `ConfiguracionTablaKpi` de Reportes de
 * pricing: campo de columnas y niveles de filas (y su orden) con `NivelesBuilder`. Los campos
 * salen de las columnas `agrupable` del reporte.
 */
export function PersonalizaReporte({
  campos,
  config,
  onChange,
}: Readonly<{
  campos: CampoConfig[];
  config: ConfiguracionResumen;
  onChange: (config: ConfiguracionResumen) => void;
}>) {
  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Columnas (qué se desglosa en columnas)
        </p>
        <Select
          value={config.columna || SIN_COLUMNA}
          onValueChange={(valor) =>
            onChange({ ...config, columna: valor === SIN_COLUMNA ? "" : valor })
          }
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Seleccione el campo de columnas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SIN_COLUMNA}>Ninguna (solo total)</SelectItem>
            {campos.map((c) => (
              <SelectItem key={c.campo} value={c.campo}>
                {c.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <NivelesBuilder
        camposDisponibles={campos}
        nivelesActivos={config.niveles}
        onChange={(niveles) => onChange({ ...config, niveles })}
      />
    </div>
  );
}
