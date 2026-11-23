"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useContextoOperativoStore, usePermisosCategoria } from "@/features/shell";
import { Button } from "@/shared/components/ui/button";
import { MultiSelect } from "@/shared/components/ui/multi-select";
import { asText } from "@/shared/lib/text";
import { useAuthStore } from "@/shared/stores/auth-store";
import { useActividadesReporte } from "../api/actividades-reporte";
import { useObjetivosReporte } from "../api/objetivos-reporte";
import { actividadesEnRango } from "../lib/actividades-vista";
import { estadosReporteActividad, tiposReporteActividad } from "../lib/filtros-actividades";
import type { AgenteCalendario } from "../lib/pdf-calendario-actividades";
import {
  obtenerConfiguracionReporte,
  REPORTES_CRM,
  type ReporteCrmId,
} from "../lib/reportes-crm-registro";
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
    inicio: inicio.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10),
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
    const enRango = inicio && fin ? actividadesEnRango(datos, inicio, fin) : datos;
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
  const cambiarReporte = (id: ReporteCrmId) => {
    setReporte(id);
    setConsultaVisitas(null);
    setConsultaObjetivosManual(null);
    setConsultaObjetivosGrafica(null);
    setAsesor("");
    setEstado("");
    setTiposActividad([]);
    setTipoAsignacion("");
    setInicio("");
    setFin("");
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
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reportes CRM</h1>
        <p className="text-sm text-muted-foreground">
          Consulta de actividades, objetivos y seguimiento de clientes.
        </p>
      </div>
      <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <label className="text-sm font-medium">
          Reporte
          <select
            className="mt-1 h-9 w-full rounded-md border bg-card px-2"
            value={reporte}
            onChange={(event) => cambiarReporte(event.target.value as ReporteCrmId)}
          >
            {REPORTES_CRM.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {campos.empresaCentroCosto && puedeFiltrarEmpresaCc && (
          <label className="text-sm font-medium">
            Empresa
            <select
              className="mt-1 h-9 w-full rounded-md border bg-card px-2"
              value={empresaId}
              onChange={(event) => {
                setEmpresaId(event.target.value);
                setCcId("");
                setAsesor("");
                setConsultaObjetivosGrafica(null);
              }}
            >
              <option value="">Selecciona una empresa</option>
              {(catalogoEmpresas.data ?? []).map((item) => (
                <option key={item.cod_empresa} value={item.cod_empresa}>
                  {item.nombre_emp}
                </option>
              ))}
            </select>
          </label>
        )}
        {campos.empresaCentroCosto && puedeFiltrarEmpresaCc && (
          <label className="text-sm font-medium">
            Centro de costo
            <select
              className="mt-1 h-9 w-full rounded-md border bg-card px-2"
              value={ccId}
              onChange={(event) => {
                setCcId(event.target.value);
                setAsesor("");
                setConsultaObjetivosGrafica(null);
              }}
            >
              <option value="">Selecciona un centro de costo</option>
              {centrosFiltrados.map((item) => (
                <option key={item.codCc} value={item.codCc}>
                  {item.nombreCc}
                </option>
              ))}
            </select>
          </label>
        )}
        {campos.asesor && (
          <label className="text-sm font-medium">
            {vista === "graficas" ? "Asesor" : "Asesor (opcional)"}
            <select
              className="mt-1 h-9 w-full rounded-md border bg-card px-2"
              value={asesor}
              onChange={(event) => {
                setAsesor(event.target.value);
                setConsultaObjetivosGrafica(null);
              }}
            >
              <option value="">
                {vista === "graficas" ? "Usuario actual" : "Todos los asesores"}
              </option>
              {asesores.map((item) => (
                <option key={item.codUsuario} value={item.codUsuario}>
                  {item.nombreCompleto}
                </option>
              ))}
            </select>
          </label>
        )}
        {campos.estado && (
          <label className="text-sm font-medium">
            Estado (opcional)
            <select
              className="mt-1 h-9 w-full rounded-md border bg-card px-2"
              value={estado}
              onChange={(event) => setEstado(event.target.value)}
            >
              <option value="">Todos los estados</option>
              {estadosActividad.map((item) => (
                <option key={item.cod_estado} value={item.cod_estado}>
                  {item.estado_desc}
                </option>
              ))}
            </select>
          </label>
        )}
        {campos.tipoActividad && (
          <div>
            <label className="text-sm font-medium" htmlFor="reportes-crm-tipo">
              Tipo (opcional)
            </label>
            <MultiSelect
              id="reportes-crm-tipo"
              className="mt-1"
              value={tiposActividad}
              onChange={setTiposActividad}
              placeholder="Todos los tipos"
              searchPlaceholder="Buscar tipo…"
              options={tiposActividadReporte.map((item) => ({
                value: String(item.codTipo),
                label: item.nomTipo,
              }))}
            />
          </div>
        )}
        {campos.tipoAsignacion === "seleccion" && (
          <label className="text-sm font-medium">
            Tipo de asignación
            <select
              className="mt-1 h-9 w-full rounded-md border bg-card px-2"
              value={tipoAsignacion}
              onChange={(event) => setTipoAsignacion(event.target.value)}
            >
              <option value="">Selecciona un tipo</option>
              {(catalogoTiposAsignacion.data ?? []).map((item) => (
                <option key={item.codTipo} value={item.codTipo}>
                  {item.nomTipo}
                </option>
              ))}
            </select>
          </label>
        )}
        {campos.fechas && (
          <>
            <label className="text-sm font-medium">
              Fecha inicial{campos.fechas === "requeridas" ? " *" : ""}
              <input
                type="date"
                className="mt-1 h-9 w-full rounded-md border bg-card px-2"
                value={inicio}
                onChange={(event) => setInicio(event.target.value)}
              />
            </label>
            <label className="text-sm font-medium">
              Fecha final{campos.fechas === "requeridas" ? " *" : ""}
              <input
                type="date"
                className="mt-1 h-9 w-full rounded-md border bg-card px-2"
                value={fin}
                onChange={(event) => setFin(event.target.value)}
              />
            </label>
          </>
        )}
        {(vista === "visitas" || vista === "objetivos" || vista === "graficas") && (
          <div className="flex items-end">
            <Button
              onClick={filtrar}
              disabled={
                vista === "visitas"
                  ? !puedeConsultarVisitas
                  : vista === "objetivos"
                    ? !puedeConsultarObjetivos
                    : !puedeGenerarGrafica
              }
            >
              {vista === "graficas" ? "Generar gráfica" : "Filtrar"}
            </Button>
          </div>
        )}
      </div>
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
            (catalogoEmpresas.data ?? [])?.find((i) => String(i.cod_empresa) === String(empresaId))
              ?.nombre_emp ?? ""
          }
          centroCosto={
            (catalogoCentros.data ?? [])?.find((i) => String(i.codCc) === String(ccId))?.nombreCc ??
            ""
          }
          estado={
            estadosActividad.find((i) => String(i.cod_estado) === String(estado))?.estado_desc ?? ""
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
            (catalogoEmpresas.data ?? [])?.find((i) => String(i.cod_empresa) === String(empresaId))
              ?.nombre_emp ?? ""
          }
          centroCosto={
            (catalogoCentros.data ?? [])?.find((i) => String(i.codCc) === String(ccId))?.nombreCc ??
            ""
          }
          estado={
            estadosActividad.find((i) => String(i.cod_estado) === String(estado))?.estado_desc ?? ""
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
          <p className="text-sm text-muted-foreground">
            Selecciona el asesor y genera la gráfica para consultar sus objetivos de la semana
            actual.
          </p>
        ))}
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
          ccId={ccId}
        />
      )}
    </section>
  );
}
