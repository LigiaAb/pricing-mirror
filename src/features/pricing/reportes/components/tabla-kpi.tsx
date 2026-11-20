"use client";

import { format } from "date-fns";
import { useEffect, useMemo, useRef } from "react";
import { TablaDouble } from "@/features/pricing/shared";
import NivelesBuilder from "@/shared/components/tabla-double/niveles-builder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useExcelJS } from "@/shared/hooks/use-dynamic-libraries";
import { type ReporteKpi, useKpiCotizaciones } from "../api/kpi-cotizaciones";
import { agregarHojaReporte, type FilaExcel } from "../lib/excel-reporte";
import type { Filtros } from "../lib/filtros-types";
import {
  CAMPOS_COLUMNA_KPI,
  CAMPOS_NIVELES_KPI,
  type CampoKpi,
  construirTablaKpi,
} from "../lib/tabla-kpi";

/** El Select de Radix no acepta "" como valor: "sin columnas" se guarda como "". */
const SIN_COLUMNA = "__ninguna__";

const NOMBRE_ARCHIVO: Record<ReporteKpi, string> = {
  hit_rate: "hit-rate",
  realizacion_de_precio: "realizacion-de-precio",
};

/** Mismos títulos que el PDF de cada reporte. */
const TITULO_REPORTE: Record<ReporteKpi, string> = {
  hit_rate: "Hit Rate",
  realizacion_de_precio: "Realizacion de Precio (RdP)",
};

type ConfiguracionKpi = {
  /** Niveles de filas, en el orden en que se agrupan. */
  niveles: CampoKpi[];
  /** Campo de columnas; "" = sin columnas (solo el total). */
  campoColumna: string;
};

/**
 * Controles de la tabla dinámica (van en "Personaliza tu reporte"): niveles de filas
 * (y su orden) y campo de columnas.
 */
export function ConfiguracionTablaKpi({
  niveles,
  campoColumna,
  onNivelesChange,
  onCampoColumnaChange,
}: ConfiguracionKpi & {
  onNivelesChange: (niveles: CampoKpi[]) => void;
  onCampoColumnaChange: (campo: string) => void;
}) {
  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Columnas (qué se desglosa en columnas)
        </p>
        <Select
          value={campoColumna || SIN_COLUMNA}
          onValueChange={(valor) => onCampoColumnaChange(valor === SIN_COLUMNA ? "" : valor)}
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
      <NivelesBuilder
        camposDisponibles={CAMPOS_NIVELES_KPI}
        nivelesActivos={niveles}
        onChange={onNivelesChange}
      />
    </div>
  );
}

/**
 * Tabla dinámica de Hit Rate o Realización de Precio, agrupada según `ConfiguracionTablaKpi`.
 * Lee `report_kpi_cotizaciones`.
 */
export function TablaKpi({
  filtros,
  reporte,
  niveles,
  campoColumna,
  exportar = 0,
  onExportando,
  onError,
}: ConfiguracionKpi & {
  filtros: Filtros;
  reporte: ReporteKpi;
  /** Contador del botón "Excel" (en Filtros requeridos): cada cambio genera el archivo. */
  exportar?: number;
  onExportando?: (exportando: boolean) => void;
  onError?: (mensaje: string) => void;
}) {
  const consulta = useKpiCotizaciones(filtros, reporte);
  const { loadExcelJS } = useExcelJS();

  // Servicio se filtra aquí: la API no recibe transporte (no cambian sus parámetros).
  const servicio = filtros.cod_servicio?.label?.trim().toUpperCase();
  const tabla = useMemo(() => {
    const filas = consulta.data ?? [];
    const filtradas = servicio
      ? filas.filter((f) => f.transporte?.trim().toUpperCase() === servicio)
      : filas;
    // Con servicio, origen/destino muestran ciudad o punto de enlace; sin él, el país.
    return construirTablaKpi(filtradas, reporte, niveles, campoColumna, Boolean(servicio));
  }, [consulta.data, servicio, reporte, niveles, campoColumna]);

  const exportarExcel = async () => {
    if (consulta.isLoading) throw new Error("Espera a que termine la consulta antes de descargar.");
    if (tabla.data.length === 0) throw new Error("No hay datos para exportar a Excel.");
    const { ExcelJS, saveAs } = await loadExcelJS();
    const libro = new ExcelJS.Workbook();

    // Una columna por cada nivel de agrupación; cada fila escribe solo su valor, en la
    // columna de su nivel (sin repetir los superiores). El total general va en la primera.
    const columnasNivel = niveles.length ? niveles.map((n) => n.etiqueta) : ["Concepto"];
    const filas: FilaExcel[] = [];
    const agregar = (nodos: typeof tabla.data, ruta: string[]) => {
      for (const nodo of nodos) {
        const esRaiz = ruta.length === 0 && nodo.id === "total";
        const rutaNodo = esRaiz ? [] : [...ruta, nodo.label];
        const columnaNodo = Math.max(0, rutaNodo.length - 1);
        const celdasNivel = columnasNivel.map((_, i) => (i === columnaNodo ? nodo.label : null));
        filas.push({
          celdas: [
            ...celdasNivel,
            ...tabla.columnas.map((c) => {
              const valor = nodo.values?.[c.key];
              return valor === "" || valor == null ? null : Number(valor);
            }),
          ],
          negrita: Boolean(nodo.children?.length) || esRaiz,
        });
        agregar(nodo.children ?? [], rutaNodo);
      }
    };
    agregar(tabla.data, []);

    const etiquetaColumna = CAMPOS_COLUMNA_KPI.find((c) => c.campo === campoColumna)?.etiqueta;
    await agregarHojaReporte(libro, {
      titulo: `${TITULO_REPORTE[reporte]} - Resumen agrupado`,
      hoja: "Resumen agrupado",
      header: {
        Período: `${format(filtros.fecha_inicio, "dd-MM-yyyy")} al ${format(filtros.fecha_fin, "dd-MM-yyyy")}`,
        Empresa: filtros.cod_empresa?.nombre,
        "Centro de Costo": filtros.cod_cc?.nombre,
        Usuario: filtros.cod_usuario?.label,
        Cliente: filtros.cod_cliente?.label,
        "Tipo de pago": filtros.cod_tipo_pago?.label,
        Servicio: filtros.cod_servicio?.label,
        "Agrupado por": columnasNivel.join(" > "),
        ...(campoColumna ? { Columnas: etiquetaColumna } : {}),
      },
      columnas: [...columnasNivel, ...tabla.columnas.map((c) => c.label)],
      filas,
      formatos: [
        ...columnasNivel.map(() => undefined),
        ...tabla.columnas.map((c) => (c.label.includes("%") ? '0.00"%"' : "#,##0")),
      ],
    });

    const buffer = await libro.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${NOMBRE_ARCHIVO[reporte]}-${filtros.fecha_inicio}-${filtros.fecha_fin}.xlsx`,
    );
  };

  // El botón vive en ListaReportes (junto al PDF); aquí solo se genera al cambiar `exportar`.
  const exportarActual = useRef(exportarExcel);
  exportarActual.current = exportarExcel;
  const ultimaExportacion = useRef(exportar);
  useEffect(() => {
    if (exportar === ultimaExportacion.current) return;
    ultimaExportacion.current = exportar;
    onExportando?.(true);
    exportarActual
      .current()
      .catch((e: unknown) =>
        onError?.(e instanceof Error ? e.message : "No se pudo generar el Excel."),
      )
      .finally(() => onExportando?.(false));
  }, [exportar, onError, onExportando]);

  return (
    <div className="space-y-4">
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
