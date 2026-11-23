"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  ChartColumnBig,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Settings2,
  Table2Icon,
  X,
} from "lucide-react";
import React from "react";
import {
  centrosCosto,
  type EmpleadoUsuario,
  empleadosUsuarios,
  type Tipo,
  tipos,
} from "@/features/catalogos";
import { Panel, SectionHeader } from "@/features/pricing/shared";
import { buscarClientesTarifa } from "@/features/pricing/tarifas";
import { useContextoOperativoStore } from "@/features/shell";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { Combobox, type ComboboxOption } from "@/shared/components/ui/combobox";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { cn } from "@/shared/lib/utils";
import type { ConfiguracionReporte, Filtros, SelectOption } from "../lib/filtros-types";
import { type CampoKpi, NIVELES_DEFECTO_KPI } from "../lib/tabla-kpi";
import { HitRate } from "./hit-rate";
import RealizacionDePrecio from "./realizacion-de-precio";
import { ConfiguracionTablaKpi, TablaKpi } from "./tabla-kpi";

const hoy = new Date();

const inicioDeSemana = format(startOfMonth(hoy), "yyyy-MM-dd");
const finDeSemana = format(endOfMonth(hoy), "yyyy-MM-dd");

export const REPORTES_CRM: readonly ConfiguracionReporte[] = [
  {
    value: "seleccione",
    label: "Seleccione una opcion",
    descripcion: "Seleccione un reporte para ver los filtros y resultados",
    campos: {},
    vista: "seleccione",
  },
  {
    value: "hit-rate",
    label: "HIT RATE (HR)",
    vista: "hit-rate",
    descripcion: "Reporte de hit rate, con filtros de fechas y estado de cotización",
    campos: {
      tipoTransporte: true,
      usuario: true,
      tipoPago: true,
      fechas: "opcionales",
      departamento: true,
      servicio: true,
    },
    graficas: true,
  },
  {
    value: "realizacion-de-precio",
    label: "Realizacion de Precio (RdP)",
    vista: "realizacion-de-precio",
    descripcion: "Reporte de realización de precio, con filtros de fechas y estado de cotización",
    campos: {
      fechas: "opcionales",
      cliente: true,
      tipoPago: true,
      usuario: true,
      departamento: true,
      servicio: true,
    },
    tabla: true,
    graficas: true,
  },
];

const formatearTipos = (array: Tipo[]): SelectOption[] =>
  array.map((i) => ({ ...i, value: i.codTipo, label: i.nomTipo }));
/** Un usuario por código (conserva el primero), en O(n). */
const formatearUsuarios = (array: EmpleadoUsuario[]): SelectOption[] => {
  const vistos = new Set<unknown>();
  const usuarios: SelectOption[] = [];
  for (const i of array) {
    if (vistos.has(i.codUsuario)) continue;
    vistos.add(i.codUsuario);
    usuarios.push({ ...i, value: i.codUsuario, label: i.nombreCompleto });
  }
  return usuarios;
};

/** Cliente por nombre (mín. 2 letras), con la búsqueda de Tarifas; `value` = ENTIDAD_ID. */
const buscarClientes = async (busqueda: string): Promise<SelectOption[]> =>
  (await buscarClientesTarifa(busqueda)).map((c) => ({
    value: c.entidad_id,
    label: c.entidad_nombre,
  }));

/** Valor del Combobox de departamento cuando no hay centro de costo (todos). */
const TODOS_LOS_DEPARTAMENTOS = "__todos__";

