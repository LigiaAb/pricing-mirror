"use client";

import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import React from "react";
import { usePdfReporte } from "@/features/pricing/reportes";
import { useContextoOperativoStore } from "@/features/shell";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import type { FiltroReporte, ParamsReporte, Reporte, ValoresFiltros } from "../lib/definir-reporte";
import {
  bloquesPdf,
  descargarExcel,
  nombreArchivo,
  tablaDetalle,
  tablaResumen,
} from "../lib/exportar";
import {
  type ConfiguracionResumen,
  calcularResumen,
  MEDIDA_CANTIDAD,
} from "../lib/resumen-agrupado";
import { CampoFecha, CampoSelect } from "./campos";
import { TablaReporte } from "./contenido-reporte";
import { EncabezadoPanel, MensajeVacio, Panel, TituloReporte } from "./panel";
import { PersonalizaReporte } from "./personaliza-reporte";
import { TablaResumen } from "./resumen-agrupado";

const SIN_FILAS: readonly unknown[] = [];
const sinValorInicial = () => "";
const fechaVisible = (iso: string) => (iso ? format(parseISO(iso), "dd/MM/yyyy") : "");

/** Un filtro de la definición; su hook de opciones vive en este componente. */
function CampoFiltro({
  filtro,
  valores,
  onChange,
  onEtiqueta,
}: Readonly<{
  filtro: FiltroReporte;
  valores: ValoresFiltros;
  onChange: (id: string, valor: string) => void;
  onEtiqueta: (label: string, valor: string) => void;
}>) {
  const { opciones, cargando } = filtro.useOpciones(valores);
  const usarValorInicial = filtro.useValorInicial ?? sinValorInicial;
  const inicial = usarValorInicial();
  const valor = valores[filtro.id] ?? inicial;
  const etiqueta = valor ? (opciones.find((o) => o.value === valor)?.label ?? valor) : "";

  // El valor inicial (ej. CC del contexto) pasa a los filtros cuando llega.
  React.useEffect(() => {
    if (valores[filtro.id] === undefined && inicial) onChange(filtro.id, inicial);
  }, [valores, filtro.id, inicial, onChange]);

  // Nombre de lo elegido, para el encabezado del PDF y del Excel.
  React.useEffect(() => {
    onEtiqueta(filtro.label, String(etiqueta));
  }, [onEtiqueta, filtro.label, etiqueta]);

  return (
    <CampoSelect
      id={`filtro-${filtro.id}`}
      label={filtro.label}
      value={valor}
      onChange={(nuevo) => onChange(filtro.id, nuevo)}
      opciones={opciones}
      cargando={cargando}
      placeholder="Todos"
    />
  );
}

/**
 * Pantalla de un reporte (se monta con `key` = nomenclatura: al cambiar de reporte todo
 * vuelve a su estado inicial). Arma fechas, filtros, "Personaliza tu reporte", resumen
 * agrupado, tabla del reporte y descargas a partir de la definición.
 */
