"use client";

import { Download, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import NivelesBuilder from "@/shared/components/tabla-double/niveles-builder";
import TablaDouble from "@/shared/components/tabla-double/tabla-double";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useExcelJS } from "@/shared/hooks/use-dynamic-libraries";
import { type ReporteKpi, useKpiCotizaciones } from "../api/kpi-cotizaciones";
import type { Filtros } from "../lib/filtros-types";
import {
  CAMPOS_COLUMNA_KPI,
  CAMPOS_NIVELES_KPI,
  type CampoKpi,
  construirTablaKpi,
  NIVELES_DEFECTO_KPI,
} from "../lib/tabla-kpi";

/** El Select de Radix no acepta "" como valor: "sin columnas" se guarda como "". */
const SIN_COLUMNA = "__ninguna__";

const NOMBRE_ARCHIVO: Record<ReporteKpi, string> = {
  hit_rate: "hit-rate",
  realizacion_de_precio: "realizacion-de-precio",
};

/**
 * Tabla dinámica de Hit Rate o Realización de Precio: el usuario elige los niveles de filas
 * (y su orden) y el campo de columnas. Lee `report_kpi_cotizaciones`.
 */
export function TablaKpi({ filtros, reporte }: { filtros: Filtros; reporte: ReporteKpi }) {
  const consulta = useKpiCotizaciones(filtros, reporte);
  const [niveles, setNiveles] = useState<CampoKpi[]>(NIVELES_DEFECTO_KPI);
  const [campoColumna, setCampoColumna] = useState("");
  const { loadExcelJS, isLoading: cargandoExcel } = useExcelJS();

  const tabla = useMemo(
    () => construirTablaKpi(consulta.data ?? [], reporte, niveles, campoColumna),
    [consulta.data, reporte, niveles, campoColumna],
  );

  const exportarExcel = async () => {
    const { ExcelJS, saveAs } = await loadExcelJS();
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet("Reporte");

    const encabezado = hoja.addRow(["Concepto", ...tabla.columnas.map((c) => c.label)]);
    encabezado.font = { bold: true };

    const agregar = (nodos: typeof tabla.data, profundidad: number) => {
      for (const nodo of nodos) {
        const fila = hoja.addRow([
          nodo.label,
          ...tabla.columnas.map((c) => {
            const valor = nodo.values?.[c.key];
            return valor === "" || valor == null ? null : Number(valor);
          }),
        ]);
        fila.getCell(1).alignment = { indent: profundidad };
        if (nodo.children?.length) fila.font = { bold: true };
        agregar(nodo.children ?? [], profundidad + 1);
      }
    };
    agregar(tabla.data, 0);
    hoja.getColumn(1).width = 40;

    const buffer = await libro.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${NOMBRE_ARCHIVO[reporte]}-${filtros.fecha_inicio}-${filtros.fecha_fin}.xlsx`,
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <NivelesBuilder
            camposDisponibles={CAMPOS_NIVELES_KPI}
            nivelesActivos={niveles}
            onChange={setNiveles}
          />
        </div>
        <div className="space-y-3 lg:col-span-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Columnas (qué se desglosa en columnas)
            </p>
            <Select
              value={campoColumna || SIN_COLUMNA}
              onValueChange={(valor) => setCampoColumna(valor === SIN_COLUMNA ? "" : valor)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Seleccione el campo de columnas" />
              </SelectTrigger>
              <SelectContent>
                {CAMPOS_COLUMNA_KPI.map((c) => (
                  <SelectItem key={c.campo || SIN_COLUMNA} value={c.campo || SIN_COLUMNA}>
                    {c.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => void exportarExcel()}
            disabled={tabla.data.length === 0 || cargandoExcel}
            className="gap-1.5"
          >
            {cargandoExcel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Exportar Excel
          </Button>
        </div>
      </div>

      {consulta.isLoading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : consulta.isError ? (
        <p className="p-8 text-center text-sm text-destructive">
          {consulta.error instanceof Error
            ? consulta.error.message
            : "No se pudo consultar el reporte"}
        </p>
      ) : tabla.data.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          No hay cotizaciones en el periodo.
        </p>
      ) : (
        <TablaDouble
          // Se vuelve a montar al cambiar datos o agrupación para expandir el total general.
          key={`${reporte}-${consulta.dataUpdatedAt}-${campoColumna}-${niveles.map((n) => n.campo).join(",")}`}
          data={tabla.data}
          columns={tabla.columnas}
          rowKey="id"
          showTotals={false}
          mostrarColumnaTotal={false}
          mostrarTotalesPie={false}
          firstColumnWidth={280}
          nivelExpandidoInicial={1}
        />
      )}
    </div>
  );
}
