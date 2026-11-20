"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
import { BarChart2, ChevronDown, Download, Filter, Loader2, Settings2, Table2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarraComparativa,
  COLORES_GRAFICA,
  type DetalleSeguimientoGeneral,
  type FiltrosDetalleSegGeneral,
  fetchDetalleSegGeneral,
} from "@/features/cxc";
import { TendenciaMensual } from "@/features/reportesbi";
import ColumnSelect from "@/shared/components/tabla-double/column-select";
import { construirNivelesDesdeConfig } from "@/shared/components/tabla-double/construir-niveles-desde-config";
import DateRangeSelect from "@/shared/components/tabla-double/date-range-select";
import NivelesBuilder, { type CampoConfig } from "@/shared/components/tabla-double/niveles-builder";
import RangeSelect from "@/shared/components/tabla-double/range-select";
import SelectFiltro, { type OpcionFiltro } from "@/shared/components/tabla-double/select-filtro";
import TablaDouble from "@/shared/components/tabla-double/tabla-double";
import {
  useColumnasDesdeCampo,
  useGroupedTree,
} from "@/shared/components/tabla-double/use-grouped-tree";
import { useMonedaPorColumna } from "@/shared/components/tabla-double/use-moneda-por-columna";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { useExcelJS } from "@/shared/hooks/use-dynamic-libraries";
import { logger } from "@/shared/lib/logger";

type OpcionBi = OpcionFiltro;
type Categoria = "promesa_disputa" | "aplicar_recibo" | "agendar_seguimiento";

const FORMATO_FECHA_INPUT = "yyyy-MM-dd";

// Estas preferencias se guardaban en localStorage en la versión legacy. Los
// filtros y la configuración de la gráfica ahora pertenecen solo a la vista
// abierta; al montarla eliminamos los valores históricos para que no se sigan
// restaurando tras una recarga.
const CLAVES_LOCAL_STORAGE_HISTORICAS = [
  "dashcxc.tipoSeguimiento",
  "dashcxc.fechaConsultaInicio",
  "dashcxc.fechaConsultaFin",
  "dashcxc.mesGuardado",
  "dashcxc.empresaSeleccionada",
  "dashcxc.cencosSeleccionado",
  "dashcxc.tipoDocSeleccionado",
  "dashcxc.clienteSeleccionado",
  "dashcxc.serieSeleccionada",
  "dashcxc.monedaSeleccionada",
  "dashcxc.usuarioSeleccionado",
  "dashcxc.tipoActividadSeleccionado",
  "dashcxc.nivelesActivosDocumentos",
  "dashcxc.campoColumnaDocumentos",
  "dashcxc.nivelGraficaDocumentos",
  "dashcxc.nivelesActivosAgendar",
  "dashcxc.campoColumnaAgendar",
  "dashcxc.nivelGraficaAgendar",
] as const;

// ── Tipos de seguimiento (filtro obligatorio) ────────────────────────────────
// Los "value" deben calzar EXACTO con DESTIPO_SEGUIMIENTO / cod_tipo_seg que espera el API.

const TIPOS_SEGUIMIENTO: { value: string; label: string; categoria: Categoria }[] = [
  { value: "387", label: "Promesas de pago", categoria: "promesa_disputa" },
  { value: "388", label: "Cuentas en disputa", categoria: "promesa_disputa" },
  { value: "390", label: "Aplicar recibos", categoria: "aplicar_recibo" },
  { value: "389", label: "Agendar seguimiento", categoria: "agendar_seguimiento" },
];

const CAMPOS_DISPONIBLES_DOCUMENTOS: CampoConfig[] = [
  { campo: "EMPRESA_NOMBRE", etiqueta: "Empresa" },
  { campo: "CENCOD_NOMBRE", etiqueta: "Centro de Costo" },
  { campo: "TIPO_DOCUMENTO", etiqueta: "Tipo Documento" },
  { campo: "NOMBRE_CLIENTE", etiqueta: "Cliente" },
  { campo: "CABDOC_SERIE", etiqueta: "Serie" },
  { campo: "CABDOC_MONEDA", etiqueta: "Moneda" },
  { campo: "USU_SEGUIMIENTO", etiqueta: "Usuario" },
];

const CAMPOS_COLUMNA_DOCUMENTOS = [
  { campo: "TIPO_DOCUMENTO", etiqueta: "Tipo Documento" },
  { campo: "CABDOC_MONEDA", etiqueta: "Moneda" },
  { campo: "Anio", etiqueta: "Año" },
  { campo: "Mes", etiqueta: "Mes" },
];

const NIVELES_DEFECTO_DOCUMENTOS: CampoConfig[] = [
  { campo: "USU_SEGUIMIENTO", etiqueta: "Usuario" },
  { campo: "NOMBRE_CLIENTE", etiqueta: "Cliente" },
  { campo: "CABDOC_MONEDA", etiqueta: "Moneda" },
  { campo: "CABDOC_SERIE", etiqueta: "Serie" },
];

