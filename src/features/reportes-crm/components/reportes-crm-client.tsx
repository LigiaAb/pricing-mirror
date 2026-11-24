"use client";

import { format } from "date-fns";
import {
  CalendarDays,
  ChartColumnBig,
  ChevronDown,
  Filter,
  Search,
  Settings2,
  Table2Icon,
  Target,
  Users,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  actividades as actividadesCatalogo,
  useHistorialActividades,
} from "@/features/actividades";
import {
  centrosCosto,
  empleadosUsuarios,
  empresas,
  estados,
  puestos,
  tipos,
} from "@/features/catalogos";
import { useFetchEntidades } from "@/features/entidades";
import { MensajeVacio, Panel, SectionHeader } from "@/features/pricing/shared";
import { useContextoOperativoStore, usePermisosCategoria } from "@/features/shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { Combobox, type ComboboxOption } from "@/shared/components/ui/combobox";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { MultiSelect } from "@/shared/components/ui/multi-select";
import { asText } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/shared/stores/auth-store";
import { useActividadesReporte } from "../api/actividades-reporte";
import { useObjetivosReporte } from "../api/objetivos-reporte";
import type { ParamsReporteIcc } from "../api/reporte-icc";
import { actividadesEnRango } from "../lib/actividades-vista";
import { estadosReporteActividad, tiposReporteActividad } from "../lib/filtros-actividades";
import type { AgenteCalendario } from "../lib/pdf-calendario-actividades";
import {
  obtenerConfiguracionReporte,
  REPORTES_CRM,
  type ReporteCrmId,
} from "../lib/reportes-crm-registro";
import { BotonLimpiar } from "./boton-limpiar";
import { ReporteIcc } from "./reporte-icc";
import { ReporteObjetivos } from "./reporte-objetivos-empleado";
import { ReporteSeguimientoCliente } from "./reporte-seguimiento-cliente";
import { ReporteActividades } from "./reporte-visitas";

function rangoSemanaActual() {
  const hoy = new Date();
  const dia = hoy.getDay() || 7;
  const inicio = new Date(hoy);
  inicio.setDate(hoy.getDate() - dia + 1);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  return {
    // Día local: `toISOString` corría la semana un día después de las 18:00 de Guatemala.
    inicio: format(inicio, "yyyy-MM-dd"),
    fin: format(fin, "yyyy-MM-dd"),
  };
}