export function ListaReportes() {
  const currentCentroCosto = useContextoOperativoStore((state) => state.currentCentroCosto);
  const currentEmpresa = useContextoOperativoStore((state) => state.currentEmpresa);
  const tiposTransporteFetch = tipos.useLista({ tipo_tabla: "TRANSPORTE" });
  const tiposPagoFetch = tipos.useLista({ tipo_tabla: "PAGO" });
  const centrosCostoFetch = centrosCosto.useLista();

  const transportes: SelectOption[] = React.useMemo(
    () => formatearTipos(tiposTransporteFetch.data ?? []),
    [tiposTransporteFetch.data],
  );
  const tiposPago: SelectOption[] = React.useMemo(
    () => formatearTipos(tiposPagoFetch.data ?? []),
    [tiposPagoFetch.data],
  );
  const codEmpresa = React.useMemo(
    () =>
      (currentEmpresa && {
        nombre: currentEmpresa.nombre_emp ?? "",
        codigo: currentEmpresa.cod_empresa,
      }) ??
      undefined,
    [currentEmpresa],
  );

  const codCc = React.useMemo(
    () =>
      (currentCentroCosto && {
        nombre: currentCentroCosto.nombre_cc ?? "",
        codigo: currentCentroCosto.cod_cc,
      }) ??
      undefined,
    [currentCentroCosto],
  );

  const defaultFiltros: Partial<Filtros> = {
    // formato yyyy-mm-dd
    reporte: REPORTES_CRM[0] as SelectOption,
    cod_empresa: codEmpresa,
    cod_cc: codCc,
    cod_tipo_transporte: null,
    cod_usuario: null,
    cod_cliente: null,
    cod_tipo_pago: null,
  };

  const [filtros, setFiltros] = React.useState<Filtros>({
    ...defaultFiltros,
    fecha_inicio: inicioDeSemana,
    fecha_fin: finDeSemana,
  } as Filtros);

  // Usuarios del departamento elegido (sin departamento: todos).
  const usuariosFetch = empleadosUsuarios.useLista({ cod_cc: filtros.cod_cc?.codigo });
  const usuarios: SelectOption[] = React.useMemo(
    () => formatearUsuarios(usuariosFetch.data ?? []),
    [usuariosFetch.data],
  );

  // Departamentos (centros de costo) de la empresa actual.
  const departamentos: ComboboxOption[] = React.useMemo(
    () => [
      { value: TODOS_LOS_DEPARTAMENTOS, label: "Todos" },
      ...(centrosCostoFetch.data ?? [])
        .filter((cc) => String(cc.codEmpresaCc) === String(currentEmpresa?.cod_empresa))
        .map((cc) => ({ value: String(cc.codCc), label: cc.nombreCc })),
    ],
    [centrosCostoFetch.data, currentEmpresa?.cod_empresa],
  );

  const [descargar, setDescargar] = React.useState(0);
  const [errorPdf, setErrorPdf] = React.useState<string | null>(null);
  const [generandoPdf, setGenerandoPdf] = React.useState(false);
  const [exportarExcel, setExportarExcel] = React.useState(0);
  const [generandoExcel, setGenerandoExcel] = React.useState(false);
  // Configuración de la tabla dinámica ("Personaliza tu reporte")
  const [nivelesKpi, setNivelesKpi] = React.useState<CampoKpi[]>(NIVELES_DEFECTO_KPI);
  const [campoColumnaKpi, setCampoColumnaKpi] = React.useState("");

  const reporte = React.useMemo(() => filtros.reporte?.value, [filtros.reporte]);

  const reporteSeleccionado = React.useMemo(
    () => REPORTES_CRM.find((r) => r.value === reporte),
    [reporte],
  );

  const onInput = <K extends keyof Filtros>({ id, val }: { id: K; val: Filtros[K] }) => {
    setFiltros((filtros) => ({
      ...filtros,
      [id]: val,
    }));
  };

  function renderSelectCatalogo<T extends SelectOption>({
    id,
    label,
    options,
    className,
    esObligatorio = false,
    esLectura = false,
    esVisible = true,
  }: {
    id: keyof Filtros;
    label: string;
    options?: T[];
    className?: string;
    esObligatorio?: boolean;
    esLectura?: boolean;
    esVisible?: boolean;
  }) {
    const idGenerado = id;
    const opciones = options ?? [];
    const value = (filtros[id] as T | null | undefined) ?? null;
    const valorSeleccionado = value?.value == null ? "__NULL_OPTION__" : String(value.value);
    const opcionesCombobox: ComboboxOption[] = opciones.map((option) => ({
      value: option.value == null ? "__NULL_OPTION__" : String(option.value),
      label: String(option.label ?? ""),
    }));

    return (
      <Field className={cn("flex flex-col", className, !esVisible && "hidden")}>
        <FieldLabel htmlFor={idGenerado}>
          {label}
          {esObligatorio ? " *" : ""}
        </FieldLabel>

        <div className="relative">
          <Combobox
            value={value == null ? "" : valorSeleccionado}
            onChange={(nextValue) => {
              const nextOption =
                opciones.find(
                  (option) =>
                    (option.value == null ? "__NULL_OPTION__" : String(option.value)) === nextValue,
                ) ?? null;
              onInput({ id, val: nextOption });
            }}
            options={opcionesCombobox}
            placeholder="Seleccione..."
            disabled={esLectura}
            className={value != null && !esLectura ? "pr-16" : ""}
            popoverClassName="z-[9999]"
          />

          {value != null && !esLectura ? (
            <button
              type="button"
              aria-label={`Limpiar ${label}`}
              title="Limpiar"
              className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-destructive"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onInput({ id, val: null });
              }}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </Field>
    );
  }

  const renderizarDate = ({
    id,
    label,
    className,
    min,
    max,
  }: {
    id: "fecha_inicio" | "fecha_fin";
    label: string;
    className?: string;
    min?: string;
    max?: string;
  }) => (
    <Field className={cn("w-full", className)}>
      <FieldLabel htmlFor={id}>{label} *</FieldLabel>
      <input
        id={id}
        type="date"
        className="h-9 w-full rounded-md border bg-card px-2"
        value={filtros[id]}
        min={min}
        max={max}
        onChange={(event) => {
          // Fechas requeridas: no se deja vaciar.
          if (event.target.value) onInput({ id, val: event.target.value });
        }}
      />
    </Field>
  );

  React.useEffect(() => {
    setFiltros((filtros) => ({
      ...filtros,
      cod_tipo_transporte: transportes[0] ?? null,
    }));
  }, [transportes]);

  React.useEffect(() => {
    setFiltros((filtros) => ({
      ...filtros,
      cod_empresa: codEmpresa,
      cod_cc: codCc,
    }));
  }, [codEmpresa, codCc]);

  return (
    <section className="w-full max-h-[85vh] overflow-auto bg-surface-1 p-4 md:p-6 space-y-5 relative">
      {/* ── Filtros requeridos: Tipo de Seguimiento + Desde + Hasta, misma fila ── */}
      <Panel>
        <SectionHeader
          icon={<Filter className="w-4 h-4" />}
          title="Filtros requeridos"
          subtitle="Tipo de seguimiento y rango de fechas para consultar el reporte."
        />
        <div className="p-5 flex flex-col sm:flex-row sm:items-end gap-x-4">
          <div className="w-full sm:w-1/3">
            {renderSelectCatalogo({
              id: "reporte",
              label: "Reportes",
              options: REPORTES_CRM as unknown as SelectOption[],
            })}
          </div>

          <div className="w-full sm:w-1/3">
            {renderizarDate({
              id: "fecha_inicio",
              label: "Fecha de inicio",
              max: filtros.fecha_fin,
            })}
          </div>

          <div className="w-full sm:w-1/3">
            {renderizarDate({ id: "fecha_fin", label: "Fecha final", min: filtros.fecha_inicio })}
          </div>

          <div className="w-full sm:w-1/3">
            <div className="flex gap-2">
              <Button
                type="button"
                className="gap-1.5 bg-red-600 text-white hover:bg-red-700"
                disabled={generandoPdf || reporte === "seleccione"}
                onClick={() => {
                  setErrorPdf(null);
                  setDescargar((p) => p + 1);
                }}
              >
                {generandoPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {generandoPdf ? "Generando PDF..." : "PDF"}
              </Button>
              {(reporte === "hit-rate" || reporte === "realizacion-de-precio") && (
                <Button
                  type="button"
                  className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
                  disabled={generandoExcel}
                  onClick={() => {
                    setErrorPdf(null);
                    setExportarExcel((p) => p + 1);
                  }}
                >
                  {generandoExcel ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  {generandoExcel ? "Generando Excel..." : "Excel"}
                </Button>
              )}
            </div>
            {errorPdf ? (
              <p role="alert" className="text-sm text-destructive">
                {errorPdf}
              </p>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel>
        <Accordion type="single" collapsible defaultValue="filtros">
          <AccordionItem value="filtros" className="border-none">
            <AccordionTrigger className="bg-brand-50 hover:no-underline [&>svg]:hidden p-0">
              <div className="flex items-center justify-between w-full pr-5">
                <SectionHeader
                  icon={
                    <span className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <Settings2 className="w-4 h-4" />
                    </span>
                  }
                  title={"Filtros y Configuración"}
                  subtitle={""}
                />
                <ChevronDown className="w-4 h-4 text-primary transition-transform duration-200 shrink-0" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-4 w-full flex flex-row gap-2">
              <Panel className="w-full">
                <SectionHeader
                  icon={
                    <span className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                    </span>
                  }
                  title={"Personaliza tu reporte"}
                  subtitle={"Define cómo se agrupan y desglosan los datos"}
                />
                {(reporte === "hit-rate" || reporte === "realizacion-de-precio") && (
                  <ConfiguracionTablaKpi
                    niveles={nivelesKpi}
                    campoColumna={campoColumnaKpi}
                    onNivelesChange={setNivelesKpi}
                    onCampoColumnaChange={setCampoColumnaKpi}
                  />
                )}
              </Panel>
              <Panel className="w-full">
                <SectionHeader
                  icon={
                    <span className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                    </span>
                  }
                  title={"Filtros"}
                  subtitle={"Acota el universo de seguimientos a analizar"}
                />
                <div className="p-2">
                  {reporteSeleccionado?.campos.departamento && (
                    <Field className="flex flex-col">
                      <FieldLabel htmlFor="filtro-departamento">Departamento</FieldLabel>
                      <Combobox
                        value={
                          filtros.cod_cc ? String(filtros.cod_cc.codigo) : TODOS_LOS_DEPARTAMENTOS
                        }
                        onChange={(valor) => {
                          const cc = departamentos.find((d) => d.value === valor);
                          // Al cambiar de departamento, el usuario elegido puede no pertenecer a él.
                          setFiltros((f) => ({
                            ...f,
                            cod_usuario: null,
                            cod_cc:
                              !cc || cc.value === TODOS_LOS_DEPARTAMENTOS
                                ? undefined
                                : { nombre: String(cc.label), codigo: Number(cc.value) },
                          }));
                        }}
                        options={departamentos}
                        placeholder="Seleccione..."
                        popoverClassName="z-[9999]"
                      />
                    </Field>
                  )}
                  {reporteSeleccionado?.campos.cliente && (
                    <Field className="flex flex-col">
                      <FieldLabel htmlFor="filtro-cliente">Cliente</FieldLabel>
                      <AsyncComboboxInput<SelectOption>
                        id="filtro-cliente"
                        value={filtros.cod_cliente ?? null}
                        onChange={(valor) => onInput({ id: "cod_cliente", val: valor })}
                        fetchOptions={buscarClientes}
                        minSearchLength={2}
                        fetchOnEmpty={false}
                        getOptionValue={(opcion) => opcion.value}
                        getOptionLabel={(opcion) => String(opcion.label)}
                        placeholder="Todos"
                        searchPlaceholder="Buscar cliente..."
                        contentClassName="z-[9999]"
                        clearable
                      />
                    </Field>
                  )}
                  {reporteSeleccionado?.campos.usuario &&
                    renderSelectCatalogo({
                      id: "cod_usuario",
                      label: "Usuario",
                      options: usuarios,
                    })}
                  {reporteSeleccionado?.campos.tipoPago &&
                    renderSelectCatalogo({
                      id: "cod_tipo_pago",
                      label: "Tipo de Pago",
                      options: tiposPago,
                    })}
                  {reporteSeleccionado?.campos.servicio &&
                    renderSelectCatalogo({
                      id: "cod_servicio",
                      label: "Servicio (solo resumen agrupado)",
                      options: transportes,
                    })}
                </div>
              </Panel>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Panel>

      {/* Una sola instancia recibe la descarga; las vistas visibles no generan el PDF. */}
      {reporte === "hit-rate" && (
        <HitRate
          filtros={filtros}
          tipo="descarga"
          descargar={descargar}
          onErrorPdf={setErrorPdf}
          onGenerandoPdf={setGenerandoPdf}
        />
      )}
      {reporte === "realizacion-de-precio" && (
        <RealizacionDePrecio
          filtros={filtros}
          tipo="descarga"
          descargar={descargar}
          onErrorPdf={setErrorPdf}
          onGenerandoPdf={setGenerandoPdf}
        />
      )}
      {(reporte === "hit-rate" || reporte === "realizacion-de-precio") && (
        <Panel key={`resumen-agrupado-${reporte}`}>
          <SectionHeader
            icon={<Table2Icon className="w-4 h-4" />}
            title="Resumen agrupado"
            subtitle="Agrupado según «Personaliza tu reporte»"
          />
          <div className="p-4">
            <TablaKpi
              filtros={filtros}
              reporte={reporte === "hit-rate" ? "hit_rate" : "realizacion_de_precio"}
              niveles={nivelesKpi}
              campoColumna={campoColumnaKpi}
              exportar={exportarExcel}
              onExportando={setGenerandoExcel}
              onError={setErrorPdf}
            />
          </div>
        </Panel>
      )}
      {reporteSeleccionado?.tabla && (
        <Panel key={`tabla-${reporte}`}>
          <SectionHeader
            icon={<Table2Icon className="w-4 h-4" />}
            title={reporteSeleccionado?.label ? "Tabla de Datos" : "Seleccione un reporte"}
            subtitle={reporteSeleccionado?.descripcion}
          />

          <div className="p-4">
            {reporte === "hit-rate" && <HitRate filtros={filtros} tipo="tablas" />}
            {reporte === "realizacion-de-precio" && (
              <RealizacionDePrecio filtros={filtros} tipo="tablas" />
            )}
          </div>
        </Panel>
      )}

      {reporteSeleccionado?.campos.usuario && (
        <Panel key={`grafica-usuario-${reporte}`}>
          <SectionHeader
            icon={<ChartColumnBig className="w-4 h-4" />}
            title={reporteSeleccionado?.label ? "Gráfica de Usuarios" : "Seleccione un reporte"}
            subtitle={reporteSeleccionado?.descripcion}
          />
          <div className="p-4">
            {reporte === "hit-rate" && <HitRate filtros={filtros} tipo="grafica-usuario" />}
            {reporte === "realizacion-de-precio" && (
              <RealizacionDePrecio filtros={filtros} tipo="grafica-usuario" />
            )}
          </div>
        </Panel>
      )}

      {reporteSeleccionado?.campos.tipoTransporte && (
        <Panel key={`grafica-transporte-${reporte}`}>
          <SectionHeader
            icon={<ChartColumnBig className="w-4 h-4" />}
            title={reporteSeleccionado?.label ? "Gráfica de Transportes" : "Seleccione un reporte"}
            subtitle={reporteSeleccionado?.descripcion}
            action={renderSelectCatalogo({
              id: "cod_tipo_transporte",
              label: "Tipo de Transporte",
              options: transportes,
            })}
          />
          <div className="p-4">
            {reporte === "hit-rate" && <HitRate filtros={filtros} tipo="grafica-transporte" />}
            {reporte === "realizacion-de-precio" && (
              <RealizacionDePrecio filtros={filtros} tipo="grafica-transporte" />
            )}
          </div>
        </Panel>
      )}

      {reporteSeleccionado?.graficas && (
        <Panel key={`grafica-otros-${reporte}`}>
          <SectionHeader
            icon={<ChartColumnBig className="w-4 h-4" />}
            title={reporteSeleccionado?.label ? "Gráfica de Datos" : "Seleccione un reporte"}
            subtitle={reporteSeleccionado?.descripcion}
          />
          <div className="p-4">
            {reporte === "hit-rate" && <HitRate filtros={filtros} tipo="grafica-otros" />}
            {reporte === "realizacion-de-precio" && (
              <RealizacionDePrecio filtros={filtros} tipo="grafica-otros" />
            )}
          </div>
        </Panel>
      )}
    </section>
  );
}