const CAMPOS_DISPONIBLES_AGENDAR: CampoConfig[] = [
  { campo: "NOMBRE_CLIENTE", etiqueta: "Cliente" },
  { campo: "USU_SEGUIMIENTO", etiqueta: "Usuario" },
  { campo: "TIPO_ACTIVIDAD", etiqueta: "Tipo de Actividad" },
  { campo: "EMPRESA_NOMBRE", etiqueta: "Empresa" },
  { campo: "CENCOD_NOMBRE", etiqueta: "Centro de Costo" },
  { campo: "ASUNTO_ACTIVIDAD", etiqueta: "asunto" },
];

const CAMPOS_COLUMNA_AGENDAR = [
  { campo: "Anio", etiqueta: "Año" },
  { campo: "Mes", etiqueta: "Mes" },
  { campo: "TIPO_ACTIVIDAD", etiqueta: "Tipo de Actividad" },
];

const NIVELES_DEFECTO_AGENDAR: CampoConfig[] = [
  { campo: "USU_SEGUIMIENTO", etiqueta: "Usuario" },
  { campo: "NOMBRE_CLIENTE", etiqueta: "Cliente" },
  { campo: "TIPO_ACTIVIDAD", etiqueta: "Tipo de Actividad" },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// ── Section header / Panel (mismo patrón visual que clientes-bi) ────────────

function SectionHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-brand-50 border-b border-border">
      <div className="flex items-center gap-3">
        <span className="text-primary">{icon}</span>
        <div>
          <p className="font-semibold text-primary text-lg leading-tight">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
      {children}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

const DashcxcClient = () => {
  const [documentos, setDocumentos] = useState<DetalleSeguimientoGeneral[]>([]);
  const [cargando, setCargando] = useState(true);
  const { loadExcelJS } = useExcelJS();
  const requestIdRef = useRef(0);

  // ── Filtro obligatorio: Tipo de Seguimiento (default: Promesas de pago) ──

  const [tipoSeguimiento, setTipoSeguimiento] = useState<string>("387");

  const categoria = useMemo<Categoria | null>(() => {
    return TIPOS_SEGUIMIENTO.find((t) => t.value === tipoSeguimiento)?.categoria ?? null;
  }, [tipoSeguimiento]);

  // Agrega esto junto a `categoria` (arriba, donde ya buscas en TIPOS_SEGUIMIENTO)
  const tipoSeguimientoActual = useMemo(
    () => TIPOS_SEGUIMIENTO.find((t) => t.value === tipoSeguimiento) ?? null,
    [tipoSeguimiento],
  );

  const esAgendar = categoria === "agendar_seguimiento";

  // ── Filtro obligatorio: Periodo de consulta (inputs, sin bloqueo) ────────
  // Default = mes actual. No se restringe min/max: el usuario puede navegar
  // libremente a cualquier mes/rango mientras la vista esté abierta.

  const [fechaConsultaInicio, setFechaConsultaInicio] = useState<string>(() =>
    format(startOfMonth(new Date()), FORMATO_FECHA_INPUT),
  );
  const [fechaConsultaFin, setFechaConsultaFin] = useState<string>(() =>
    format(endOfMonth(new Date()), FORMATO_FECHA_INPUT),
  );
  // ── Filtros comunes a Promesa/Disputa/Recibo ────────────────────────────

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<OpcionBi[]>([]);
  const [cencosSeleccionado, setCencosSeleccionado] = useState<OpcionBi[]>([]);
  const [tipoDocSeleccionado, setTipoDocSeleccionado] = useState<OpcionBi[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<OpcionBi[]>([]);
  const [serieSeleccionada, setSerieSeleccionada] = useState<OpcionBi[]>([]);
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<OpcionBi[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<OpcionBi[]>([]);

  // ── Filtro extra de Agendar Seguimiento ─────────────────────────────────

  const [tipoActividadSeleccionado, setTipoActividadSeleccionado] = useState<OpcionBi[]>([]);

  const [valorRangeSeleccionado, setValorRangeSeleccionado] = useState<[number, number]>([0, 0]);
  const [fechaRangeSeleccionado, setFechaRangeSeleccionado] = useState<[Date, Date] | null>(null);

  // Visibilidad de columnas de la tabla (independiente del select de "columnas del reporte")
  const [columnasVisibles, setColumnasVisibles] = useState<Set<string>>(new Set());

  // ── Config de niveles/columna/gráfica, separada por grupo de layout ────

  const [nivelesActivosDocumentos, setNivelesActivosDocumentos] = useState<CampoConfig[]>(
    NIVELES_DEFECTO_DOCUMENTOS,
  );
  const [campoColumnaDocumentos, setCampoColumnaDocumentos] = useState<string>("CABDOC_MONEDA");
  const [nivelGraficaDocumentosRaw, setNivelGraficaDocumentos] = useState<number>(0);

  const [nivelesActivosAgendar, setNivelesActivosAgendar] =
    useState<CampoConfig[]>(NIVELES_DEFECTO_AGENDAR);
  const [campoColumnaAgendar, setCampoColumnaAgendar] = useState<string>("Anio");
  const [nivelGraficaAgendarRaw, setNivelGraficaAgendar] = useState<number>(0);

  useEffect(() => {
    try {
      for (const clave of CLAVES_LOCAL_STORAGE_HISTORICAS) {
        window.localStorage.removeItem(clave);
      }
    } catch (error) {
      logger.warn("No se pudieron limpiar las preferencias históricas de Dash CxC:", error);
    }
  }, []);

  const nivelesActivos = esAgendar ? nivelesActivosAgendar : nivelesActivosDocumentos;
  const setNivelesActivos = esAgendar ? setNivelesActivosAgendar : setNivelesActivosDocumentos;
  const campoColumna = esAgendar ? campoColumnaAgendar : campoColumnaDocumentos;
  const setCampoColumna = esAgendar ? setCampoColumnaAgendar : setCampoColumnaDocumentos;
  const nivelGraficaRaw = esAgendar ? nivelGraficaAgendarRaw : nivelGraficaDocumentosRaw;
  const setNivelGrafica = esAgendar ? setNivelGraficaAgendar : setNivelGraficaDocumentos;

  const CAMPOS_DISPONIBLES = esAgendar ? CAMPOS_DISPONIBLES_AGENDAR : CAMPOS_DISPONIBLES_DOCUMENTOS;
  const CAMPOS_COLUMNA = esAgendar ? CAMPOS_COLUMNA_AGENDAR : CAMPOS_COLUMNA_DOCUMENTOS;

  // ── Fetch: el servidor filtra por tipo de seguimiento y periodo ────────

  const obtenerDatos = useCallback(async () => {
    if (!tipoSeguimiento || !fechaConsultaInicio || !fechaConsultaFin) {
      setCargando(false);
      return;
    }

    const idPeticion = ++requestIdRef.current;
    setCargando(true);
    try {
      const data = await fetchDetalleSegGeneral({
        cod_tipo_seg: Number(tipoSeguimiento),
        fecha_inicio: fechaConsultaInicio,
        fecha_fin: fechaConsultaFin,
      } as unknown as FiltrosDetalleSegGeneral);
      if (idPeticion !== requestIdRef.current) return; // respuesta obsoleta, se ignora
      setDocumentos(data);
    } catch (error) {
      if (idPeticion !== requestIdRef.current) return;
      logger.error("Error al obtener detalle de seguimiento general:", error);
      setDocumentos([]);
    } finally {
      if (idPeticion === requestIdRef.current) setCargando(false);
    }
  }, [tipoSeguimiento, fechaConsultaInicio, fechaConsultaFin]);

  useEffect(() => {
    void obtenerDatos();
  }, [obtenerDatos]);

  // El servidor ya filtra por tipo + periodo; se mantiene un filtro extra
  // como red de seguridad por si llegara algún registro de otro tipo.
  const documentosDelTipo = useMemo(() => {
    if (!tipoSeguimiento) return [];
    return documentos.filter((d) => String(d.TIPO_ID_SEG ?? "") === tipoSeguimiento);
  }, [documentos, tipoSeguimiento]);

  // ── Opciones de filtro (derivadas de los datos ya acotados al tipo) ────

  const construirOpciones = useCallback(
    (items: DetalleSeguimientoGeneral[], campo: keyof DetalleSeguimientoGeneral): OpcionBi[] => {
      const mapa = new Map<string, OpcionBi>();
      items.forEach((d) => {
        const valor = String(d[campo] ?? "").trim();
        if (!valor || mapa.has(valor)) return;
        mapa.set(valor, { value: valor, label: valor });
      });
      return Array.from(mapa.values()).sort((a, b) => a.label.localeCompare(b.label));
    },
    [],
  );

  const opcionesEmpresa = useMemo(
    () => construirOpciones(documentosDelTipo, "EMPRESA_NOMBRE"),
    [documentosDelTipo, construirOpciones],
  );
  const opcionesCencos = useMemo(
    () => construirOpciones(documentosDelTipo, "CENCOD_NOMBRE"),
    [documentosDelTipo, construirOpciones],
  );
  const opcionesTipoDoc = useMemo(
    () => construirOpciones(documentosDelTipo, "TIPO_DOCUMENTO"),
    [documentosDelTipo, construirOpciones],
  );
  const opcionesCliente = useMemo(
    () => construirOpciones(documentosDelTipo, "NOMBRE_CLIENTE"),
    [documentosDelTipo, construirOpciones],
  );
  const opcionesSerie = useMemo(
    () => construirOpciones(documentosDelTipo, "CABDOC_SERIE"),
    [documentosDelTipo, construirOpciones],
  );
  const opcionesMoneda = useMemo(
    () => construirOpciones(documentosDelTipo, "CABDOC_MONEDA"),
    [documentosDelTipo, construirOpciones],
  );
  const opcionesUsuario = useMemo(
    () => construirOpciones(documentosDelTipo, "USU_SEGUIMIENTO"),
    [documentosDelTipo, construirOpciones],
  );
  const opcionesTipoActividad = useMemo(
    () => construirOpciones(documentosDelTipo, "TIPO_ACTIVIDAD"),
    [documentosDelTipo, construirOpciones],
  );

  // ── Rango de valor (solo aplica a promesa_disputa / aplicar_recibo) ────

  const campoValor: keyof DetalleSeguimientoGeneral =
    categoria === "aplicar_recibo" ? "CABDOC_APLICA" : "CABDOC_VALOR";

  const minValor = useMemo(() => {
    if (!documentosDelTipo.length) return 0;
    const min = documentosDelTipo.reduce((acc, d) => {
      const valor = Number(d[campoValor]) || 0;
      return Math.min(valor, acc);
    }, Number.POSITIVE_INFINITY);
    return Math.floor(Number.isFinite(min) ? min : 0);
  }, [documentosDelTipo, campoValor]);

  const maxValor = useMemo(() => {
    if (!documentosDelTipo.length) return 10000;
    const max = documentosDelTipo.reduce((acc, d) => {
      const valor = Number(d[campoValor]) || 0;
      return Math.max(valor, acc);
    }, 0);
    return Math.ceil(max);
  }, [documentosDelTipo, campoValor]);

  const minFecha = useMemo(() => {
    if (!documentosDelTipo.length) return new Date();
    const ms = documentosDelTipo.reduce((acc, d) => {
      const t = new Date(String(d.FECHA_SEGUIMIENTO ?? "")).getTime();
      if (Number.isNaN(t)) return acc;
      return Math.min(acc, t);
    }, Number.POSITIVE_INFINITY);
    return Number.isFinite(ms) ? new Date(ms) : new Date();
  }, [documentosDelTipo]);

  const maxFecha = useMemo(() => {
    if (!documentosDelTipo.length) return new Date();
    const ms = documentosDelTipo.reduce((acc, d) => {
      const t = new Date(String(d.FECHA_SEGUIMIENTO ?? "")).getTime();
      if (Number.isNaN(t)) return acc;
      return Math.max(acc, t);
    }, 0);
    return Number.isFinite(ms) && ms > 0 ? new Date(ms) : new Date();
  }, [documentosDelTipo]);

  useEffect(() => {
    setValorRangeSeleccionado([minValor, maxValor]);
  }, [minValor, maxValor]);

  useEffect(() => {
    if (documentosDelTipo.length > 0) {
      setFechaRangeSeleccionado([minFecha, maxFecha]);
    } else {
      setFechaRangeSeleccionado(null);
    }
  }, [minFecha, maxFecha, documentosDelTipo.length]);

  // Al cambiar de tipo de seguimiento, limpia filtros que no aplican al nuevo layout
  useEffect(() => {
    // Referencia explícita a `tipoSeguimiento` para que el linter
    // reconozca la dependencia intencional sin alterar el comportamiento.
    void tipoSeguimiento;

    setEmpresaSeleccionada([]);
    setCencosSeleccionado([]);
    setTipoDocSeleccionado([]);
    setClienteSeleccionado([]);
    setSerieSeleccionada([]);
    setMonedaSeleccionada([]);
    setUsuarioSeleccionado([]);
    setTipoActividadSeleccionado([]);
  }, [tipoSeguimiento]);

  // ── Filtrado final (tipo + filtros del layout activo, "Fecha de Seguimiento" sin tocar) ──

  const documentosFiltrados = useMemo(() => {
    return documentosDelTipo.filter((doc) => {
      if (!esAgendar) {
        if (empresaSeleccionada.length > 0) {
          if (!empresaSeleccionada.map((o) => o.value).includes(String(doc.EMPRESA_NOMBRE)))
            return false;
        }
        if (cencosSeleccionado.length > 0) {
          if (!cencosSeleccionado.map((o) => o.value).includes(String(doc.CENCOD_NOMBRE)))
            return false;
        }
        if (tipoDocSeleccionado.length > 0) {
          if (!tipoDocSeleccionado.map((o) => o.value).includes(String(doc.TIPO_ID_DOC)))
            return false;
        }
        if (serieSeleccionada.length > 0) {
          if (!serieSeleccionada.map((o) => o.value).includes(String(doc.CABDOC_SERIE)))
            return false;
        }
        if (monedaSeleccionada.length > 0) {
          if (!monedaSeleccionada.map((o) => o.value).includes(String(doc.CABDOC_MONEDA)))
            return false;
        }
        if (Array.isArray(valorRangeSeleccionado) && valorRangeSeleccionado.length === 2) {
          const [minV, maxV] = valorRangeSeleccionado;
          const valor = Number(doc[campoValor]) || 0;
          if (valor < minV || valor > maxV) return false;
        }
      } else {
        if (tipoActividadSeleccionado.length > 0) {
          if (!tipoActividadSeleccionado.map((o) => o.value).includes(String(doc.TIPO_ACTIVIDAD)))
            return false;
        }
      }

      if (clienteSeleccionado.length > 0) {
        if (!clienteSeleccionado.map((o) => o.value).includes(String(doc.NOMBRE_CLIENTE)))
          return false;
      }
      if (usuarioSeleccionado.length > 0) {
        if (!usuarioSeleccionado.map((o) => o.value).includes(String(doc.USU_SEGUIMIENTO)))
          return false;
      }
      if (Array.isArray(fechaRangeSeleccionado) && fechaRangeSeleccionado.length === 2) {
        const [desde, hasta] = fechaRangeSeleccionado;
        const fechaMs = new Date(String(doc.FECHA_SEGUIMIENTO ?? "")).getTime();
        if (Number.isNaN(fechaMs)) return false;
        if (fechaMs < desde.getTime() || fechaMs > hasta.getTime()) return false;
      }

      return true;
    });
  }, [
    documentosDelTipo,
    esAgendar,
    empresaSeleccionada,
    cencosSeleccionado,
    tipoDocSeleccionado,
    serieSeleccionada,
    monedaSeleccionada,
    clienteSeleccionado,
    usuarioSeleccionado,
    tipoActividadSeleccionado,
    valorRangeSeleccionado,
    fechaRangeSeleccionado,
    campoValor,
  ]);

  // ── Árbol (tabla + gráficas) ─────────────────────────────────────────

  const todasLasColumnas = useColumnasDesdeCampo(documentosDelTipo, campoColumna);

  // Cada vez que cambian las columnas disponibles (p.ej. al cambiar "campoColumna"
  // o de tipo de seguimiento), se muestran todas por defecto.
  useEffect(() => {
    setColumnasVisibles(new Set(todasLasColumnas.map((c) => c.key)));
  }, [todasLasColumnas]);

  const columnsFromApi = useMemo(
    () => todasLasColumnas.filter((c) => columnasVisibles.has(c.key)),
    [todasLasColumnas, columnasVisibles],
  );

  const NIVELES_AGRUPACION = useMemo(
    () => construirNivelesDesdeConfig(nivelesActivos),
    [nivelesActivos],
  );

  const obtenerColumnaActiva = useCallback(
    (doc: DetalleSeguimientoGeneral) =>
      String(doc[campoColumna as keyof DetalleSeguimientoGeneral] ?? ""),
    [campoColumna],
  );
  const obtenerValor = useCallback(
    (doc: DetalleSeguimientoGeneral) => (esAgendar ? 1 : Number(doc[campoValor]) || 0),
    [esAgendar, campoValor],
  );
  const idDocumento = useCallback(
    (doc: DetalleSeguimientoGeneral) =>
      esAgendar ? String(doc.ASUNTO_ACTIVIDAD ?? "") : String(doc.CABDOC_NUMERO ?? ""),
    [esAgendar],
  );

  const groupedData = useGroupedTree({
    documentos: documentosFiltrados,
    niveles: NIVELES_AGRUPACION,
    columnas: columnsFromApi,
    obtenerColumnaActiva,
    obtenerValor,
    idDocumento,
  });

  const monedaMap = useMonedaPorColumna(documentosFiltrados, campoColumna);

  const nivelGrafica = clamp(nivelGraficaRaw, 0, Math.max(nivelesActivos.length - 1, 0));
  const opcionesNivelGrafica = nivelesActivos.map((n, i) => ({ value: i, label: n.etiqueta }));

  const nodosParaGrafica = useMemo(() => {
    const recoger = (
      nodos: typeof groupedData,
      depthActual: number,
      depthObjetivo: number,
    ): typeof groupedData => {
      if (depthActual === depthObjetivo) return nodos;
      return nodos.flatMap((n) => recoger(n.children ?? [], depthActual + 1, depthObjetivo));
    };
    return recoger(groupedData, 0, nivelGrafica);
  }, [groupedData, nivelGrafica]);

  const barData = useMemo(() => {
    return columnsFromApi.map((col) => {
      const entry: Record<string, string | number> = { name: col.label };
      nodosParaGrafica.slice(0, 20).forEach((nodo) => {
        entry[nodo.label] = Number(nodo.values?.[col.key] || 0);
      });
      return entry;
    });
  }, [columnsFromApi, nodosParaGrafica]);

  const barKeys = nodosParaGrafica.slice(0, 20).map((n) => n.label);

  const campoDelNivelGrafica = NIVELES_AGRUPACION?.[nivelGrafica]?.campo ?? null;

  const tendenciaTemporal = useMemo(() => {
    const diasMap = new Map<
      string,
      { clave: string; anio: number; mes: number; dia: number; fecha: Date }
    >();

    documentosFiltrados.forEach((doc) => {
      const anio = Number(doc.Anio);
      const mes = Number(doc.Mes);
      const dia = Number(doc.Dia);

      if (!anio || !mes || !dia) return;

      const clave = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

      if (!diasMap.has(clave)) {
        const fecha = new Date(anio, mes - 1, dia);
        diasMap.set(clave, { clave, anio, mes, dia, fecha });
      }
    });

    const dias = Array.from(diasMap.values()).sort((a, b) => a.clave.localeCompare(b.clave));

    if (!campoDelNivelGrafica || dias.length === 0 || nodosParaGrafica.length === 0) {
      return { dias, lineData: [] };
    }

    const nodosVisibles = nodosParaGrafica.slice(0, 10);
    const porNodo: Record<string, Record<string, number>> = {};
    nodosVisibles.forEach((n) => {
      porNodo[n.label] = {};
    });

    documentosFiltrados.forEach((doc) => {
      const valorCampo = String(
        doc[campoDelNivelGrafica as keyof DetalleSeguimientoGeneral] ?? "",
      ).trim();
      const nodoMatch = nodosVisibles.find((n) => String(n.label).trim() === valorCampo);
      if (!nodoMatch) return;

      const anio = Number(doc.Anio);
      const mes = Number(doc.Mes);
      const dia = Number(doc.Dia);
      if (!anio || !mes || !dia) return;

      const clave = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      const bucket = porNodo[nodoMatch.label] ?? {};
      const incremento = esAgendar ? 1 : Number(doc[campoValor]) || 0;
      bucket[clave] = (bucket[clave] || 0) + incremento;
      porNodo[nodoMatch.label] = bucket;
    });

    const lineData = dias.map((d) => {
      const entry: Record<string, string | number> = {
        name: d.fecha.toLocaleDateString("es-GT", { day: "2-digit", month: "short" }),
      };
      nodosVisibles.forEach((n) => {
        const valuesByDay = porNodo[n.label] ?? {};
        entry[n.label] = Number((valuesByDay[d.clave] || 0).toFixed(2));
      });
      return entry;
    });

    return { dias, lineData };
  }, [documentosFiltrados, nodosParaGrafica, campoDelNivelGrafica, esAgendar, campoValor]);

  const lineKeys = nodosParaGrafica.slice(0, 10).map((n) => n.label);

  const totalRegistros = documentosFiltrados.length;
  const hayFiltrosActivos =
    empresaSeleccionada.length > 0 ||
    cencosSeleccionado.length > 0 ||
    tipoDocSeleccionado.length > 0 ||
    clienteSeleccionado.length > 0 ||
    serieSeleccionada.length > 0 ||
    monedaSeleccionada.length > 0 ||
    usuarioSeleccionado.length > 0 ||
    tipoActividadSeleccionado.length > 0;

  // ── Excel export ──────────────────────────────────────────────────────

  const handleExportarExcel = async () => {
    const { ExcelJS, saveAs: saveExcelAs } = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte CXC");

    const encabezado = ["Concepto", ...columnsFromApi.map((c) => c.label), "Total"];
    const headerRow = worksheet.addRow(encabezado);
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF6FF" } };
    });

    const calcularProfundidadMaxima = (nodos: typeof groupedData, actual = 0): number => {
      if (!nodos?.length) return actual;
      return Math.max(...nodos.map((n) => calcularProfundidadMaxima(n.children, actual + 1)));
    };
    const profundidadMaxima = calcularProfundidadMaxima(groupedData);
    const nivelesConValores = new Set([0, 1, profundidadMaxima - 1]);
    const totalesGenerales = columnsFromApi.map(() => 0);

    const formatoCelda = (colKey: string) => {
      if (esAgendar) return "#,##0";
      return monedaMap?.[colKey] === "USD" ? '"$"#,##0.00' : "#,##0.00";
    };

    const agregarNodos = (nodos: typeof groupedData, profundidad: number) => {
      nodos.forEach((nodo) => {
        const valores = columnsFromApi.map((c) => Number(nodo.values?.[c.key] || 0));
        const totalFila = valores.reduce((acc, v) => acc + v, 0);
        const mostrarValores = nivelesConValores.has(profundidad);

        const fila = worksheet.addRow([
          " ".repeat(profundidad) + nodo.label,
          ...(mostrarValores ? valores : valores.map(() => null)),
          mostrarValores ? totalFila : null,
        ]);

        fila.getCell(1).alignment = { indent: profundidad };
        if (nodo.children?.length) fila.font = { bold: true };

        if (mostrarValores) {
          columnsFromApi.forEach((c, i) => {
            fila.getCell(i + 2).numFmt = formatoCelda(c.key);
          });
          fila.getCell(columnsFromApi.length + 2).numFmt = esAgendar ? "#,##0" : "#,##0.00";
        }

        if (profundidad === 0) {
          valores.forEach((v, i) => {
            totalesGenerales[i] = (totalesGenerales[i] ?? 0) + v;
          });
        }

        if (nodo.children?.length) agregarNodos(nodo.children, profundidad + 1);
      });
    };

    agregarNodos(groupedData, 0);

    const totalGeneralGlobal = totalesGenerales.reduce((a, v) => a + v, 0);
    const filaTotal = worksheet.addRow(["TOTAL GENERAL", ...totalesGenerales, totalGeneralGlobal]);
    filaTotal.font = { bold: true };
    filaTotal.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    });
    columnsFromApi.forEach((c, i) => {
      filaTotal.getCell(i + 2).numFmt = formatoCelda(c.key);
    });
    filaTotal.getCell(columnsFromApi.length + 2).numFmt = esAgendar ? "#,##0" : "#,##0.00";
    worksheet.columns.forEach((col, i) => {
      col.width = i === 0 ? 35 : 18;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveExcelAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Reporte_CXC_${(tipoSeguimientoActual?.label ?? "Reporte").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-h-[85vh] overflow-auto bg-surface-1 p-4 md:p-6 space-y-5 relative">
      {cargando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-3 shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">Cargando datos...</span>
          </div>
        </div>
      )}

      {/* ── Filtros requeridos: Tipo de Seguimiento + Desde + Hasta, misma fila ── */}
      <Panel>
        <SectionHeader
          icon={<Filter className="w-4 h-4" />}
          title="Filtros requeridos"
          subtitle="Tipo de seguimiento y rango de fechas para consultar el reporte."
        />
        <div className="p-5 flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
          <div className="w-full sm:w-auto sm:max-w-xs">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Tipo de Seguimiento
            </p>
            <Select value={tipoSeguimiento} onValueChange={setTipoSeguimiento}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecciona un tipo de seguimiento..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_SEGUIMIENTO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Desde
            </p>
            <Input
              type="date"
              value={fechaConsultaInicio}
              onChange={(e) => setFechaConsultaInicio(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="w-full sm:w-auto">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Hasta
            </p>
            <Input
              type="date"
              value={fechaConsultaFin}
              onChange={(e) => setFechaConsultaFin(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {categoria && (
            <Badge
              className={
                hayFiltrosActivos
                  ? "bg-amber-100 text-amber-800 border-amber-300 font-semibold"
                  : "bg-brand-50 text-primary border-brand-200 font-semibold"
              }
              variant="outline"
            >
              {totalRegistros} registro{totalRegistros !== 1 ? "s" : ""}
              {hayFiltrosActivos ? " (filtrado)" : ""}
            </Badge>
          )}
        </div>
      </Panel>

      {!categoria ? (
        <Panel>
          <p className="p-10 text-center text-muted-foreground text-sm">
            Selecciona un tipo de seguimiento para ver el reporte.
          </p>
        </Panel>
      ) : (
        <>
          {/* ── Filtros + configurador (acordeón) ── */}
          <Panel>
            <Accordion type="single" collapsible defaultValue="filtros">
              <AccordionItem value="filtros" className="border-none">
                <AccordionTrigger className="px-5 py-3.5 bg-brand-50 hover:no-underline [&>svg]:hidden">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-3">
                      <Filter className="w-4 h-4 text-primary" />
                      <p className="font-semibold text-primary text-lg">Filtros y configuración</p>
                      {hayFiltrosActivos && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">
                          Filtros activos
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-primary transition-transform duration-200 shrink-0" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Configurador del árbol / niveles */}
                    <div className="lg:col-span-5">
                      <div className="border border-border rounded-xl overflow-hidden h-full">
                        <SectionHeader
                          icon={<Settings2 className="w-4 h-4" />}
                          title="Personaliza tu reporte"
                          subtitle="Define cómo se agrupan y desglosan los datos"
                        />
                        <div className="p-4 space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                              Columnas (qué se desglosa en columnas)
                            </p>
                            <Select value={campoColumna} onValueChange={setCampoColumna}>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Selecciona campo columna" />
                              </SelectTrigger>
                              <SelectContent>
                                {CAMPOS_COLUMNA.map((c) => (
                                  <SelectItem key={c.campo} value={c.campo}>
                                    {c.etiqueta}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <NivelesBuilder
                            camposDisponibles={CAMPOS_DISPONIBLES}
                            nivelesActivos={nivelesActivos}
                            onChange={setNivelesActivos}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filtros */}
                    <div className="lg:col-span-7">
                      <div className="border border-border rounded-xl overflow-hidden h-full">
                        <SectionHeader
                          icon={<Filter className="w-4 h-4" />}
                          title="Filtros"
                          subtitle="Acota el universo de seguimientos a analizar"
                        />
                        <div className="p-4 space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {!esAgendar && (
                              <>
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                                    EMPRESA
                                  </p>
                                  <SelectFiltro
                                    options={opcionesEmpresa}
                                    value={empresaSeleccionada}
                                    onChange={setEmpresaSeleccionada}
                                    searchable
                                    multi
                                    emitObjects
                                    placeholder="Selecciona empresa"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                                    CENTRO DE COSTO
                                  </p>
                                  <SelectFiltro
                                    options={opcionesCencos}
                                    value={cencosSeleccionado}
                                    onChange={setCencosSeleccionado}
                                    searchable
                                    multi
                                    emitObjects
                                    placeholder="Selecciona centro de costo"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                                    TIPO DOCUMENTO
                                  </p>
                                  <SelectFiltro
                                    options={opcionesTipoDoc}
                                    value={tipoDocSeleccionado}
                                    onChange={setTipoDocSeleccionado}
                                    searchable
                                    multi
                                    emitObjects
                                    placeholder="Selecciona tipo documento"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                                    SERIE
                                  </p>
                                  <SelectFiltro
                                    options={opcionesSerie}
                                    value={serieSeleccionada}
                                    onChange={setSerieSeleccionada}
                                    searchable
                                    multi
                                    emitObjects
                                    placeholder="Selecciona serie"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                                    MONEDA
                                  </p>
                                  <SelectFiltro
                                    options={opcionesMoneda}
                                    value={monedaSeleccionada}
                                    onChange={setMonedaSeleccionada}
                                    searchable
                                    multi
                                    emitObjects
                                    placeholder="Selecciona moneda"
                                  />
                                </div>
                              </>
                            )}

                            {esAgendar && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                                  TIPO DE ACTIVIDAD
                                </p>
                                <SelectFiltro
                                  options={opcionesTipoActividad}
                                  value={tipoActividadSeleccionado}
                                  onChange={setTipoActividadSeleccionado}
                                  searchable
                                  multi
                                  emitObjects
                                  placeholder="Selecciona tipo de actividad"
                                />
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                                CLIENTE
                              </p>
                              <SelectFiltro
                                options={opcionesCliente}
                                value={clienteSeleccionado}
                                onChange={setClienteSeleccionado}
                                searchable
                                multi
                                emitObjects
                                placeholder="Selecciona cliente"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                                USUARIO
                              </p>
                              <SelectFiltro
                                options={opcionesUsuario}
                                value={usuarioSeleccionado}
                                onChange={setUsuarioSeleccionado}
                                searchable
                                multi
                                emitObjects
                                placeholder="Selecciona usuario"
                              />
                            </div>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {!esAgendar && (
                              <RangeSelect
                                label={
                                  categoria === "aplicar_recibo"
                                    ? "Valor Parcial Aplicado"
                                    : "Valor Documento"
                                }
                                min={minValor}
                                max={maxValor}
                                step={1}
                                value={valorRangeSeleccionado}
                                onChange={setValorRangeSeleccionado}
                                formatValue={(val: number) => val.toFixed(2)}
                              />
                            )}
                            {fechaRangeSeleccionado ? (
                              <DateRangeSelect
                                label="Fecha de Seguimiento"
                                dateMin={minFecha}
                                dateMax={maxFecha}
                                value={fechaRangeSeleccionado}
                                onChange={setFechaRangeSeleccionado}
                                tipo="date"
                              />
                            ) : (
                              <div className="flex items-center justify-center text-sm text-muted-foreground">
                                Sin datos para este rango.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Panel>

          {/* ── Tabla ── */}
          <Panel>
            <SectionHeader
              icon={<Table2 className="w-4 h-4" />}
              title="Resumen agrupado"
              subtitle="Detalle jerárquico según los niveles configurados"
              action={
                <div className="flex items-center gap-2">
                  <ColumnSelect
                    columns={todasLasColumnas}
                    visibleKeys={columnasVisibles}
                    onChange={setColumnasVisibles}
                  />
                  <Button
                    size="sm"
                    onClick={handleExportarExcel}
                    disabled={nivelesActivos.length === 0}
                    className="bg-brand-800 hover:bg-brand-800 text-white gap-1.5 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Excel
                  </Button>
                </div>
              }
            />
            <div className={nivelesActivos.length === 0 ? "" : "p-5"}>
              {nivelesActivos.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground text-sm">
                  Marca al menos un campo en &ldquo;Niveles del árbol&rdquo; para ver el reporte.
                </p>
              ) : (
                <TablaDouble
                  data={groupedData}
                  columns={columnsFromApi}
                  rowKey="id"
                  showTotals
                  firstColumnWidth={250}
                  monedaMap={esAgendar ? {} : monedaMap}
                />
              )}
            </div>
          </Panel>

          {/* ── Bar chart ── */}
          <Panel>
            <SectionHeader
              icon={<BarChart2 className="w-4 h-4" />}
              title="Comparativo gráfico"
              {...(barKeys.length > 10
                ? { subtitle: "Se muestran los primeros 20 elementos del nivel seleccionado" }
                : {})}
              {...(opcionesNivelGrafica.length > 1
                ? {
                    action: (
                      <Select
                        value={String(nivelGrafica)}
                        onValueChange={(v) => setNivelGrafica(Number(v))}
                      >
                        <SelectTrigger className="h-8 text-xs w-[180px]">
                          <SelectValue placeholder="Nivel a graficar" />
                        </SelectTrigger>
                        <SelectContent>
                          {opcionesNivelGrafica.map((op) => (
                            <SelectItem key={op.value} value={String(op.value)}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ),
                  }
                : {})}
            />
            <div className="p-5">
              {barData.length === 0 || barKeys.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground text-sm">
                  Sin datos para mostrar en la gráfica.
                </p>
              ) : (
                <BarraComparativa barData={barData} barKeys={barKeys} colores={COLORES_GRAFICA} />
              )}
            </div>
          </Panel>

          {/* ── Line chart (tendencia mensual) ── */}
          <Panel>
            <SectionHeader
              icon={<BarChart2 className="w-4 h-4" />}
              title="Tendencia mensual por elemento"
              {...(lineKeys.length > 0
                ? {
                    subtitle: `Evolución mensual por ${nivelesActivos[nivelGrafica]?.etiqueta ?? "nivel"}${lineKeys.length >= 10 ? " (primeros 10)" : ""}`,
                  }
                : {})}
            />
            <div className="p-5">
              {tendenciaTemporal.lineData.length === 0 || lineKeys.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground text-sm">
                  Sin datos para mostrar la tendencia temporal.
                </p>
              ) : (
                <TendenciaMensual
                  lineData={tendenciaTemporal.lineData}
                  lineKeys={lineKeys}
                  colores={COLORES_GRAFICA}
                />
              )}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
};

export default DashcxcClient;
