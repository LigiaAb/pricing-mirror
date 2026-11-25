"use client";

import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Search,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import React from "react";
import { usePdfReporte } from "@/features/pricing/reportes";
import { TablaDouble } from "@/features/pricing/shared";
import { useContextoOperativoStore, usePermisosCategoria } from "@/features/shell";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { useExcelJS } from "@/shared/hooks/use-dynamic-libraries";
import type { FiltroReporte, ParamsReporte, Reporte, ValoresFiltros } from "../lib/definir-reporte";
import {
  bloquesPdf,
  descargarExcelAgrupado,
  descargarExcelReporte,
  nombreArchivo,
  tablaDetalle,
  tablaResumen,
} from "../lib/exportar";
import { FILTROS_EMPRESA_CC } from "../lib/filtros";
import {
  type ConfiguracionResumen,
  calcularResumen,
  camposAgrupables,
} from "../lib/resumen-agrupado";
import { CampoFecha, CampoMultiSelect, CampoSelect } from "./campos";
import { TablaReporte } from "./contenido-reporte";
import { EncabezadoPanel, MensajeVacio, Panel, TituloReporte } from "./panel";
import { PersonalizaReporte } from "./personaliza-reporte";

const SIN_FILAS: readonly unknown[] = [];
/** Opción de permisos de la pantalla de reportes (acción "Filtrar Empresa Centro Costo"). */
const OPCION_PERMISOS_REPORTES = "Reportes";
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
  const etiqueta = !valor
    ? ""
    : filtro.multiple
      ? // Como Reportes CRM: los nombres en el orden de las opciones, separados por ", ".
        opciones
          .filter((o) => valor.split(",").includes(o.value))
          .map((o) => o.label)
          .join(", ")
      : (opciones.find((o) => o.value === valor)?.label ?? valor);

  // El valor inicial (ej. CC del contexto) pasa a los filtros cuando llega.
  React.useEffect(() => {
    if (valores[filtro.id] === undefined && inicial) onChange(filtro.id, inicial);
  }, [valores, filtro.id, inicial, onChange]);

  // Nombre de lo elegido, para el encabezado del PDF y del Excel.
  React.useEffect(() => {
    onEtiqueta(filtro.label, String(etiqueta));
  }, [onEtiqueta, filtro.label, etiqueta]);

  if (filtro.multiple) {
    return (
      <CampoMultiSelect
        id={`filtro-${filtro.id}`}
        label={filtro.label}
        value={valor}
        onChange={(nuevo) => onChange(filtro.id, nuevo)}
        opciones={opciones}
      />
    );
  }
  return (
    <CampoSelect
      id={`filtro-${filtro.id}`}
      label={filtro.requerido ? `${filtro.label} *` : filtro.label}
      value={valor}
      onChange={(nuevo) => onChange(filtro.id, nuevo)}
      opciones={opciones}
      cargando={cargando}
      placeholder={filtro.requerido ? "Seleccione una opción" : "Todos"}
      limpiable={!filtro.requerido}
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
  // Como Tarifas y Cotizaciones: con el permiso se eligen empresa y CC; sin él, los del contexto.
  const { puedeFiltrarEmpresaCentroCosto: conPermiso } =
    usePermisosCategoria(OPCION_PERMISOS_REPORTES);
  const usaEmpresaCc = definicion.empresaCentroCosto !== false;
  const puedeFiltrarEmpresaCentroCosto = usaEmpresaCc && conPermiso;
  const filtros = React.useMemo(
    () => [
      ...(puedeFiltrarEmpresaCentroCosto ? FILTROS_EMPRESA_CC : []),
      ...(definicion.filtros ?? []),
    ],
    [puedeFiltrarEmpresaCentroCosto, definicion.filtros],
  );

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
  const campos = React.useMemo(() => camposAgrupables(definicion.columnas), [definicion.columnas]);
  const [config, setConfig] = React.useState<ConfiguracionResumen>(() => ({
    niveles: campos.filter((c) => definicion.agrupacion?.filas?.includes(c.campo)),
    columna: definicion.agrupacion?.columna ?? "",
  }));

  const cambiarFiltro = React.useCallback(
    (id: string, valor: string) => {
      setValores((actuales) => {
        const nuevos = { ...actuales, [id]: valor };
        // Se limpian los que dependen de este, y los que dependen de esos (empresa → CC → asesor).
        const limpiar = (cambiado: string) => {
          for (const f of filtros) {
            if (!f.depende?.includes(cambiado) || nuevos[f.id] === "") continue;
            nuevos[f.id] = "";
            limpiar(f.id);
          }
        };
        limpiar(id);
        return nuevos;
      });
    },
    [filtros],
  );
  const guardarEtiqueta = React.useCallback((label: string, valor: string) => {
    etiquetas.current[label] = valor;
  }, []);

  /** Valores que se usan: con el permiso, los elegidos (o el contexto); sin él, el contexto. */
  const efectivos = React.useMemo<ValoresFiltros>(() => {
    if (!usaEmpresaCc) return valores;
    const contexto = {
      cod_empresa: empresa?.cod_empresa == null ? "" : String(empresa.cod_empresa),
      cod_cc: centroCosto?.cod_cc == null ? "" : String(centroCosto.cod_cc),
    };
    return puedeFiltrarEmpresaCentroCosto
      ? { ...contexto, ...valores }
      : { ...valores, ...contexto };
  }, [
    empresa?.cod_empresa,
    centroCosto?.cod_cc,
    valores,
    puedeFiltrarEmpresaCentroCosto,
    usaEmpresaCc,
  ]);

  const params = React.useMemo<ParamsReporte>(() => {
    const todos: ParamsReporte = {
      fecha_inicio: fechas.inicio,
      fecha_fin: fechas.fin,
      ...efectivos,
    };
    // Vacío = sin filtro: no se envía.
    return Object.fromEntries(Object.entries(todos).filter(([, v]) => v !== ""));
  }, [fechas, efectivos]);

  const faltanFechas = modoFechas === "requeridas" && (!fechas.inicio || !fechas.fin);
  /** Filtros obligatorios sin valor: no se puede consultar. */
  const faltanFiltros = filtros.filter((f) => f.requerido && !efectivos[f.id]).map((f) => f.label);

  /** Lo último que se pidió con "Consultar": parámetros y encabezado de las descargas. */
  const [consultada, setConsultada] = React.useState<{
    params: ParamsReporte;
    encabezado: Record<string, string>;
  } | null>(null);
  const consulta = useQuery({
    ...CACHE_DYNAMIC,
    queryKey: ["reportes", definicion.nomenclatura, consultada?.params] as const,
    queryFn: () => definicion.consultar(consultada?.params ?? {}),
    // Solo con el botón "Consultar" (no al cambiar fechas o filtros).
    enabled: consultada !== null,
  });
  const filas = consulta.data ?? SIN_FILAS;

  const resumen = React.useMemo(
    () => calcularResumen(filas, definicion.columnas, config),
    [filas, definicion.columnas, config],
  );

  // ── Descargas ──
  const pdf = usePdfReporte();
  /** Descarga que se está generando (el PDF genérico lleva su propio estado en `pdf`). */
  const [generando, setGenerando] = React.useState<"pdf" | "excel" | "agrupado" | null>(null);
  const [errorDescarga, setErrorDescarga] = React.useState<string | null>(null);
  const sinDatos = filas.length === 0;
  const descargas = definicion.descargas ?? {};

  const { loadExcelJS } = useExcelJS();
  const tablaAgrupada = () => tablaResumen(resumen, config.niveles);

  const encabezado = (): Record<string, string> => {
    const periodo =
      fechas.inicio || fechas.fin
        ? `${fechaVisible(fechas.inicio) || "…"} al ${fechaVisible(fechas.fin) || "…"}`
        : "";
    const campos: Record<string, string> = {
      Período: periodo,
      Empresa: usaEmpresaCc ? (empresa?.nombre_emp ?? empresa?.nom_emp ?? "") : "",
      "Centro de costo": usaEmpresaCc ? (centroCosto?.nombre_cc ?? centroCosto?.nom_cc ?? "") : "",
      ...etiquetas.current,
    };
    return Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== ""));
  };

  const consultar = () => {
    // Con "Consultar" de nuevo y los mismos filtros, se vuelve a pedir al backend.
    if (consultada && JSON.stringify(consultada.params) === JSON.stringify(params)) {
      void consulta.refetch();
      return;
    }
    setConsultada({ params, encabezado: encabezado() });
  };

  // Encabezado de las descargas: los filtros de la consulta, no los que se cambiaron después.
  /**
   * Encabezado del Excel agrupado, como el de pricing: filtros de la consulta (período en
   * `dd-MM-yyyy al dd-MM-yyyy`, "Centro de Costo") + "Agrupado por" y "Columnas".
   */
  const encabezadoAgrupado = (): Record<string, string> => {
    const { fecha_inicio: inicio, fecha_fin: fin } = consultada?.params ?? {};
    const fechaPricing = (iso: string | undefined) =>
      iso ? format(parseISO(iso), "dd-MM-yyyy") : "…";
    const filtrosConsulta = Object.entries(consultada?.encabezado ?? {}).map(([campo, valor]) =>
      campo === "Período"
        ? [campo, `${fechaPricing(inicio)} al ${fechaPricing(fin)}`]
        : [campo === "Centro de costo" ? "Centro de Costo" : campo, valor],
    );
    const columna = campos.find((c) => c.campo === config.columna)?.etiqueta;
    return {
      ...Object.fromEntries(filtrosConsulta),
      "Agrupado por": tablaAgrupada().columnasNivel.join(" > "),
      ...(columna ? { Columnas: columna } : {}),
    };
  };

  const generarDescarga = async (
    cual: "pdf" | "excel" | "agrupado",
    generar: () => Promise<void>,
  ) => {
    setGenerando(cual);
    setErrorDescarga(null);
    try {
      await generar();
    } catch (causa) {
      setErrorDescarga(causa instanceof Error ? causa.message : "No se pudo generar el archivo.");
    } finally {
      setGenerando(null);
    }
  };

  /** Lo que reciben las descargas propias de la definición. */
  const descarga = () => ({
    filas,
    titulo,
    encabezado: consultada?.encabezado ?? {},
    params: consultada?.params ?? {},
  });

  // PDF del reporte (si lo tiene): el propio de la definición o el detalle con las columnas.
  const descargarPdf = () => {
    const propio = descargas.pdf;
    if (typeof propio === "function") {
      void generarDescarga("pdf", () => propio(descarga()));
      return;
    }
    pdf.generar({
      titulo,
      archivo: `${nombreArchivo(titulo)}.pdf`,
      horizontal: true,
      header: consultada?.encabezado ?? {},
      contenido: bloquesPdf(tablaDetalle(filas, definicion.columnas)),
    });
  };

  // Excel del reporte (si lo tiene): el propio de la definición o el detalle con las columnas.
  const descargarXlsx = () => {
    const propio = descargas.excel;
    return generarDescarga("excel", () =>
      typeof propio === "function"
        ? propio(descarga())
        : descargarExcelReporte({
            titulo,
            encabezado: consultada?.encabezado ?? {},
            detalle: tablaDetalle(filas, definicion.columnas),
          }),
    );
  };

  // Excel agrupado (siempre): el Resumen agrupado, como el Excel de Reportes de pricing.
  const descargarXlsxAgrupado = () =>
    generarDescarga("agrupado", () =>
      descargarExcelAgrupado({
        titulo,
        encabezado: encabezadoAgrupado(),
        resumen: tablaAgrupada(),
        cargarExcel: loadExcelJS,
        fechaInicio: consultada?.params.fecha_inicio,
        fechaFin: consultada?.params.fecha_fin,
      }),
    );

  const error = pdf.error ?? errorDescarga;
  const generandoPdf = pdf.generando || generando === "pdf";
  const Contenido = definicion.Contenido ?? TablaReporte;
  const requeridas = modoFechas === "requeridas";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
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
                  <PersonalizaReporte campos={campos} config={config} onChange={setConfig} />
                </Panel>

                <Panel>
                  <EncabezadoPanel
                    icono={<Filter />}
                    titulo="Filtros"
                    subtitulo="Acota el universo de datos a analizar"
                  />
                  <div className="flex flex-col gap-3 p-4">
                    {filtros.map((filtro) => (
                      <CampoFiltro
                        key={filtro.id}
                        filtro={filtro}
                        valores={efectivos}
                        onChange={cambiarFiltro}
                        onEtiqueta={guardarEtiqueta}
                      />
                    ))}

                    {/* Consultar y descargas: al final de los filtros */}
                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                      <Button
                        type="button"
                        className="gap-1.5"
                        disabled={
                          !hidratado ||
                          faltanFechas ||
                          faltanFiltros.length > 0 ||
                          consulta.isFetching
                        }
                        onClick={consultar}
                      >
                        {consulta.isFetching ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Search className="size-4" />
                        )}
                        {consulta.isFetching ? "Consultando..." : "Consultar"}
                      </Button>
                      {descargas.pdf ? (
                        <Button
                          type="button"
                          className="gap-1.5 bg-red-600 text-white hover:bg-red-700"
                          disabled={generandoPdf || sinDatos}
                          onClick={descargarPdf}
                        >
                          {generandoPdf ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <FileText className="size-4" />
                          )}
                          {generandoPdf ? "Generando PDF..." : "PDF"}
                        </Button>
                      ) : null}
                      {descargas.excel ? (
                        <Button
                          type="button"
                          className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
                          disabled={generando !== null || sinDatos}
                          onClick={descargarXlsx}
                        >
                          {generando === "excel" ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <FileSpreadsheet className="size-4" />
                          )}
                          {generando === "excel" ? "Generando Excel..." : "Excel"}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-1.5 border-green-600 text-green-700 hover:bg-green-50"
                        disabled={generando !== null || sinDatos}
                        onClick={descargarXlsxAgrupado}
                        title="Excel del Resumen agrupado"
                      >
                        {generando === "agrupado" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="size-4" />
                        )}
                        {generando === "agrupado" ? "Generando Excel..." : "Excel agrupado"}
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
          {consultada === null ? (
            <MensajeVacio>Pulse «Consultar» para cargar el reporte.</MensajeVacio>
          ) : consulta.isLoading ? (
            <MensajeVacio>Cargando…</MensajeVacio>
          ) : resumen.data.length === 0 ? (
            <MensajeVacio>No hay datos para agrupar.</MensajeVacio>
          ) : (
            <TablaDouble
              // Se vuelve a montar al cambiar datos o agrupación para expandir el total general.
              key={`${consulta.dataUpdatedAt}-${config.columna}-${config.niveles.map((n) => n.campo).join(",")}`}
              data={resumen.data}
              columns={resumen.columnas}
              rowKey="id"
              showTotals={false}
              mostrarColumnaTotal={false}
              mostrarTotalesPie={false}
              firstColumnWidth={280}
              nivelExpandidoInicial={1}
            />
          )}
        </div>
      </Panel>

      {/* ── Reporte ── */}
      <Panel>
        <EncabezadoPanel icono={<Table2 />} titulo="Reporte" subtitulo={definicion.descripcion} />
        <div className="p-4">
          {consultada === null ? (
            <MensajeVacio>
              {faltanFechas
                ? "Seleccione la fecha inicial y la final y pulse «Consultar»."
                : faltanFiltros.length
                  ? `Seleccione ${faltanFiltros.join(", ")} y pulse «Consultar».`
                  : "Pulse «Consultar» para cargar el reporte."}
            </MensajeVacio>
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
            <Contenido filas={filas} columnas={definicion.columnas} params={consultada.params} />
          )}
        </div>
      </Panel>
    </div>
  );
}