export function PantallaReporte({
  definicion,
  titulo,
}: Readonly<{ definicion: Reporte; titulo: string }>) {
  const empresa = useContextoOperativoStore((s) => s.currentEmpresa);
  const centroCosto = useContextoOperativoStore((s) => s.currentCentroCosto);
  const hidratado = useContextoOperativoStore((s) => s._hasHydrated);

  const modoFechas = definicion.fechas ?? "requeridas";
  const [fechas, setFechas] = React.useState(() => {
    const hoy = new Date();
    return modoFechas === "ninguna"
      ? { inicio: "", fin: "" }
      : {
          inicio: format(startOfMonth(hoy), "yyyy-MM-dd"),
          fin: format(endOfMonth(hoy), "yyyy-MM-dd"),
        };
  });
  const [valores, setValores] = React.useState<ValoresFiltros>({});
  const etiquetas = React.useRef<Record<string, string>>({});
  const [config, setConfig] = React.useState<ConfiguracionResumen>({
    filas: definicion.agrupacion?.filas ?? [],
    columna: definicion.agrupacion?.columna ?? "",
    medida: definicion.agrupacion?.medida ?? MEDIDA_CANTIDAD,
  });

  const cambiarFiltro = React.useCallback(
    (id: string, valor: string) => {
      const limpia = definicion.filtros?.find((f) => f.id === id)?.limpia ?? [];
      setValores((actuales) => {
        const nuevos = { ...actuales, [id]: valor };
        for (const otro of limpia) nuevos[otro] = "";
        return nuevos;
      });
    },
    [definicion.filtros],
  );
  const guardarEtiqueta = React.useCallback((label: string, valor: string) => {
    etiquetas.current[label] = valor;
  }, []);

  const params = React.useMemo<ParamsReporte>(() => {
    const ccContexto = centroCosto?.cod_cc == null ? "" : String(centroCosto.cod_cc);
    const todos: ParamsReporte = {
      fecha_inicio: fechas.inicio,
      fecha_fin: fechas.fin,
      cod_empresa: empresa?.cod_empresa == null ? "" : String(empresa.cod_empresa),
      cod_cc: ccContexto,
      ...valores,
    };
    // Vacío = sin filtro: no se envía.
    return Object.fromEntries(Object.entries(todos).filter(([, v]) => v !== ""));
  }, [fechas, empresa?.cod_empresa, centroCosto?.cod_cc, valores]);

  const faltanFechas = modoFechas === "requeridas" && (!fechas.inicio || !fechas.fin);
  const consulta = useQuery({
    ...CACHE_DYNAMIC,
    queryKey: ["reportes", definicion.nomenclatura, params] as const,
    queryFn: () => definicion.consultar(params),
    enabled: hidratado && !faltanFechas,
  });
  const filas = consulta.data ?? SIN_FILAS;

  const resumen = React.useMemo(
    () => calcularResumen(filas, definicion.columnas, config),
    [filas, definicion.columnas, config],
  );

  // ── Descargas ──
  const pdf = usePdfReporte();
  const [generandoExcel, setGenerandoExcel] = React.useState(false);
  const [errorExcel, setErrorExcel] = React.useState<string | null>(null);
  const sinDatos = filas.length === 0;

  const encabezado = (): Record<string, string> => {
    const periodo =
      fechas.inicio || fechas.fin
        ? `${fechaVisible(fechas.inicio) || "…"} al ${fechaVisible(fechas.fin) || "…"}`
        : "";
    const campos: Record<string, string> = {
      Período: periodo,
      Empresa: empresa?.nombre_emp ?? empresa?.nom_emp ?? "",
      "Centro de costo": centroCosto?.nombre_cc ?? centroCosto?.nom_cc ?? "",
      ...etiquetas.current,
    };
    return Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== ""));
  };

  const descargarPdf = () => {
    pdf.generar({
      titulo,
      archivo: `${nombreArchivo(titulo)}.pdf`,
      horizontal: true,
      header: encabezado(),
      contenido: bloquesPdf(tablaResumen(resumen), tablaDetalle(filas, definicion.columnas)),
    });
  };

  const descargarXlsx = async () => {
    setGenerandoExcel(true);
    setErrorExcel(null);
    try {
      await descargarExcel({
        titulo,
        encabezado: encabezado(),
        resumen: tablaResumen(resumen),
        detalle: tablaDetalle(filas, definicion.columnas),
      });
    } catch (causa) {
      setErrorExcel(causa instanceof Error ? causa.message : "No se pudo generar el Excel.");
    } finally {
      setGenerandoExcel(false);
    }
  };

  const error = pdf.error ?? errorExcel;
  const Contenido = definicion.Contenido ?? TablaReporte;
  const requeridas = modoFechas === "requeridas";

  return (
    <div className="space-y-5">
      <TituloReporte titulo={titulo} />

      {/* ── Filtros y configuración ── */}
      <Panel>
        <Accordion type="single" collapsible defaultValue="filtros">
          <AccordionItem value="filtros" className="border-none">
            <AccordionTrigger className="p-0 hover:no-underline [&>svg]:hidden">
              <EncabezadoPanel
                icono={<Filter />}
                titulo="Filtros y configuración"
                accion={<ChevronDown className="size-5 shrink-0 text-primary" />}
              />
            </AccordionTrigger>
            <AccordionContent className="space-y-5 p-4">
              {modoFechas === "ninguna" ? null : (
                <div className="grid gap-4 md:grid-cols-2">
                  <CampoFecha
                    id="fecha-inicio"
                    label="Fecha inicial"
                    value={fechas.inicio}
                    max={fechas.fin}
                    requerida={requeridas}
                    onChange={(inicio) => setFechas((f) => ({ ...f, inicio }))}
                  />
                  <CampoFecha
                    id="fecha-fin"
                    label="Fecha final"
                    value={fechas.fin}
                    min={fechas.inicio}
                    requerida={requeridas}
                    onChange={(fin) => setFechas((f) => ({ ...f, fin }))}
                  />
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Panel>
                  <EncabezadoPanel
                    icono={<SlidersHorizontal />}
                    titulo="Personaliza tu reporte"
                    subtitulo="Define cómo se agrupan y desglosan los datos"
                  />
                  <PersonalizaReporte
                    columnas={definicion.columnas}
                    config={config}
                    onChange={setConfig}
                  />
                </Panel>

                <Panel>
                  <EncabezadoPanel
                    icono={<Filter />}
                    titulo="Filtros"
                    subtitulo="Acota el universo de datos a analizar"
                  />
                  <div className="flex flex-col gap-3 p-4">
                    {(definicion.filtros ?? []).map((filtro) => (
                      <CampoFiltro
                        key={filtro.id}
                        filtro={filtro}
                        valores={valores}
                        onChange={cambiarFiltro}
                        onEtiqueta={guardarEtiqueta}
                      />
                    ))}

                    {/* Descargas: al final de los filtros */}
                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                      <Button
                        type="button"
                        className="gap-1.5 bg-red-600 text-white hover:bg-red-700"
                        disabled={pdf.generando || sinDatos}
                        onClick={descargarPdf}
                      >
                        {pdf.generando ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <FileText className="size-4" />
                        )}
                        {pdf.generando ? "Generando PDF..." : "PDF"}
                      </Button>
                      <Button
                        type="button"
                        className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
                        disabled={generandoExcel || sinDatos}
                        onClick={descargarXlsx}
                      >
                        {generandoExcel ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="size-4" />
                        )}
                        {generandoExcel ? "Generando Excel..." : "Excel"}
                      </Button>
                    </div>
                    {error ? (
                      <p role="alert" className="text-right text-sm text-destructive">
                        {error}
                      </p>
                    ) : null}
                  </div>
                </Panel>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Panel>

      {/* ── Resumen agrupado ── */}
      <Panel>
        <EncabezadoPanel
          icono={<Table2 />}
          titulo="Resumen agrupado"
          subtitulo="Agrupado según «Personaliza tu reporte»"
        />
        <div className="p-4">
          {consulta.isLoading ? (
            <MensajeVacio>Cargando…</MensajeVacio>
          ) : (
            <TablaResumen resumen={resumen} />
          )}
        </div>
      </Panel>

      {/* ── Reporte ── */}
      <Panel>
        <EncabezadoPanel icono={<Table2 />} titulo="Reporte" subtitulo={definicion.descripcion} />
        <div className="p-4">
          {faltanFechas ? (
            <MensajeVacio>Seleccione la fecha inicial y la final.</MensajeVacio>
          ) : consulta.isError ? (
            <MensajeVacio>
              No se pudo consultar el reporte: {consulta.error.message}{" "}
              <Button type="button" variant="link" onClick={() => consulta.refetch()}>
                Reintentar
              </Button>
            </MensajeVacio>
          ) : consulta.isLoading ? (
            <MensajeVacio>Cargando…</MensajeVacio>
          ) : (
            <Contenido filas={filas} columnas={definicion.columnas} params={params} />
          )}
        </div>
      </Panel>
    </div>
  );
}