export function ReportesCrmClient() {
  const permisos = usePermisosCategoria("Información");
  const usuario = useAuthStore((state) => state.user);
  const empresaActual = useContextoOperativoStore((state) => state.currentEmpresa);
  const centroCostoActual = useContextoOperativoStore((state) => state.currentCentroCosto);
  const [reporte, setReporte] = useState<ReporteCrmId>("visitas-historico");
  const [empresaId, setEmpresaId] = useState(String(empresaActual?.cod_empresa ?? ""));
  const [ccId, setCcId] = useState(String(centroCostoActual?.cod_cc ?? ""));
  const [asesor, setAsesor] = useState("");
  const [estado, setEstado] = useState("");
  const [tiposActividad, setTiposActividad] = useState<string[]>([]);
  const [tipoAsignacion, setTipoAsignacion] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [consultaSeguimientoClienteId, setConsultaSeguimientoClienteId] = useState<string | null>(
    null,
  );
  const [consultaVisitas, setConsultaVisitas] = useState<{
    cod_empresa: string;
    cod_cc: string;
    cod_asesor?: string;
    cod_estado?: string;
  } | null>(null);
  const [consultaIcc, setConsultaIcc] = useState<ParamsReporteIcc | null>(null);
  const [consultaObjetivosManual, setConsultaObjetivosManual] = useState<{
    cod_emp: string;
    cod_cc: string;
    cod_tipo_asignacion: string;
    fecha_inicial: string;
    fecha_final: string;
  } | null>(null);
  const [consultaObjetivosGrafica, setConsultaObjetivosGrafica] = useState<{
    cod_emp: string;
    cod_cc: string;
    cod_usuario: string;
    cod_tipo_asignacion: string;
    fecha_inicial: string;
    fecha_final: string;
  } | null>(null);

  const configuracion = obtenerConfiguracionReporte(reporte);
  const { campos, vista } = configuracion;
  const puedeFiltrarEmpresaCc = permisos.puedeFiltrarEmpresaCentroCosto;
  const catalogoEmpresas = empresas.useLista({}, {});
  const catalogoCentros = centrosCosto.useLista({}, {});
  const catalogoEmpleados = empleadosUsuarios.useLista({}, { enabled: campos.asesor === true });
  const catalogoPuestos = puestos.useLista({}, { enabled: campos.asesor === true });
  const catalogoTiposAsignacion = tipos.useLista(
    { tipo_tabla: "ASIGNACION_ENTIDAD" },
    { enabled: campos.tipoAsignacion === "seleccion" },
  );
  const catalogoTiposActividad = tipos.useLista(
    { tipo_tabla: "ACTIVIDAD" },
    { enabled: campos.tipoActividad === true },
  );
  const catalogoEstados = estados.useLista({}, { enabled: campos.estado === true });
  const clientes = useFetchEntidades(
    { tipo_entidad: "CLIENTE", cod_estado: 1 },
    { enabled: campos.cliente === true },
  );

  const consultaCalendario =
    vista === "calendario" && asText(usuario?.cod_usuario)
      ? { cod_asesor: asText(usuario?.cod_usuario) }
      : null;
  const actividades = useActividadesReporte(
    vista === "visitas" ? consultaVisitas : consultaCalendario,
  );
  const historial = useHistorialActividades(
    vista === "seguimiento" ? consultaSeguimientoClienteId : null,
  );

  const centrosFiltrados = useMemo(
    () =>
      (catalogoCentros.data ?? []).filter((centro) => String(centro.codEmpresaCc) === empresaId),
    [catalogoCentros.data, empresaId],
  );
  const estadosActividad = useMemo(
    () => estadosReporteActividad(catalogoEstados.data ?? []),
    [catalogoEstados.data],
  );
  const tiposActividadReporte = useMemo(
    () => tiposReporteActividad(catalogoTiposActividad.data ?? []),
    [catalogoTiposActividad.data],
  );
  const asesores = useMemo(
    () =>
      Array.from(
        new Map(
          (catalogoEmpleados.data ?? [])
            .filter((empleado) => String(empleado.codCc) === ccId)
            .map((empleado) => [empleado.codUsuario, empleado]),
        ).values(),
      ),
    [catalogoEmpleados.data, ccId],
  );
  const asesorGrafica = asesor || asText(usuario?.cod_usuario);
  const tipoAsignacionGrafica = useMemo(() => {
    const empleado = asesores.find((item) => String(item.codUsuario) === asesorGrafica);
    // cod_tipo_asignacion vive en el puesto, no en el empleado: el legacy lo
    // resuelve cruzando listaemp-usu-puesto con lista-puesto por cod_puesto.
    const puesto = (catalogoPuestos.data ?? []).find(
      (item) => String(item.codPuesto) === String(empleado?.codPuesto),
    );
    return asText(empleado?.codTipoAsignacion) || asText(puesto?.codTipoAsignacion) || "1";
  }, [asesores, asesorGrafica, catalogoPuestos.data]);
  const semanaActual = useMemo(rangoSemanaActual, []);
  const objetivos = useObjetivosReporte(
    vista === "objetivos" ? consultaObjetivosManual : consultaObjetivosGrafica,
  );
  const actividadesGrafica = actividadesCatalogo.useLista(
    { cod_asesor: consultaObjetivosGrafica?.cod_usuario ?? "" },
    { enabled: vista === "graficas" && Boolean(consultaObjetivosGrafica) },
  );

  useEffect(() => {
    if (empresaActual?.cod_empresa != null) setEmpresaId(String(empresaActual.cod_empresa));
  }, [empresaActual?.cod_empresa]);
  useEffect(() => {
    if (centroCostoActual?.cod_cc != null) setCcId(String(centroCostoActual.cod_cc));
  }, [centroCostoActual?.cod_cc]);

  const filas = useMemo(() => {
    const datos = actividades.data ?? [];
    const enRango = actividadesEnRango(datos, inicio, fin);
    return tiposActividad.length
      ? enRango.filter((actividad) => tiposActividad.includes(String(actividad.cod_tipo ?? "")))
      : enRango;
  }, [actividades.data, fin, inicio, tiposActividad]);
  const agente = useMemo<AgenteCalendario>(() => {
    const empleado = (catalogoEmpleados.data ?? []).find(
      (item) => String(item.codUsuario) === asesor,
    );
    if (empleado) return { nombre: empleado.nombreCompleto, correo: empleado.usuario ?? "" };
    const nombre = [usuario?.nom_empleado, usuario?.apellido_emp]
      .map((parte) => asText(parte))
      .filter(Boolean)
      .join(" ");
    return {
      nombre: nombre || asText(usuario?.nombre_usuario) || asText(usuario?.email),
      correo: asText(usuario?.usuario) || asText(usuario?.email),
    };
  }, [asesor, catalogoEmpleados.data, usuario]);

  const puedeConsultarVisitas = Boolean(empresaId && ccId);
  const puedeConsultarObjetivos = Boolean(empresaId && ccId && tipoAsignacion && inicio && fin);
  const puedeGenerarGrafica = Boolean(empresaId && ccId && asesorGrafica && tipoAsignacionGrafica);
  const puedeConsultarIcc = Boolean(inicio && fin && inicio <= fin);
  // Filtros con nombre para el encabezado del PDF del ICC (los de la consulta, no los del formulario).
  const encabezadoIcc = useMemo(() => {
    const empresa = (catalogoEmpresas.data ?? []).find(
      (i) => String(i.cod_empresa) === String(consultaIcc?.cod_empresa),
    )?.nombre_emp;
    const centro = (catalogoCentros.data ?? []).find(
      (i) => String(i.codCc) === String(consultaIcc?.cod_cc),
    )?.nombreCc;
    const empleado = (catalogoEmpleados.data ?? []).find(
      (i) => String(i.codUsuario) === String(consultaIcc?.cod_usuario),
    )?.nombreCompleto;
    return {
      ...(empresa ? { Empresa: String(empresa) } : {}),
      ...(centro ? { "Centro de Costo": String(centro) } : {}),
      ...(empleado ? { Asesor: String(empleado) } : {}),
    };
  }, [catalogoCentros.data, catalogoEmpleados.data, catalogoEmpresas.data, consultaIcc]);
  const cambiarReporte = (id: ReporteCrmId) => {
    setReporte(id);
    setConsultaVisitas(null);
    setConsultaObjetivosManual(null);
    setConsultaObjetivosGrafica(null);
    setConsultaIcc(null);
    setAsesor("");
    setEstado("");
    setTiposActividad([]);
    setTipoAsignacion("");
    // Las fechas se conservan; en Objetivos, como en el legacy, la final arranca en hoy si está vacía.
    if (obtenerConfiguracionReporte(id).vista === "objetivos" && !fin) {
      setFin(format(new Date(), "yyyy-MM-dd"));
    }
    setClienteId("");
    setConsultaSeguimientoClienteId(null);
  };
  const filtrar = () => {
    if (vista === "visitas" && puedeConsultarVisitas) {
      setConsultaVisitas({
        cod_empresa: empresaId,
        cod_cc: ccId,
        ...(asesor ? { cod_asesor: asesor } : {}),
        ...(estado ? { cod_estado: estado } : {}),
      });
    }
    if (vista === "objetivos" && puedeConsultarObjetivos) {
      setConsultaObjetivosManual({
        cod_emp: empresaId,
        cod_cc: ccId,
        cod_tipo_asignacion: tipoAsignacion,
        fecha_inicial: inicio,
        fecha_final: fin,
      });
    }
    if (vista === "graficas" && puedeGenerarGrafica) {
      setConsultaObjetivosGrafica({
        cod_emp: empresaId,
        cod_cc: ccId,
        cod_usuario: asesorGrafica,
        cod_tipo_asignacion: tipoAsignacionGrafica,
        fecha_inicial: semanaActual.inicio,
        fecha_final: semanaActual.fin,
      });
    }
    if (vista === "icc" && puedeConsultarIcc) {
      setConsultaIcc({
        fecha_inicio: inicio,
        fecha_fin: fin,
        ...(empresaId ? { cod_empresa: Number(empresaId) } : {}),
        ...(ccId ? { cod_cc: Number(ccId) } : {}),
        ...(asesor ? { cod_usuario: Number(asesor) } : {}),
      });
    }
  };

  const hayFiltrosOpcionales = Boolean(
    (campos.empresaCentroCosto && puedeFiltrarEmpresaCc) ||
      campos.asesor ||
      campos.estado ||
      campos.tipoActividad ||
      campos.tipoAsignacion === "seleccion",
  );
  const filtrarDeshabilitado =
    vista === "visitas"
      ? !puedeConsultarVisitas
      : vista === "objetivos"
        ? !puedeConsultarObjetivos
        : vista === "icc"
          ? !puedeConsultarIcc
          : !puedeGenerarGrafica;

  return (
    <section className="w-full space-y-5 bg-surface-1 p-4 md:p-6">
      <Panel>
        <SectionHeader
          icon={<Filter className="h-4 w-4" />}
          title="Filtros requeridos"
          subtitle="Consulta de actividades, objetivos y seguimiento de clientes."
        />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
          <Field className="w-full sm:w-1/3">
            <FieldLabel htmlFor="reportes-crm-reporte">Reporte</FieldLabel>
            <Combobox
              id="reportes-crm-reporte"
              value={reporte}
              onChange={(valor) => {
                if (valor) cambiarReporte(valor as ReporteCrmId);
              }}
              options={OPCIONES_REPORTE}
              placeholder="Seleccione..."
              popoverClassName="z-[9999]"
            />
          </Field>
          {campos.fechas && (
            <>
              <label className="w-full text-sm font-medium sm:w-1/4">
                Fecha inicial{campos.fechas === "requeridas" ? " *" : ""}
                <div className="relative mt-1">
                  <input
                    type="date"
                    className={cn("h-9 w-full rounded-md border bg-card px-2", inicio && "pr-16")}
                    value={inicio}
                    onChange={(event) => setInicio(event.target.value)}
                  />
                  {inicio ? (
                    <BotonLimpiar label="Fecha inicial" onClick={() => setInicio("")} />
                  ) : null}
                </div>
              </label>
              <label className="w-full text-sm font-medium sm:w-1/4">
                Fecha final{campos.fechas === "requeridas" ? " *" : ""}
                <div className="relative mt-1">
                  <input
                    type="date"
                    className={cn("h-9 w-full rounded-md border bg-card px-2", fin && "pr-16")}
                    value={fin}
                    onChange={(event) => setFin(event.target.value)}
                  />
                  {fin ? <BotonLimpiar label="Fecha final" onClick={() => setFin("")} /> : null}
                </div>
              </label>
            </>
          )}
          {(vista === "visitas" ||
            vista === "objetivos" ||
            vista === "graficas" ||
            vista === "icc") && (
            <Button
              type="button"
              className="gap-1.5"
              onClick={filtrar}
              disabled={filtrarDeshabilitado}
            >
              {vista === "graficas" ? (
                <ChartColumnBig className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {vista === "graficas" ? "Generar gráfica" : "Filtrar"}
            </Button>
          )}
        </div>
      </Panel>

      {hayFiltrosOpcionales && (
        <Panel>
          <Accordion type="single" collapsible defaultValue="filtros">
            <AccordionItem value="filtros" className="border-none">
              <AccordionTrigger className="bg-brand-50 p-0 hover:no-underline [&>svg]:hidden">
                <div className="flex w-full items-center justify-between pr-5">
                  <SectionHeader
                    icon={<Settings2 className="h-4 w-4" />}
                    title="Filtros"
                    subtitle="Acota el universo de actividades a analizar"
                  />
                  <ChevronDown className="h-4 w-4 shrink-0 text-primary transition-transform duration-200" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="grid gap-4 px-5 pt-4 pb-5 md:grid-cols-3">
                {campos.empresaCentroCosto && puedeFiltrarEmpresaCc && (
                  <FiltroCombobox
                    id="reportes-crm-empresa"
                    label="Empresa"
                    value={empresaId}
                    placeholder="Selecciona una empresa"
                    options={(catalogoEmpresas.data ?? []).map((item) => ({
                      value: String(item.cod_empresa),
                      label: String(item.nombre_emp ?? ""),
                    }))}
                    onChange={(valor) => {
                      setEmpresaId(valor);
                      setCcId("");
                      setAsesor("");
                      setConsultaObjetivosGrafica(null);
                    }}
                  />
                )}
                {campos.empresaCentroCosto && puedeFiltrarEmpresaCc && (
                  <FiltroCombobox
                    id="reportes-crm-centro-costo"
                    label="Centro de costo"
                    value={ccId}
                    placeholder="Selecciona un centro de costo"
                    options={centrosFiltrados.map((item) => ({
                      value: String(item.codCc),
                      label: item.nombreCc,
                    }))}
                    onChange={(valor) => {
                      setCcId(valor);
                      setAsesor("");
                      setConsultaObjetivosGrafica(null);
                    }}
                  />
                )}
                {campos.asesor && (
                  <FiltroCombobox
                    id="reportes-crm-asesor"
                    label={vista === "graficas" ? "Asesor" : "Asesor (opcional)"}
                    value={asesor}
                    placeholder={vista === "graficas" ? "Usuario actual" : "Todos los asesores"}
                    options={asesores.map((item) => ({
                      value: String(item.codUsuario),
                      label: item.nombreCompleto,
                    }))}
                    onChange={(valor) => {
                      setAsesor(valor);
                      setConsultaObjetivosGrafica(null);
                    }}
                  />
                )}
                {campos.estado && (
                  <FiltroCombobox
                    id="reportes-crm-estado"
                    label="Estado (opcional)"
                    value={estado}
                    placeholder="Todos los estados"
                    options={estadosActividad.map((item) => ({
                      value: String(item.cod_estado),
                      label: String(item.estado_desc ?? ""),
                    }))}
                    onChange={setEstado}
                  />
                )}
                {campos.tipoActividad && (
                  <Field>
                    <FieldLabel htmlFor="reportes-crm-tipo">Tipo (opcional)</FieldLabel>
                    <div className="relative w-full">
                      <MultiSelect
                        id="reportes-crm-tipo"
                        value={tiposActividad}
                        onChange={setTiposActividad}
                        placeholder="Todos los tipos"
                        searchPlaceholder="Buscar tipo…"
                        {...(tiposActividad.length ? { className: "pr-16" } : {})}
                        options={tiposActividadReporte.map((item) => ({
                          value: String(item.codTipo),
                          label: item.nomTipo,
                        }))}
                      />
                      {tiposActividad.length ? (
                        // Centrado en el botón (h-9), no en el bloque con las etiquetas.
                        <BotonLimpiar
                          label="Tipo"
                          onClick={() => setTiposActividad([])}
                          className="top-[1.125rem]"
                        />
                      ) : null}
                    </div>
                  </Field>
                )}
                {campos.tipoAsignacion === "seleccion" && (
                  <FiltroCombobox
                    id="reportes-crm-tipo-asignacion"
                    label="Tipo de asignación"
                    value={tipoAsignacion}
                    placeholder="Selecciona un tipo"
                    options={(catalogoTiposAsignacion.data ?? []).map((item) => ({
                      value: String(item.codTipo),
                      label: item.nomTipo,
                    }))}
                    onChange={setTipoAsignacion}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Panel>
      )}

      <Panel key={`resultado-${reporte}`}>
        <SectionHeader
          icon={ICONOS_VISTA[vista]}
          title={configuracion.label}
          subtitle={SUBTITULOS_VISTA[vista]}
        />
        <div className="p-4">
          {vista === "visitas" && (
            <ReporteActividades
              filas={filas}
              cargando={actividades.isFetching}
              pdf={false}
              historico={reporte === "visitas-historico"}
              agente={agente}
              inicio={inicio}
              fin={fin}
              empleados={catalogoEmpleados.data ?? []}
              empresa={
                (catalogoEmpresas.data ?? [])?.find(
                  (i) => String(i.cod_empresa) === String(empresaId),
                )?.nombre_emp ?? ""
              }
              centroCosto={
                (catalogoCentros.data ?? [])?.find((i) => String(i.codCc) === String(ccId))
                  ?.nombreCc ?? ""
              }
              estado={
                estadosActividad.find((i) => String(i.cod_estado) === String(estado))
                  ?.estado_desc ?? ""
              }
              tipos={tiposActividadReporte
                .filter((i) => tiposActividad.includes(String(i.codTipo)))
                ?.map((i) => i.nomTipo)}
            />
          )}
          {vista === "calendario" && (
            <ReporteActividades
              filas={filas}
              cargando={actividades.isFetching}
              pdf
              historico={false}
              agente={agente}
              inicio={inicio}
              fin={fin}
              empleados={catalogoEmpleados.data ?? []}
              empresa={
                (catalogoEmpresas.data ?? [])?.find(
                  (i) => String(i.cod_empresa) === String(empresaId),
                )?.nombre_emp ?? ""
              }
              centroCosto={
                (catalogoCentros.data ?? [])?.find((i) => String(i.codCc) === String(ccId))
                  ?.nombreCc ?? ""
              }
              estado={
                estadosActividad.find((i) => String(i.cod_estado) === String(estado))
                  ?.estado_desc ?? ""
              }
              tipos={tiposActividadReporte
                .filter((i) => tiposActividad.includes(String(i.codTipo)))
                ?.map((i) => i.nomTipo)}
            />
          )}
          {vista === "objetivos" && (
            <ReporteObjetivos actividadesGrafica={[]} datos={objetivos.data} grafica={false} />
          )}
          {vista === "graficas" &&
            (consultaObjetivosGrafica ? (
              <ReporteObjetivos
                actividadesGrafica={actividadesGrafica.data ?? []}
                datos={objetivos.data}
                grafica
              />
            ) : (
              <MensajeVacio>
                Selecciona el asesor y genera la gráfica para consultar sus objetivos de la semana
                actual.
              </MensajeVacio>
            ))}
          {vista === "icc" && (
            <ReporteIcc
              key={JSON.stringify(consultaIcc)}
              params={consultaIcc}
              encabezado={encabezadoIcc}
            />
          )}
          {vista === "seguimiento" && (
            <ReporteSeguimientoCliente
              clientes={clientes.data ?? []}
              clienteId={clienteId}
              setClienteId={(cliente) => {
                setClienteId(cliente);
                setConsultaSeguimientoClienteId(null);
              }}
              onGenerar={() => setConsultaSeguimientoClienteId(clienteId || null)}
              consultado={consultaSeguimientoClienteId !== null}
              filas={historial.data ?? []}
              cargando={historial.isFetching}
              empresaId={empresaId}
              empresaNombre={String(
                (catalogoEmpresas.data ?? []).find((i) => String(i.cod_empresa) === empresaId)
                  ?.nombre_emp ?? "",
              )}
              ccId={ccId}
            />
          )}
        </div>
      </Panel>
    </section>
  );
}

const OPCIONES_REPORTE: ComboboxOption[] = REPORTES_CRM.map((item) => ({
  value: item.id,
  label: item.label,
}));

type VistaReporte = ReturnType<typeof obtenerConfiguracionReporte>["vista"];

const ICONOS_VISTA: Record<VistaReporte, ReactNode> = {
  visitas: <Table2Icon className="h-4 w-4" />,
  calendario: <CalendarDays className="h-4 w-4" />,
  objetivos: <Target className="h-4 w-4" />,
  graficas: <ChartColumnBig className="h-4 w-4" />,
  seguimiento: <Users className="h-4 w-4" />,
  icc: <ChartColumnBig className="h-4 w-4" />,
};

const SUBTITULOS_VISTA: Record<VistaReporte, string> = {
  visitas: "Actividades de la empresa y el centro de costo, exportables a Excel",
  calendario: "Actividades del usuario actual dentro del rango indicado, en PDF",
  objetivos: "Cumplimiento de objetivos por empleado y periodo",
  graficas: "Objetivos y actividades del asesor en la semana actual",
  seguimiento: "Historial de seguimientos del cliente",
  icc: "Gráfica y detalle por persona (por fecha programada)",
};

/** Select buscable de un filtro opcional; vacío ("") = sin filtro (muestra el `placeholder`). */
function FiltroCombobox({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: ComboboxOption[];
  onChange: (valor: string) => void;
}>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative w-full">
        <Combobox
          id={id}
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          popoverClassName="z-[9999]"
          className={value ? "pr-16" : undefined}
          clearable
        />
        {value ? <BotonLimpiar label={label} onClick={() => onChange("")} /> : null}
      </div>
    </Field>
  );
}
