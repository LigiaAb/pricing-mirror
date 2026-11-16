// GridVersionesDetalles.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Grid, Tooltip, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import moment from "moment";
import useCatalogosCotizacion from "../../../hooks/useCatalogosCotizacion";

import { api } from "../../../../../../api";
import TablaEditableComponent from "../../../../../../components/Tabla/TablaEditableComponent";
import LoaderComponent from "../../../../../../components/Loader/LoaderComponent";
import SelectComponent from "../../../../../../components/Formulario/SelectComponent";

import { CODS_ESTADOS, COLORES_ESTADOS, ICONOS_ESTADOS } from "../../../../../../constants/estados";
import { useFetchCentrosCosto, useFetchMonedas, useFetchTipos } from "../../../../../../hooks/Fetch/useFetchCatalog";
import { useFetchCriterios, useFetchRubros, useFetchServicios, useFetchCommodity } from "../../../../../../hooks/Fetch/useFetchTarifas";

import GenerarFiltrosCriterios from "../../../../../../pages/Tarifas/Calculo/GenerarFiltrosCriterios";
import GenerarRubrosDueCarrier from "../../../../../../pages/Tarifas/Calculo/GenerarRubrosDueCarrier";
import GenerarRubrosDueAgent from "../../../../../../pages/Tarifas/Calculo/GenerarRubrosDueAgent";
import GenerarTotalRubros from "../../../../../../pages/Tarifas/Calculo/GenerarTotalRubros";

import generarPDF from "../../../FormularioCotizacion/GenerarPdf";
import { useFetchAllEntidadesSimple } from "../../../../../../hooks/Fetch/useFetchEntidades";
import CODS_TIPOS_ENTIDAD, { NOMBRES_TIPOS_ENTIDAD } from "../../../../../../constants/tiposEntidades";
import GenerarFormularioDatosPdf from "@/pages/Tarifas/Calculo/GenerarFormularioDatosPdf";
import DialogComponent from "@/components/Dialog/DialogComponent";
import { Download, Upload } from "lucide-react";
import { AgregarArchivoDescripcionSPOT, GenerarCeldaNombre, GenerarCeldaValor } from "@/pages/Tarifas/Calculo/RenderizadosDePartes";
import GenerarRubrosScalling from "@/pages/Tarifas/Calculo/GenerarRubrosScalling";
import BandaAlertaComponent from "@/components/Alertas/BandaAlertaComponent";
import { convertClasificacionServicio } from "@/constants/clasifacionesTarifas";
import SubirArchivoComponent2 from "@/components/Formulario/SubirArchivoComponent2";
import { obtenerOrdenGrupoDefault } from "../../helpers/manejo_grupos";

/* =========================
   Helpers (PUROS)
========================= */
const COD_ENTIDAD_DUE_AGENT = 13624;
const CLASIFICACIONES_DUE_CARRIER = [274, 276, 278, 347];
const CLASIFICACIONES_DUE_AGENT = [275, 277];

const estiloBotonIdioma = (currentIdioma, idioma = "es") => {
  const esIdioma = currentIdioma === idioma;
  return {
    width: "50%",
    mb: 3,
    justifyContent: "center",
    textAlign: "center",
    cursor: esIdioma ? "default" : "pointer",
    color: esIdioma ? "white.main" : undefined,
    bgcolor: esIdioma ? "primary.main" : undefined,
    borderColor: "primary.main",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 1,
    p: 1,
  };
};

const getClasificacionServicio = (item) => {
  return item?.servicio?.clasificacion ?? item?.clasificacion ?? item?.servicio?.servicio_clasificacion ?? item?.servicio_clasificacion ?? null;
};

const getEntidadIdRubro = (item) => {
  return item?.entidad_id ?? item?.cod_entidad ?? item?.servicio?.entidad_id ?? item?.servicio?.cod_entidad ?? item?.metodo?.entidad_id ?? null;
};

const esRubroDueAgent = (item) => {
  const clasificacion = Number(getClasificacionServicio(item));
  if (clasificacion == null || clasificacion === "") return false;
  return CLASIFICACIONES_DUE_AGENT.includes(clasificacion);
  // return String(getEntidadIdRubro(item)) === String(COD_ENTIDAD_DUE_AGENT);
};

const esRubroDueCarrier = (item) => {
  const clasificacion = Number(getClasificacionServicio(item));

  if (clasificacion == null || clasificacion === "") return true;
  return CLASIFICACIONES_DUE_CARRIER.includes(clasificacion);
  // const entidadId = getEntidadIdRubro(item);

  // if (entidadId == null || entidadId === "") return false;

  // return String(entidadId) !== String(COD_ENTIDAD_DUE_AGENT);
};

const filtrarRubrosDuplicados = (rubros = []) => {
  const vistos = new Set();

  return (rubros || []).filter((rubro) => {
    const codRubro = rubro?.cod_rubro;
    const codServicio = rubro?.cod_servicio ?? rubro?.servicio?.cod_servicio ?? "";

    const entidadId = rubro?.entidad_id ?? rubro?.servicio?.entidad_id ?? "";

    const key = `${codRubro}|${codServicio}|${entidadId}|${rubro?.es_tarifa_spot ? "SPOT" : "NORMAL"}`;

    if (vistos.has(key)) return false;

    vistos.add(key);
    return true;
  });
};

const filtrarServicios = (data, criterios = {}, criteriosNegativos = {}) =>
  (data || [])
    .map((rubro) => {
      const serviciosFiltrados = (rubro.servicios || [])
        .map((servicio) => ({
          ...servicio,
          metodo: servicio?.metodo ?? servicio?.cobertura ?? servicio?.porcentaje ?? {},
        }))
        .filter(
          (servicio) =>
            Object.entries(criterios).every(([key, value]) => {
              if (key === "servicio_clasificacion") return String(convertClasificacionServicio(Number(servicio[key]))) === String(value);
              if (key in servicio) return String(servicio[key]) === String(value);
              if (key in (servicio.metodo || {})) return String(servicio.metodo[key]) === String(value);
              return false;
            }) &&
            !Object.entries(criteriosNegativos).some(([key, value]) => {
              if (key in servicio) return String(servicio[key]) === String(value);
              if (key in (servicio.metodo || {})) return String(servicio.metodo[key]) === String(value);
              return false;
            }),
        );

      if (!serviciosFiltrados.length) return null;
      return { ...rubro, servicios: serviciosFiltrados };
    })
    .filter(Boolean);

const extraerEntidadIdDeRubrosGuardados = (rubrosGuardados = [], codigosFletes = []) => {
  if (!rubrosGuardados?.length) return null;

  const codsFlete = new Set(codigosFletes.map((r) => r.cod_rubro));
  const rubroFlete = rubrosGuardados.find((r) => r.es_flete === true || codsFlete.has(r.cod_rubro));

  if (rubroFlete?.entidad_id) return rubroFlete.entidad_id;

  const ids = rubrosGuardados.map((r) => r.entidad_id ?? r.cod_entidad ?? null).filter(Boolean);
  if (!ids.length) return null;

  const conteo = ids.reduce((acc, id) => ((acc[id] = (acc[id] || 0) + 1), acc), {});
  return Number(Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a])[0]);
};

// NO usar estos campos para disparar "obtenerFlete"
const quitarValorFlete = (criterios = {}) => {
  const { valor_flete, flete_fuente, express, categoria_transporte, ...rest } = criterios || {};
  return rest;
};

const normalizeBool = (v) => {
  if (v === true || v === false) return v;
  if (v == null) return false;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "si" || s === "sí" || s === "y" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no" || s === "n") return false;
  }
  return Boolean(v);
};

const safeStringify = (value, space = 0, maxLen = 4000) => {
  try {
    const seen = new WeakSet();
    const str =
      JSON.stringify(
        value,
        (key, val) => {
          if (typeof val === "object" && val !== null) {
            if (seen.has(val)) return "[Circular]";
            seen.add(val);
          }
          return val;
        },
        space,
      ) || "";
    return str.length > maxLen ? `${str.slice(0, maxLen)}... [truncated]` : str;
  } catch {
    return "";
  }
};

const unirDetalles = (...fuentes) => {
  const items = fuentes.flatMap((src) => {
    if (Array.isArray(src)) return src;
    if (src == null) return [];
    return [src];
  });

  const parseTextoDetalle = (texto) =>
    String(texto || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf(":");
        if (idx === -1) return { tarifadetalle_descripcion: part };

        const tipo = part.slice(0, idx).trim();
        const desc = part.slice(idx + 1).trim();
        return {
          ...(tipo ? { tipo_desc: tipo } : {}),
          ...(desc ? { tarifadetalle_descripcion: desc } : {}),
          custom: true,
        };
      })
      .filter((d) => d.tipo_desc || d.tarifadetalle_descripcion || d.tarifadetalle_valor);

  const normalizados = items.flatMap((it) => {
    if (it == null) return [];
    if (typeof it === "string") return parseTextoDetalle(it);
    if (typeof it === "number") return parseTextoDetalle(String(it));
    if (typeof it === "object") {
      if (it.tipo_desc || it.tarifadetalle_descripcion || it.tarifadetalle_valor) return [it];
      const texto = it.detalle ?? it.descripcion ?? it.valor ?? "";
      if (!texto) return [];
      return parseTextoDetalle(texto);
    }
    return [];
  });

  const seen = new Set();
  return normalizados.filter((it) => {
    const key = safeStringify(it);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const dedupeOpcionesPorValue = (arr = []) =>
  (arr || []).reduce((acc, it) => {
    if (!acc.some((x) => String(x.value) === String(it.value))) acc.push(it);
    return acc;
  }, []);

const getCodRubroDesdeOpcionCarrier = (value) => {
  const parts = String(value ?? "").split("|");
  return parts[1] || null;
};

const getCodServicioDesdeOpcionCarrier = (value) => {
  const parts = String(value ?? "").split("|");
  return parts[2] || null;
};

const getCategoriaDesdeOpcionCarrier = (value) => {
  const parts = String(value ?? "").split("|");
  return parts[4] || null;
};

const getFleteDesdeOpcionCarrier = (value) => {
  const parts = String(value ?? "").split("|");
  const raw = parts[5];

  if (raw == null || String(raw).trim() === "") return null;

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const obtenerVentaRubro = (item) => {
  return Number(item?.servicio?.metodo?.venta ?? item?.metodo?.venta ?? item?.venta ?? 0);
};

const calcularTotalRubros = (rubros = []) => {
  return (rubros || []).reduce((acc, item) => acc + obtenerVentaRubro(item), 0);
};

/* =========================
   Componente
========================= */

const GridVersionesDetalles = ({ cotizacion, plantillaSeleccionada, plantillasRubros }) => {
  /* -------- Redux -------- */
  const { cod_usuario, nombreUsuario } = useSelector((state) => state.auth);
  const { currentCentroCosto } = useSelector((state) => state.menu);
  const { movil: esMovil } = useSelector((state) => state.screen);

  /* -------- Catálogos -------- */
  const centroDeCosto = useFetchCentrosCosto({
    cod_cc: currentCentroCosto?.cod_cc,
  });
  const rubrosCatalogo = useFetchRubros();
  const monedas = useFetchMonedas();
  const tiposReasonCodeSpot = useFetchTipos({ tipo_tabla: "REASON_CODE_SPOT" });
  const listaProveedores = useFetchAllEntidadesSimple([NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR]], { tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR] }, {}, undefined, 1);
  const servicios = useFetchServicios();
  const listaTiposCriterios = useFetchCriterios();
  const comodities = useFetchCommodity();
  const categoriaTransporte = useFetchTipos({
    tipo_tabla: "CATEGORIA_TRANSPORTE",
  });
  const fetchTipos = useFetchTipos();

  /* -------- Loaders -------- */
  const [loaders, setLoaders] = useState({
    versiones: 0,
    detalleVersion: 0,
    flete: 0,
    tarifas: 0,
    guardar: 0,
    pdf: 0,
  });

  const [loaderMessages, setLoaderMessages] = useState({
    versiones: "",
    detalleVersion: "",
    flete: "",
    tarifas: "",
    guardar: "",
    pdf: "",
  });

  const startLoader = useCallback((section, message = "") => {
    setLoaders((prev) => ({
      ...prev,
      [section]: (prev[section] || 0) + 1,
    }));

    if (message) {
      setLoaderMessages((prev) => ({
        ...prev,
        [section]: message,
      }));
    }
  }, []);

  const stopLoader = useCallback((section) => {
    setLoaders((prev) => ({
      ...prev,
      [section]: Math.max((prev[section] || 0) - 1, 0),
    }));
  }, []);

  const resetAllLoaders = useCallback(() => {
    setLoaders({
      versiones: 0,
      detalleVersion: 0,
      flete: 0,
      tarifas: 0,
      guardar: 0,
      pdf: 0,
    });

    setLoaderMessages({
      versiones: "",
      detalleVersion: "",
      flete: "",
      tarifas: "",
      guardar: "",
      pdf: "",
    });
  }, []);

  const totalLoadersActivos = useMemo(() => Object.values(loaders).reduce((acc, n) => acc + n, 0), [loaders]);
  const cargandoGlobal = totalLoadersActivos > 0;

  const textoLoaderGlobal = useMemo(() => {
    const orden = ["guardar", "tarifas", "flete", "detalleVersion", "versiones", "pdf"];
    const activo = orden.find((key) => loaders[key] > 0 && loaderMessages[key]);
    return activo ? loaderMessages[activo] : "Cargando";
  }, [loaders, loaderMessages]);

  /* -------- Versiones -------- */
  const [versiones, setVersiones] = useState([]);
  const [versionActual, setVersionActual] = useState(null);
  const [previewPdf, setPreviewPdf] = useState(false);
  const [pdfUri, setPdfUri] = useState(null);
  const [idioma, setIdioma] = useState("es");
  const [funcionDescargaPdf, setFuncionDescargaPdf] = useState(() => {});
  const [pdfActual, setPdfActual] = useState(null);

  /* -------- Data de versión seleccionada -------- */
  const [rubrosSeleccionados, setRubrosSeleccionados] = useState([]);
  const [listaDimensiones, setListaDimensiones] = useState([]);
  const [criteriosSeleccionados, setCriteriosSeleccionados] = useState([]);
  const [valoresDefaultCriterios, setValoresDefaultCriterios] = useState({});
  const [criterios, setCriterios] = useState({});
  const [criterioCobertura, setCriterioCobertura] = useState({});
  const [recalcToken, setRecalcToken] = useState(0);
  const [plantilla, setPlantilla] = useState(null);
  const [legs, setLegs] = useState([]);

  /* -------- Entidad / Flete -------- */
  const [entidadIdGuardadaEnVersion, setEntidadIdGuardadaEnVersion] = useState(null);

  const [fletesCalc, setFletesCalc] = useState([]);

  const [entidadesConFlete, setEntidadesConFlete] = useState([]);
  const [entidadConFlete, setEntidadConFlete] = useState(null);

  /* -------- Resultados cálculo -------- */
  const [valoresCalculados, setValoresCalculados] = useState({});
  const [valoresCalculadosPorEntidad, setValoresCalculadosPorEntidad] = useState([]);
  const [valoresCalculadosScale, setValoresCalculadosScale] = useState([]);
  const [valoresCalculadosInternos, setValoresCalculadosInternos] = useState([]);
  const [rubrosSeleccionadosDueAgent, setRubrosSeleccionadosDueAgent] = useState([]);
  const [valoresCalculadosDueCarrierBasadoEnDueAgent, setValoresCalculadosDueCarrierBasadoEnDueAgent] = useState([]);
  const [totalDueAgentSeleccionado, setTotalDueAgentSeleccionado] = useState(0);

  /* -------- Datos a Guardar -------- */
  const [mostrarSolicitarArchivoSPOT, setMostrarSolicitarArchivoSPOT] = useState(false);
  const [archivoSPOT, setArchivoSPOT] = useState(null);
  const [descripcionSPOT, setDescripcionSPOT] = useState("");
  const [reasonCodeSPOT, setReasonCodeSPOT] = useState(null);

  /* -------- Datos a Guardar -------- */
  const [listaDimensionesIngresadas, setListaDimensionesIngresadas] = useState([]);
  const [rubrosConGrupos, setRubrosConGrupos] = useState([]);
  const [totalesCriteriosIngresados, setTotalesCriteriosIngresados] = useState([]);

  /* -------- Errores -------- */
  const [hayError, setHayError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* -------- Validacion de Partes -------- */
  const [dueAgentIsValid, setDueAgentIsValid] = useState(false);
  const [rubrosProcesadosDueCarrier, setRubrosProcesadosDueCarrier] = useState([]);
  const [tarifasSpotDueCarrier, setTarifasSpotDueCarrier] = useState([]);
  const [valorFleteCarrierManual, setValorFleteCarrierManual] = useState(null);

  /* -------- Cancelación/última petición -------- */
  const fleteReqKeyRef = useRef("");
  const abortFleteRef = useRef(null);

  // dedupe de recalcular tarifas
  const tarifaReqKeyRef = useRef("");

  const [resetCalcToken, setResetCalcToken] = useState(0);

  /* =========================
     Derivados / memo
  ========================= */

  const valoresCalculadosPorEntidadOrdenados = useMemo(() => {
    return [...(valoresCalculadosPorEntidad || [])].sort((a, b) => {
      const esDueCarrier = (item) => {
        return (item?.entidad_id ?? item?.servicio?.entidad_id ?? item?.metodo?.entidad_id) !== 13624;
      };
      const obtenerOrdenRubro = (cod_rubro, es_flete) => {
        const cod = Number(cod_rubro);

        if (es_flete) return 1; // FLETE
        if (cod === 20) return 3; // Tasa por Servicio Aduanero
        if ([99, 41, 81].includes(cod)) return 4; // Cargos Cropa
        if ([12, 1].includes(cod)) return 5; // Recolección
        if (cod === 133) return 7; // IVA

        return esDueCarrier ? 2 : null; // Cargos Línea Aérea / REMANENTE_DUE_CARRIER
      };

      return obtenerOrdenRubro(a?.cod_rubro, a?.es_flete) - obtenerOrdenRubro(b?.cod_rubro, b?.es_flete);
    });
  }, [valoresCalculadosPorEntidad]);

  const isReadOnly = useMemo(() => {
    if (!versionActual) return true;
    const esNueva = versionActual?.isNew === true || Number(versionActual?.cod_cotizaciondetalle) === 0;
    return !esNueva;
  }, [versionActual]);

  const cod_cotizacion_cabecera = cotizacion?.cod_cotizacion_cabecera;

  const filtros = useMemo(
    () => ({
      cod_empresa: cotizacion.cod_empresa,
      cod_cc: cotizacion.cod_cc,
      cod_tipo_transporte: cotizacion.cod_tipo_transporte,
      cod_tipo_servicio: cotizacion.cod_tipo_servicio,
      cod_tipo_carga: cotizacion.cod_tipo_carga,
      cod_clasificacion_carga: cotizacion.cod_clasificacion_carga,
      incoterm_id: cotizacion.incoterm_id,
      cod_tipo_pago: cotizacion.cod_tipo_pago,
      entidad_id: cotizacion.entidad_id,
      cod_puntoenlace_destino: cotizacion.cod_puntoenlace_destino,
      cod_puntoenlace_origen: cotizacion.cod_puntoenlace_origen,
      cod_continente_origen: cotizacion.cod_continente_origen,
      cod_continente_destino: cotizacion.cod_continente_destino,
      cod_pais_origen: cotizacion?.cod_pais_origen ?? null,
      cod_pais_destino: cotizacion?.cod_pais_destino ?? null,
    }),
    [cotizacion],
  );

  const codigosFletes = useMemo(() => (rubrosCatalogo.data || []).filter((i) => i.es_flete === true), [rubrosCatalogo.data]);

  const criteriosParaFlete = useMemo(() => quitarValorFlete(criterios), [criterios]);

  const criteriosParaFleteKey = useMemo(() => {
    const obj = criteriosParaFlete || {};
    return Object.keys(obj)
      .sort()
      .map((k) => {
        const v = obj[k];
        const vv = typeof v === "object" ? safeStringify(v) : String(v);
        return `${k}:${vv}`;
      })
      .join("|");
  }, [criteriosParaFlete]);

  const rubrosDueCarrierConSpot = useMemo(() => [...(valoresCalculadosPorEntidadOrdenados || []), ...(tarifasSpotDueCarrier || [])], [valoresCalculadosPorEntidadOrdenados, tarifasSpotDueCarrier]);

  const rubrosDueAgentSinDuplicados = useMemo(() => filtrarRubrosDuplicados(valoresCalculadosInternos), [valoresCalculadosInternos]);

  const rubrosDueCarrierSinDuplicados = useMemo(() => filtrarRubrosDuplicados(rubrosDueCarrierConSpot), [rubrosDueCarrierConSpot]);

  const rubrosParaTotal = React.useMemo(
    () => [...(rubrosProcesadosDueCarrier || []), ...rubrosSeleccionadosDueAgent, ...(valoresCalculadosDueCarrierBasadoEnDueAgent || []), ...(valoresCalculadosScale || [])],
    [rubrosProcesadosDueCarrier, rubrosSeleccionadosDueAgent, valoresCalculadosDueCarrierBasadoEnDueAgent, valoresCalculadosScale],
  );

  const esFlete = (r) => r?.es_flete === true;

  const rubrosConGruposConCW = useMemo(() => {
    const cw = criterios?.valor_cw;
    const tipo = totalesCriteriosIngresados?.valor?.tipo || "KILOS";
    if (cw == null || cw === "") return rubrosConGrupos;

    return (rubrosConGrupos || []).map((r) => {
      if (!esFlete(r)) return r;
      const detalleStr = r?.detalle ?? "";
      const partes = detalleStr ? detalleStr.split(", ").filter(Boolean) : [];
      return { ...r, detalle: [...partes].join(", ") };
    });
  }, [rubrosConGrupos, criterios?.valor_cw, totalesCriteriosIngresados]);

  const entidadTieneRubroScale = useMemo(
    () => entidadConFlete && entidadConFlete?.entidad_id && servicios.data?.find((s) => entidadConFlete.entidad_id === s.entidad_id && s.cod_rubro === 134),
    [entidadConFlete, servicios.data],
  );

  /* =========================
     Flags express + entidades por rubro
  ========================= */

  const labelCategoriaTransporte = useCallback(
    (servicio) => {
      const nombreDirecto =
        servicio?.categoria_transporte_desc || servicio?.categoria_transporte_nombre || servicio?.metodo?.categoria_transporte_desc || servicio?.metodo?.categoria_transporte_nombre || "";

      if (String(nombreDirecto).trim()) return String(nombreDirecto).trim().toUpperCase();

      const codCategoria = servicio?.cod_categoria_transporte ?? servicio?.categoria_transporte ?? servicio?.metodo?.cod_categoria_transporte ?? servicio?.metodo?.categoria_transporte;

      if (codCategoria == null || codCategoria === "" || String(codCategoria) === "0") return "";

      const cat = (categoriaTransporte.data || []).find((c) => String(c.value ?? c.cod_tipo) === String(codCategoria));

      return String(cat?.label ?? cat?.nom_tipo ?? "")
        .trim()
        .toUpperCase();
    },
    [categoriaTransporte.data],
  );

  // CAMBIAR la firma y los usos internos:
  const construirOpcionCarrier = useCallback(
    (servicio, rubro) => {
      // ← era: (servicio, fuente)

      const tags = [rubro?.nombre_rubro ?? ""].filter(Boolean); // ← era: fuente === "EXPRESS" ? ...
      const helppers = [rubro?.nombre_rubro ?? ""].filter(Boolean); // ← era: fuente === "EXPRESS" ? ...

      const categoria = labelCategoriaTransporte(servicio);
      if (categoria) tags.push(categoria);
      if (categoria) helppers.push(categoria);

      const fleteVenta = servicio?.metodo?.venta;
      if (fleteVenta != null && String(fleteVenta).trim() !== "") tags.push(`FLETE ${fleteVenta}`);

      const tipo_carga = fetchTipos.data.find((t) => t.value === servicio.cod_tipo_carga);
      if (tipo_carga) tags.push(tipo_carga?.label);
      if (tipo_carga) helppers.push(tipo_carga?.label);

      const clasificacion_carga = fetchTipos.data.find((t) => t.value === servicio.cod_clasificacion_carga);
      if (clasificacion_carga) tags.push(clasificacion_carga?.label);
      if (clasificacion_carga) helppers.push(clasificacion_carga?.label);

      const moneda = monedas.data?.find((m) => servicio?.metodo?.cod_moneda_venta === m.cod_moneda)?.SIMBOLO_MONEDA;

      const value = [
        String(servicio.entidad_id ?? ""),
        rubro?.cod_rubro ?? "",
        servicio?.cod_servicio ?? "",
        rubro?.nombre_rubro ?? "", // ← era: fuente === "EXPRESS" ? "EXPRESS" : "NORMAL"
        categoria || "",
        fleteVenta != null && String(fleteVenta).trim() !== "" ? String(fleteVenta) : "",
      ].join("|");

      // console.log("🔵 [CARRIER OPTION]", {
      //   entidad_id: servicio.entidad_id,
      //   entidad_nombre: servicio.entidad_nombre,

      //   cod_rubro: rubro?.cod_rubro,
      //   cod_servicio: servicio?.cod_servicio,

      //   categoriaDirecta: servicio?.categoria_transporte,
      //   codCategoriaDirecta: servicio?.cod_categoria_transporte,

      //   metodoCategoria: servicio?.metodo?.categoria_transporte,
      //   metodoCodCategoria: servicio?.metodo?.cod_categoria_transporte,

      //   criterioCategoria: criterios?.categoria_transporte,

      //   categoriaCalculada: categoria,

      //   fleteVenta,

      //   value,
      // });

      return {
        entidad_id: servicio.entidad_id,
        entidad_nombre: servicio.entidad_nombre,
        value,
        label: `${servicio.entidad_nombre}${tags.length ? ` (${tags.join(" | ")})` : ""}`,
        render: (
          <Grid container direction="row" width="100%" columnSpacing={1}>
            <Grid size={"grow"} color="primary.main" sx={{ whiteSpace: "normal", overflow: "visible", wordBreak: "break-word", lineHeight: 1.1 }}>
              <GenerarCeldaNombre
                textAlign="left"
                nombre={`${servicio.entidad_nombre}`}
                nombre_proveedor={
                  helppers.join(
                    " - ",
                  ) /* `${categoria ? `${categoria} - ` : ""}${rubro?.nombre_rubro ? `${rubro?.nombre_rubro} - ` : ""} ${tipo_carga?.label ? `${tipo_carga?.label} - ` : ""} ${clasificacion_carga?.label ? `${clasificacion_carga?.label}` : ""}` */
                } // ← era: EXPRESS/NORMAL
              />
            </Grid>
            <Grid size={3}>
              <GenerarCeldaValor moneda={moneda ? `FLETE: ${moneda}` : ""} valor={Number(servicio?.metodo?.venta || 0)} total />
            </Grid>
          </Grid>
        ),
      };
    },
    [labelCategoriaTransporte, monedas.data, fetchTipos.data],
  );

  const categoriaSeleccionada = useMemo(() => getCategoriaDesdeOpcionCarrier(entidadConFlete?.value), [entidadConFlete?.value]);
  const getEntidadIdDesdeOpcionCarrier = useCallback((value) => String(value ?? "").split("|")[0] || null, []);
  const entidadSeleccionadaId = useMemo(() => getEntidadIdDesdeOpcionCarrier(entidadConFlete?.value), [entidadConFlete?.value, getEntidadIdDesdeOpcionCarrier]);
  const fleteSeleccionado = useMemo(() => getFleteDesdeOpcionCarrier(entidadConFlete?.value), [entidadConFlete?.value]);
  const codRubroFleteSeleccionado = useMemo(() => getCodRubroDesdeOpcionCarrier(entidadConFlete?.value), [entidadConFlete?.value]);
  const codServicioFleteSeleccionado = useMemo(() => getCodServicioDesdeOpcionCarrier(entidadConFlete?.value), [entidadConFlete?.value]);

  const entidadesConFleteSegunExpress = useMemo(
    () =>
      dedupeOpcionesPorValue(
        (fletesCalc || []).flatMap((rubro) =>
          (rubro.servicios || [])
            .filter((s) => {
              if (!plantillaSeleccionada) return true;

              return String(s.entidad_id) === String(plantillaSeleccionada?.carrier_id);
            })
            .slice()
            .sort((a, b) => Number(a?.entidad_id || 0) - Number(b?.entidad_id || 0))
            .map((s) => construirOpcionCarrier(s, rubro)),
        ),
      ),
    [fletesCalc, construirOpcionCarrier],
  );

  const valoresDefaultParaFiltros = useMemo(() => valoresDefaultCriterios, [valoresDefaultCriterios]);

  /* =========================
     UI helpers
  ========================= */

  const idxRubros = useMemo(() => new Map((rubrosCatalogo.data || []).map((r) => [String(r.cod_rubro), r])), [rubrosCatalogo.data]);
  const idxServicios = useMemo(() => new Map((servicios.data || []).map((s) => [String(s.cod_servicio), s])), [servicios.data]);
  const idxMonedas = useMemo(() => new Map((monedas.data || []).map((m) => [String(m.cod_moneda), m])), [monedas.data]);
  const idxEntidades = useMemo(() => {
    const arr = listaProveedores.data?.data || [];
    return new Map(arr.map((e) => [String(e.entidad_id ?? e.cod_entidad), e]));
  }, [listaProveedores.data?.data]);

  const filtrarServiciosPorClasificaciones = useCallback(
    (data, clasificaciones = [], incluirNull = false) =>
      (data || [])
        .map((rubro) => {
          const serviciosFiltrados = (rubro.servicios || [])
            .map((servicio) => ({ ...servicio, metodo: servicio?.metodo ?? servicio?.cobertura ?? servicio?.porcentaje ?? {} }))
            .filter((servicio) => {
              const servicioCatalogo = idxServicios.get(String(servicio?.cod_servicio));

              const clasificacion = servicio?.clasificacion ?? servicioCatalogo?.clasificacion ?? null;

              if (clasificacion == null || clasificacion === "") {
                return incluirNull;
              }

              return clasificaciones.includes(Number(clasificacion));
            });

          if (!serviciosFiltrados.length) return null;

          return {
            ...rubro,
            servicios: serviciosFiltrados,
          };
        })
        .filter(Boolean),
    [idxServicios],
  );

  const esServicioInternoConCatalogo = (it, idxServiciosLocal) => {
    if (it?.clasificacion != null) return Number(it.clasificacion) === 2;
    if (it?.servicio_clasificacion != null) return convertClasificacionServicio(Number(it.servicio_clasificacion)) === convertClasificacionServicio(2);
    if (it?.servicio_interno != null) return Boolean(it.servicio_interno);
    if (it?.es_interno != null) return Boolean(it.es_interno);

    const cat = idxServiciosLocal?.get(String(it?.cod_servicio));
    return convertClasificacionServicio(Number(cat?.servicio_clasificacion)) === convertClasificacionServicio(2) || cat?.servicio_interno === true || cat?.es_interno === true;
  };

  const armarRubrosConServiciosDesdeDetalleConCatalogos = useCallback(
    (detalleRubros = [], opts = {}) => {
      const { soloInternos = true, entidadId = null, filtrarPorClasificacion = true } = opts;

      const lista = (detalleRubros || [])
        .filter((it) => {
          if (!filtrarPorClasificacion) return true;

          const interno = esServicioInternoConCatalogo(it, idxServicios);
          return soloInternos ? interno : !interno;
        })
        .filter((it) => {
          if (!entidadId) return true;

          const id = it.entidad_id ?? it.cod_entidad ?? null;
          return String(id) === String(entidadId);
        });

      const agrupado = lista.reduce((acc, it) => {
        const cod_rubro = it.cod_rubro;

        const rubroCat = idxRubros.get(String(cod_rubro));
        const nombreRubro = it.nombre_rubro ?? rubroCat?.nombre_rubro ?? rubroCat?.nombre ?? "";

        const cod_servicio = it.cod_servicio;
        const servicioCat = idxServicios.get(String(cod_servicio));
        const nombreServicio = it.nombre_servicio ?? servicioCat?.nombre_servicio ?? servicioCat?.nombre ?? "";
        const siglasServicio = it.siglas_servicio ?? servicioCat?.siglas ?? "";

        const entidad_id = it.entidad_id ?? it.cod_entidad ?? null;
        const entidadCat = entidad_id ? idxEntidades.get(String(entidad_id)) : null;
        const nombreEntidad = it.entidad_nombre ?? entidadCat?.entidad_nombre ?? entidadCat?.razon_social ?? entidadCat?.nombre ?? null;

        const cod_moneda_venta = it.cod_moneda_venta ?? it.metodo_cod_moneda_venta ?? null;
        const cod_moneda_costo = it.cod_moneda_costo ?? it.metodo_cod_moneda_costo ?? null;
        const detalleRubro = typeof it.detalle === "string" ? it.detalle.trim() : "";

        const monedaVenta = cod_moneda_venta ? idxMonedas.get(String(cod_moneda_venta)) : null;
        const monedaCosto = cod_moneda_costo ? idxMonedas.get(String(cod_moneda_costo)) : null;

        const servicio = {
          cod_servicio,
          nombre: nombreServicio,
          servicio_clasificacion: it.servicio_clasificacion,
          siglas: siglasServicio,
          metodo: {
            venta: it.venta ?? it.venta_rubro ?? it.precio_venta ?? 0,
            costo: it.costo ?? it.costo_rubro ?? it.precio_costo ?? 0,
            porcentaje: it.porcentaje ?? it.metodo_porcentaje,
            cod_moneda_venta,
            cod_moneda_costo,
            moneda_venta: monedaVenta?.simbolo ?? monedaVenta?.nombre ?? null,
            moneda_costo: monedaCosto?.simbolo ?? monedaCosto?.nombre ?? null,
            detalles: unirDetalles(it.detalles, it.metodo_detalle, it.metodo_detalles, detalleRubro),
          },
          entidad_id,
          entidad_nombre: nombreEntidad,
        };

        const key = `${it.cod_detallerubro ?? ""}-${cod_rubro}-${servicio.cod_servicio}-${entidad_id ?? ""}`;

        acc[key] = {
          value: `${cod_rubro}-${servicio.cod_servicio}-${entidad_id ?? "NA"}-${it.cod_detallerubro ?? "NA"}`,
          cod_rubro,
          nombre_rubro: nombreRubro,
          cod_tipo_pago: it.cod_tipo_pago,
          gruporubro_nombre: it.gruporubro_nombre ?? "",
          servicio,
          ...servicio,
          json: safeStringify(
            {
              value: `${cod_rubro}-${servicio.cod_servicio}`,
              cod_rubro,
              nombre_rubro: nombreRubro,
              cod_servicio: servicio.cod_servicio,
              nombre_servicio: servicio.nombre,
              entidad_id: servicio.entidad_id,
              entidad_nombre: servicio.entidad_nombre,
              metodo: servicio.metodo,
            },
            2,
            4000,
          ),
        };

        return acc;
      }, {});

      return Object.values(agrupado);
    },
    [idxRubros, idxServicios, idxMonedas, idxEntidades],
  );

  const renderizarEstado = useCallback((fila) => {
    const { cod_estado } = fila;
    const estado = Object.keys(CODS_ESTADOS).find((key) => CODS_ESTADOS[key] === cod_estado);

    return (
      <Tooltip title={estado}>
        <Typography component="span" color={COLORES_ESTADOS[cod_estado] || null} className={ICONOS_ESTADOS[cod_estado]} />
      </Tooltip>
    );
  }, []);

  const encabezados = useMemo(
    () => [
      {
        type: "number",
        headerName: "Versión",
        field: "version",
        min: 1,
        editable: false,
      },
      {
        headerName: "Fecha de Creación",
        field: "fecha_creacion",
        type: "date",
        editable: false,
      },
      {
        headerName: "Fecha de Vencimiento",
        field: "fecha_vencimiento",
        type: "date",
        setMin: ({ row }) => row.fecha_creacion,
        editable: true,
      },
      { type: "checkbox", headerName: "Tarifa custom", field: "es_spot", editable: false },
      {
        type: "checkbox",
        headerName: "Tarifa custom autorizada",
        field: "cotizaciondetalle_json",
        format: (value, row) => (value ? (value?.cod_estado === CODS_ESTADOS.AUTORIZADO ? "Autorizado" : value?.cod_estado === CODS_ESTADOS.RECHAZADO_GLOBAL ? "Rechazado" : "Pendiente") : ""),
        editable: false,
      },
      {
        type: "text",
        headerName: "Estado",
        field: "isActive",
        editable: false,
        format: (d, r) => renderizarEstado(r),
      },
    ],
    [renderizarEstado],
  );

  /* =========================
     Acciones (API)
  ========================= */
  const handleSeleccionarEntidad = useCallback(
    (entidad) => {
      // console.group("🟢 [CARRIER] handleSeleccionarEntidad");

      // console.log("entidad recibida:", entidad);
      // console.log("value recibido:", entidad?.value);
      // console.log("entidad_id:", entidad?.entidad_id);
      // console.log("carrier anterior:", entidadConFlete?.value);

      // console.groupEnd();

      setValorFleteCarrierManual(null);
      setTarifasSpotDueCarrier([]);

      if (!entidad) setEntidadConFlete(entidadesConFleteSegunExpress[0]);
      else setEntidadConFlete(entidad);
    },
    [entidadesConFleteSegunExpress, entidadConFlete?.value],
  );

  const recalcularDesdeDueCarrier = useCallback((nuevoValorFlete) => {
    const valor = nuevoValorFlete === null || nuevoValorFlete === undefined || String(nuevoValorFlete).trim() === "" ? null : Number(nuevoValorFlete);

    if (valor !== null && !Number.isFinite(valor)) {
      setValorFleteCarrierManual(valor);
      return;
    }

    setValorFleteCarrierManual(valor);

    // fuerza que el efecto C vuelva a calcular aunque sea el mismo carrier
    tarifaReqKeyRef.current = "";
    setRecalcToken((t) => t + 1);
  }, []);

  const obtenerFlete = useCallback(
    async (criteriosActuales, requestKey) => {
      // console.group("🟡 [OBTENER FLETE]");

      // console.log({
      //   requestKey,
      //   requestKeyAnterior: fleteReqKeyRef.current,
      //   criteriosActuales,
      //   criteriosParaFleteKey,
      //   resetCalcToken,
      //   entidadActual: entidadConFlete?.value,
      // });

      // console.groupEnd();

      if (!criteriosActuales.valor_cw) return;
      if (requestKey && fleteReqKeyRef.current === requestKey) return;

      startLoader("flete", "Cargando flete");

      try {
        if (abortFleteRef.current) abortFleteRef.current.abort();
        abortFleteRef.current = new AbortController();

        if (requestKey) fleteReqKeyRef.current = requestKey;

        // console.warn("⚠️ [OBTENER FLETE] VACIANDO fletesCalc/options", {
        //   entidadActual: entidadConFlete?.value,
        //   requestKey,
        // });

        setFletesCalc([]);
        setEntidadesConFlete([]);

        if (plantilla?.cod_tarifaplantilla == null) return;

        const codRubros = codigosFletes.map((r) => r.cod_rubro).filter(Boolean);
        if (!codRubros.length) return;

        const { cod_tarifaplantilla = 0, criterios: criteriosPlantilla = [] } = plantilla;

        let valores_procesados = { cod_tarifaplantilla };

        if (criteriosPlantilla.length > 0) {
          criteriosPlantilla.forEach((i) => {
            valores_procesados[i.campo] =
              i.cod_tipo_dato === 4 ? (typeof criteriosActuales[i.campo] === "object" ? criteriosActuales[i.campo]?.value : criteriosActuales[i.campo]) : criteriosActuales[i.campo];
          });
        } else {
          valores_procesados = { ...criteriosActuales, cod_tarifaplantilla };
        }

        const baseParams = { ...valores_procesados, ...filtros };

        const { data } = await api.get("/api/appweb/calcular-tarifa-rubros", {
          params: { ...baseParams, cod_rubro: codRubros },
          signal: abortFleteRef.current.signal,
        });

        const rubros = (data?.data || []).filter((r) => r?.es_flete === true);

        // console.log(
        //   "🟡 [OBTENER FLETE] respuesta",
        //   rubros.map((r) => ({
        //     cod_rubro: r.cod_rubro,
        //     nombre_rubro: r.nombre_rubro,
        //     servicios: (r.servicios || []).map((s) => ({
        //       entidad_id: s.entidad_id,
        //       entidad_nombre: s.entidad_nombre,
        //       cod_servicio: s.cod_servicio,
        //       venta: s?.metodo?.venta,
        //       categoria_transporte: s?.categoria_transporte,
        //       cod_categoria_transporte: s?.cod_categoria_transporte,
        //       metodo_categoria: s?.metodo?.categoria_transporte,
        //       metodo_cod_categoria: s?.metodo?.cod_categoria_transporte,
        //     })),
        //   })),
        // );

        tarifaReqKeyRef.current = ""; // ← permite que Efecto C recalcule
        setFletesCalc(rubros); // ← era: setFleteNormalCalc / setFleteExpressCalc

        const todasEntidades = rubros.flatMap((r) => (r.servicios || []).map((i) => ({ ...i, value: i.entidad_id, label: i.entidad_nombre })));
        setEntidadesConFlete(todasEntidades);
      } catch (error) {
        if (error?.name === "CanceledError" || error?.name === "AbortError") return;
        console.error("Error al calcular el flete", error);
      } finally {
        stopLoader("flete");
      }
    },
    [plantilla, codigosFletes, filtros, startLoader, stopLoader, plantillaSeleccionada], // ← simplificado
  );

  const consultarCalcuo = useCallback(
    async (criteriosCalculo, nuevo) => {
      startLoader("tarifas", "Cargando tarifas");

      try {
        const cod_proveedor = entidadSeleccionadaId;

        // DUE CARRIER
        const dataCarrier = await api.get("/api/appweb/calcular-tarifa", {
          params: {
            ...criteriosCalculo,
            cod_proveedor,
            ...filtros,
            cod_tarifaplantilla: 0,
            // clasificacion_transporte:
          },
        });

        // DUE AGENT
        const dataAgent = await api.get("/api/appweb/calcular-tarifa", {
          params: {
            ...criteriosCalculo,
            cod_proveedor: 13624, // CROPA
            ...filtros,
            cod_tarifaplantilla: 0,
          },
        });

        // const tarifasInternas =
        //   (await api
        //     .get("/api/appweb/calcular-tarifa-interna", {
        //       params: { ...criteriosCalculo, cod_proveedor, ...filtros, cod_tarifaplantilla: 0, incoterm_id: undefined },
        //     })
        //     .then(({ data }) => data.data)) || [];

        setValoresCalculados({
          data: [...dataCarrier.data.data, ...(dataAgent.data.data || [])],
          valores: { ...criteriosCalculo, cod_proveedor },
          tarifasInternas: [],
          nuevo,
        });
      } catch (error) {
        console.error("Error al calcular tarifas", error);
      } finally {
        stopLoader("tarifas");
      }
    },
    [filtros, entidadSeleccionadaId, startLoader, stopLoader],
  );
  const getCodMonedaItem = useCallback((item) => {
    return item?.servicios?.[0]?.metodo?.cod_moneda_venta || null;
  }, []);

  const codMonedaDelResto = useMemo(() => {
    const codMoneda = (valoresCalculados?.data || []).map((item) => getCodMonedaItem(item)).filter((cod) => !!cod && String(cod).trim() !== "")[0] ?? null;

    return codMoneda;
  }, [valoresCalculados?.data, getCodMonedaItem]);
  const serviciosAutoSeleccion = useMemo(() => (plantillaSeleccionada ? (plantillasRubros || []).map((r) => r.cod_servicio).filter(Boolean) : []), [plantillaSeleccionada, plantillasRubros]);
  const getMonedaCatalogo = useCallback(
    (codMoneda) => {
      if (codMoneda === null || codMoneda === undefined) return null;
      if (typeof codMoneda === "string" && codMoneda.trim() === "") return null;

      const codNum = Number(codMoneda);
      if (Number.isFinite(codNum)) {
        return (monedas.data || []).find((m) => Number(m.cod_moneda) === codNum) || null;
      }

      return (monedas.data || []).find((m) => m.cod_moneda === codMoneda) || null;
    },
    [monedas.data],
  );

  const agregarTarifaSpotDueCarrier = useCallback(
    (rubroFleteBase, valorSpot, rateValor) => {
      const valor = Number(valorSpot);

      if (!rubroFleteBase) return;
      if (!Number.isFinite(valor)) return;
      if (valor <= 0) return;

      const servicioBase = rubroFleteBase?.servicio || {};

      const esRubroFlete = servicioBase?.es_flete === true;

      const metodoBase = servicioBase?.metodo || rubroFleteBase?.metodo || {};

      const entidadId = servicioBase?.entidad_id ?? rubroFleteBase?.entidad_id ?? entidadSeleccionadaId ?? null;

      const entidadNombre = servicioBase?.entidad_nombre ?? rubroFleteBase?.entidad_nombre ?? entidadConFlete?.entidad_nombre ?? "";

      const codMonedaVenta = metodoBase?.cod_moneda_venta ?? servicioBase?.cod_moneda_venta ?? rubroFleteBase?.cod_moneda_venta ?? null;

      const codMonedaCosto = metodoBase?.cod_moneda_costo ?? servicioBase?.cod_moneda_costo ?? rubroFleteBase?.cod_moneda_costo ?? codMonedaVenta;

      const valueBase = rubroFleteBase?.value || `${rubroFleteBase?.cod_rubro}-${servicioBase?.cod_servicio}-${entidadId}`;

      const valueSpot = `${valueBase}-SPOT`;

      const monedaVenta = monedas.data?.find((m) => m.cod_moneda === metodoBase?.cod_moneda_venta);

      const moneda = monedaVenta?.SIMBOLO_MONEDA ?? monedaVenta?.monedaVenta;
      const monedaSimbolo = moneda;

      const minimo = rateValor === 0 ? metodoBase?.venta : undefined;

      const agregarRate = esRubroFlete && rateValor != null && String(rateValor).trim() !== "";
      const agregarMinimo = esRubroFlete && (rubroFleteBase?.metodo?.rate_costo === 0 || (minimo != null && String(minimo).trim() !== ""));

      const detallesSpot = [
        ...(Array.isArray(metodoBase?.detalles) ? metodoBase.detalles : []).filter((i) => !i.custom),

        {
          tipo_desc: "CW",
          tarifadetalle_descripcion: `${criterios.valor_cw} / ${agregarMinimo ? `Tarifa ${moneda} ${minimo}` : `${monedaSimbolo}${String(rateValor)}/KG`}`,
          custom: true,
        },
      ];

      const metodoSpot = {
        ...metodoBase,
        venta: valor,
        costo: rubroFleteBase?.metodo?.costo ?? valor,
        cod_moneda_venta: codMonedaVenta,
        cod_moneda_costo: codMonedaCosto,
        detalles: detallesSpot,
        rate_costo: rubroFleteBase?.metodo?.rate_costo ?? rateValor,
        rate_venta: rateValor,

        original_rate_costo: rubroFleteBase?.metodo?.rate_costo ?? rateValor,
        original_rate_venta: rubroFleteBase?.metodo?.rate_venta ?? rateValor,
        original_venta: rubroFleteBase?.metodo?.venta ?? valor,
        original_costo: rubroFleteBase?.metodo?.costo ?? valor,
      };

      const servicioSpot = {
        ...servicioBase,
        nombre: `${servicioBase?.nombre || servicioBase?.nombre_servicio || "Flete"}`,
        nombre_servicio: `${servicioBase?.nombre || servicioBase?.nombre_servicio || "Flete"}`,
        entidad_id: entidadId,
        entidad_nombre: entidadNombre,
        metodo: metodoSpot,
      };

      const rubroSpot = {
        ...rubroFleteBase,

        value: valueSpot,
        cod_detallerubro: null,

        es_flete: true,
        es_tarifa_spot: true,

        nombre: rubroFleteBase?.nombre || rubroFleteBase?.nombre_rubro || "Flete",
        nombre_rubro: rubroFleteBase?.nombre_rubro || rubroFleteBase?.nombre || "Flete SPOT",
        gruporubro_nombre: "Flete",

        cod_tipo_pago: rubroFleteBase?.cod_tipo_pago ?? cotizacion?.cod_tipo_pago,

        venta: valor,
        costo: rubroFleteBase?.metodo?.costo ?? valor,
        metodo: metodoSpot,

        servicio: servicioSpot,
        cod_servicio: servicioSpot?.cod_servicio,
        entidad_id: entidadId,
        entidad_nombre: entidadNombre,
      };

      setTarifasSpotDueCarrier((prev) => {
        const sinAnterior = (prev || []).filter((r) => !r.es_tarifa_spot);
        return [rubroSpot, ...sinAnterior];
      });
    },
    [cotizacion?.cod_tipo_pago, criterios.valor_cw, entidadConFlete?.entidad_nombre, entidadSeleccionadaId, monedas.data],
  );

  const quitarTarifaSpotDueCarrier = useCallback(() => {
    setTarifasSpotDueCarrier((prev) => {
      const sinAnterior = (prev || []).filter((r) => !r.es_tarifa_spot);
      return [...sinAnterior];
    });
  }, [cotizacion?.cod_tipo_pago, criterios.valor_cw, entidadConFlete?.entidad_nombre, entidadSeleccionadaId, monedas.data]);

  const consultarDueCarrierBasadoEnDueAgent = useCallback(
    async (totalDueAgent) => {
      if (isReadOnly) return;

      if (!entidadSeleccionadaId || !totalDueAgent) {
        setValoresCalculadosDueCarrierBasadoEnDueAgent([]);
        return;
      }

      try {
        const cod_proveedor = entidadSeleccionadaId;

        const { data } = await api.get("/api/appweb/calcular-tarifa", {
          params: {
            ...criterios,
            ...filtros,
            cod_proveedor,
            cod_tarifaplantilla: 0,

            // CAMBIAR por el nombre real que espera el back
            valor_dueagent: totalDueAgent,
            cod_tipo_calculo: 90,
          },
        });

        // ASUMIENDO que responde igual que calcular-tarifa:
        // data.data = rubros con servicios
        const rubros = data?.data || [];

        const listaProcesada = rubros.flatMap((rubro) =>
          (rubro.servicios || []).map((s) => ({
            value: `${rubro.cod_rubro}-${s.cod_servicio}`,
            ...rubro,
            ...s,
            servicios: undefined,
            servicio: s,
          })),
        );

        setValoresCalculadosDueCarrierBasadoEnDueAgent(listaProcesada);
      } catch (error) {
        console.error("Error al calcular due carrier basado en due agent", error);
        setValoresCalculadosDueCarrierBasadoEnDueAgent([]);
      }
    },
    [isReadOnly, entidadSeleccionadaId, criterios, filtros],
  );

  const consultarCalcuoScale = useCallback(
    async (criteriosCalculo) => {
      // startLoader("scalling", "Cargando scalling");

      try {
        const cod_proveedor = entidadSeleccionadaId;

        const dataCarrier = await api.get("/api/appweb/calcular-tarifa-scalling", {
          params: {
            ...criteriosCalculo,
            cod_proveedor,
            ...criterios,
            cod_tarifaplantilla: 0,
            ...filtros,
          },
        });

        if (Array.isArray(dataCarrier?.data?.data) && dataCarrier?.data?.data.length > 0) {
          const data = dataCarrier.data.data.map((i) => {
            const rutas = Array.isArray(i?.metodo?.rutas) ? i.metodo.rutas : [];
            const moneda = codMonedaDelResto ? getMonedaCatalogo(codMonedaDelResto) : null;

            const minimo = Number(i?.metodo?.minimo) || 0;
            const totalRutas = rutas.reduce((acc, r) => acc + Number(r?.costo || 0), 0);
            const totalConMinimo = totalRutas === 0 ? 0 : Math.max(minimo, totalRutas);

            return {
              ...i,
              metodo: {
                ...i.metodo,
                detalles: [],
                venta: totalConMinimo,
                costo: totalConMinimo,
                cod_moneda_costo: codMonedaDelResto ?? null,
                cod_moneda_venta: codMonedaDelResto ?? null,
                moneda_costo: moneda,
                moneda_venta: moneda,
              },
            };
          });

          setValoresCalculados((v) => {
            const dataProcesada = v?.data?.map((d) => (d.cod_rubro === 134 ? { ...d, servicios: data } : d)) || [];

            return {
              ...v,
              data: dataProcesada,
              valores: { ...(v?.valores || {}), ...criteriosCalculo },
            };
          });
        }
      } catch (error) {
        console.error("Error al calcular tarifas", error);
      } finally {
        // stopLoader("scalling");
      }
    },
    [codMonedaDelResto, criterios, entidadSeleccionadaId, filtros, getMonedaCatalogo],
  );

  const viewVersionCotizacion = useCallback(
    async (cod_cotizaciondetalle, version) => {
      startLoader("detalleVersion", "Cargando detalle de versión");

      try {
        setVersionActual(version);

        setRubrosSeleccionadosDueAgent([]);
        setValoresCalculadosDueCarrierBasadoEnDueAgent([]);
        setTotalDueAgentSeleccionado(0);
        setRubrosSeleccionados([]);
        setListaDimensiones([]);
        setCriteriosSeleccionados([]);
        setValoresDefaultCriterios({});
        setCriterios({});
        setPlantilla(null);

        setEntidadConFlete(null);
        setEntidadIdGuardadaEnVersion(null);

        setTarifasSpotDueCarrier([]);

        setFletesCalc([]);
        setEntidadesConFlete([]);

        setValoresCalculados({});
        setValoresCalculadosPorEntidad([]);
        setValoresCalculadosScale([]);
        setRubrosProcesadosDueCarrier([]);

        fleteReqKeyRef.current = "";
        tarifaReqKeyRef.current = "";

        const rubrosUrl = "/api/appweb/lista-cotizacion-detalle-rubro";
        const respRubrosUrl = await api.get(rubrosUrl, {
          params: { cod_cotizaciondetalle },
        });
        const rubrosGuardados = respRubrosUrl?.data?.data || [];
        setRubrosSeleccionados(rubrosGuardados);

        const entidadId = extraerEntidadIdDeRubrosGuardados(rubrosGuardados, codigosFletes);
        setEntidadIdGuardadaEnVersion(entidadId ?? cotizacion?.entidad_id ?? null);

        const internosGuardados = armarRubrosConServiciosDesdeDetalleConCatalogos(rubrosGuardados, {
          soloInternos: true,
        });
        setValoresCalculadosInternos(internosGuardados);

        setEntidadConFlete((listaProveedores.data?.data || []).find((p) => p.entidad_id === rubrosGuardados[0]?.entidad_id) || null);

        const urlDim = "api/appweb/lista-cotizacion-detalle-dimension";
        const respDim = await api.get(urlDim, {
          params: { cod_cotizaciondetalle },
        });
        setListaDimensiones(respDim.data.data);

        const legsUrl = "/api/appweb/lista-cotizacion-detalle-legs";
        const respLegs = await api.get(legsUrl, {
          params: { cod_cotizaciondetalle },
        });

        setLegs((respLegs?.data?.data || [])?.sort((a, b) => a.orden - b.orden));

        const criteriosUrl = "/api/appweb/lista-cotizacion-detalle-criterio";
        const respCriterios = await api.get(criteriosUrl, {
          params: { cod_cotizacion_cabecera, cod_cotizaciondetalle },
        });

        const plantillaUrl = "/api/appweb/recupera-datos-plantilla";
        const respPlantilla = await api.get(plantillaUrl, { params: { ...filtros } }).then(({ data }) => data);

        const criteriosConsultados = respPlantilla?.data?.[0]?.criterios || [];

        const serviciosInternos =
          (await api
            .get("/api/appweb/lista-servicios", {
              params: { servicio_interno: true, cod_estado: 1, ...filtros, incoterm_id: null },
            })
            .then(({ data }) => data.data)) || [];

        const listaCriteriosInternos = (
          await Promise.all(
            serviciosInternos.map((i) =>
              api
                .get("/api/appweb/obtener-criterios", {
                  params: { cod_servicio: i.cod_servicio },
                })
                .then(({ data }) => data.data),
            ),
          )
        ).reduce((arr, acc) => (arr.push(...acc), arr), []);

        const resultadoConsultasCriterios = [...criteriosConsultados, ...listaCriteriosInternos];
        setCriteriosSeleccionados(resultadoConsultasCriterios);

        const valCritDefault = resultadoConsultasCriterios.reduce((acc, c) => {
          const valorActual = respCriterios?.data?.data?.find((r) => r.cod_criterio === c.cod_criterio);
          if (valorActual) acc[c.campo] = valorActual.valor;
          return acc;
        }, {});

        const criteriosConPaises = {
          cod_pais_origen: cotizacion?.cod_pais_origen ?? null,
          cod_pais_destino: cotizacion?.cod_pais_destino ?? null,
          cod_puntoenlace_destino: cotizacion.cod_puntoenlace_destino,
          cod_puntoenlace_origen: cotizacion.cod_puntoenlace_origen,
          cod_continente_origen: cotizacion.cod_continente_origen,
          cod_continente_destino: cotizacion.cod_continente_destino,
          entidad_id: cotizacion?.entidad_id ?? null,
          ...valCritDefault,
          express: normalizeBool(valCritDefault?.express),
        };

        setValoresDefaultCriterios(criteriosConPaises);
        setCriterios(criteriosConPaises);

        setPlantilla(respPlantilla?.data?.[0] ?? null);
      } catch (error) {
        console.error("Error al ver versión de cotización", error);
      } finally {
        stopLoader("detalleVersion");
      }
    },
    [
      startLoader,
      codigosFletes,
      cotizacion?.entidad_id,
      cotizacion?.cod_pais_origen,
      cotizacion?.cod_pais_destino,
      cotizacion.cod_puntoenlace_destino,
      cotizacion.cod_puntoenlace_origen,
      cotizacion.cod_continente_origen,
      cotizacion.cod_continente_destino,
      armarRubrosConServiciosDesdeDetalleConCatalogos,
      listaProveedores.data?.data,
      cod_cotizacion_cabecera,
      filtros,
      stopLoader,
    ],
  );

  const cargarNuevaVersion = useCallback(
    async (setLista = true) => {
      const versionDefault = {
        cod_cotizaciondetalle: 0,
        cod_cotizacion_cabecera,
        version: setLista ? 1 : versiones.length + 1,
        total: 0,
        cod_estado: CODS_ESTADOS.ACTIVO,
        cod_usuario,
        tipo_transito: null,
        salida: null,
        opcionales: null,
        cotizaciondetalle_json: null,
        isNew: true,
        isActive: true,
        accionesDeTabla: { view: true, pdf: false, delete: false },
      };

      if (setLista) setVersiones([versionDefault]);
      setVersionActual(versionDefault);

      viewVersionCotizacion(1, versionDefault);
    },
    [cod_cotizacion_cabecera, cod_usuario, versiones.length, viewVersionCotizacion],
  );

  const obtenerVersionesDeCotizacion = useCallback(async () => {
    startLoader("versiones", "Cargando versiones");

    try {
      setVersiones([]);
      if (!cod_cotizacion_cabecera) return;

      const response = await api.get("/api/appweb/lista-cotizacion-detalle", {
        params: { cod_cotizacion_cabecera },
      });

      const detalles = response.data.data || [];

      await Promise.all(
        detalles
          .filter((i) => i.es_spot)
          .map(async (i) => {
            const detalleSpot = await api.get("/api/appweb/lista-tarifa-spot", {
              params: { cod_cotizaciondetalle: i.cod_cotizaciondetalle },
            });

            i.cotizaciondetalle_json = detalleSpot.data.data[0];
            return detalleSpot.data.data;
          }),
      );

      if (!detalles.length) {
        await cargarNuevaVersion();
        return;
      }

      const validarSiEsPdfNormal = (i) => {
        // Se debe mostrar si:
        /**
         * 1. El tipo de pago es indiferente
         * 2. Si es tipo pago 127 no tiene que tener estación
         * 3. Si es tipo pago 131 es indiferente que tenga estación o no
         * 4. La versión no es nueva y está no esta anulada
         */

        const esTipoPago127 = cotizacion?.cod_tipo_pago === 127;
        const tieneEstacion = !!cotizacion?.entidad_id_estacion;
        const esTipoPago131 = cotizacion?.cod_tipo_pago === 131;
        const esVersionActivaNoNueva = !i.isNew && i.cod_estado !== CODS_ESTADOS.ANULADO;

        if (esTipoPago127 && tieneEstacion) return false;
        if ((esTipoPago127 && !tieneEstacion) || esTipoPago131) return true;
        if (esVersionActivaNoNueva) return true;
        return false;
      };
      const validarSiEsPdfEstacion = (i) => {
        // Se debe mostrar si:
        /**
         * 1. La estacion es diferente de null o 0
         * 2. El tipo de pago es 127 o 131
         * 3. La versión no es nueva y está no esta anulada
         */

        const tieneEstacion = !!cotizacion?.entidad_id_estacion;
        const esTipoPago127 = cotizacion?.cod_tipo_pago === 127;
        const esTipoPago131 = cotizacion?.cod_tipo_pago === 131;
        const esVersionActivaNoNueva = !i.isNew && i.cod_estado !== CODS_ESTADOS.ANULADO;

        if (tieneEstacion && (esTipoPago127 || esTipoPago131) && esVersionActivaNoNueva) return true;
        return false;
      };

      const lista = detalles.map((i) => {
        const spot_autorizado = i.es_spot ? i.cotizaciondetalle_json?.cod_estado === CODS_ESTADOS.AUTORIZADO : true;

        return {
          ...i,
          isActive: i.cod_estado === 1,
          accionesDeTabla: {
            view: i.cod_estado === CODS_ESTADOS.ACTIVO || i.cod_estado === CODS_ESTADOS.INACTIVO,
            auth: spot_autorizado && i.cod_estado === CODS_ESTADOS.INACTIVO && (cotizacion.cod_estado === CODS_ESTADOS.ACTIVO || cotizacion.cod_estado === CODS_ESTADOS.ACTIVO),
            pdf: spot_autorizado && validarSiEsPdfNormal(i),
            pdf1: spot_autorizado && validarSiEsPdfEstacion(i),
            delete: !i.isNew && i.cod_estado !== CODS_ESTADOS.ANULADO && i.cod_estado !== CODS_ESTADOS.ACTIVO,
          },
        };
      });

      setVersiones(lista);

      const elementoDefault = lista.find((i) => i.cod_estado === CODS_ESTADOS.ACTIVO) || lista[0];
      await viewVersionCotizacion(elementoDefault?.cod_cotizaciondetalle, elementoDefault);
    } catch (error) {
      console.error("Error al obtener versiones de cotización", error);
    } finally {
      stopLoader("versiones");
    }
  }, [startLoader, cod_cotizacion_cabecera, viewVersionCotizacion, cargarNuevaVersion, cotizacion.cod_estado, cotizacion?.cod_tipo_pago, cotizacion?.entidad_id_estacion, stopLoader]);

  const reactivarCotizacion = useCallback(
    async (id) => {
      await api.post(`/api/appweb/activar-cotizacion-detalle`, {
        cod_cotizacion_cabecera,
        cod_cotizaciondetalle: id,
      });
      await obtenerVersionesDeCotizacion();
    },
    [cod_cotizacion_cabecera, obtenerVersionesDeCotizacion],
  );

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const generarPDFDeCotizacion = useCallback(
    async (id, version, tipo, { forzar = false, idiomaPdf = null } = {}) => {
      startLoader("pdf", "Generando PDF");
      const maxIntentos = 5;
      const delayMs = 1000;
      try {
        const tipo_documento = cotizacion["cod_tipo_servicio"] === 81 ? (tipo === 2 ? "collect" : "prepaid") : null;
        const payload = { cod_cotizaciondetalle: id, ...(forzar ? { forzar: true, idioma: idiomaPdf, tipo_documento } : {}) };

        const { data: response } = await api.post("api/appweb/generar-pdf-cotizacion-detalle", payload);
        const urlDocumento = (tipo === 1 ? response.data?.url_documento_prepaid : response.data?.url_documento_collect) ?? response.data?.url_documento;

        if (!urlDocumento) return;

        const elementos = urlDocumento.split(".")[0].split("_");
        const idiomaArchivo = ["es", "en"].includes(elementos[elementos.length - 1]) ? elementos[elementos.length - 1] : "es";

        if (idiomaPdf !== idiomaArchivo) setIdioma(idiomaArchivo);
        else setIdioma(idiomaPdf);

        const obtener = async () => {
          for (let intento = 1; intento <= maxIntentos; intento++) {
            try {
              const archivo = await api.post("api/appweb/recuperar-archivo", { ruta_archivo: urlDocumento }, { responseType: "arraybuffer" });
              const contentType = archivo.headers.get("content-type") || "";
              if (contentType.includes("application/pdf")) {
                return archivo;
              } else {
                throw Error();
              }
            } catch (e) {
              const esUltimoIntento = intento === maxIntentos;
              if (esUltimoIntento) return null;
              await sleep(delayMs * intento);
            }
          }
        };
        setFuncionDescargaPdf(null);
        setPdfUri(null);
        const archivo = await obtener();
        if (!archivo) {
          stopLoader("pdf");
          return;
        }
        const nombreArchivo = `${centroDeCosto.data?.cod_cropa || `${currentCentroCosto?.nombre_cc}`.substring(0, 3)}-${moment().format("YYYY")}-${cod_cotizacion_cabecera}_${version.version}.pdf`;

        const blob = new Blob([archivo.data], {
          type: "application/pdf",
        });

        const file = new File([archivo.data], nombreArchivo, {
          type: "application/pdf",
        });

        const url = URL.createObjectURL(file);

        const localFuncionDescarga = () => {
          const urlDescarga = window.URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = urlDescarga;
          a.download = nombreArchivo;

          document.body.appendChild(a);
          a.click();
          a.remove();

          window.URL.revokeObjectURL(urlDescarga);
        };

        setPdfActual({ id, version, tipo });

        // if (idiomaPdf) setIdioma(idiomaPdf);
        setFuncionDescargaPdf(() => localFuncionDescarga);
        setPdfUri(url);
        setPreviewPdf(true);
      } catch (error) {
        console.error("Error al generar el PDF:", error);
      } finally {
        stopLoader("pdf");
      }
    },
    [centroDeCosto.data?.cod_cropa, currentCentroCosto?.nombre_cc, cod_cotizacion_cabecera, startLoader, stopLoader],
  );

  const cambiarIdiomaPDF = useCallback(
    async (nuevoIdioma) => {
      if (!pdfActual) {
        // generarPDFDeCotizacion(null);
        return;
      }
      if (nuevoIdioma === idioma) return;

      await generarPDFDeCotizacion(pdfActual.id, pdfActual.version, pdfActual.tipo, {
        forzar: true,
        idiomaPdf: nuevoIdioma,
      });
    },
    [pdfActual, idioma, generarPDFDeCotizacion],
  );

  /* =========================
     Handlers UI
  ========================= */

  const handleValoresChange = useCallback((next, opts = {}) => {
    setCriterios((prev) => {
      const raw = next?.express ?? prev?.express;
      const normalizedExpress = normalizeBool(raw);

      return { ...(prev || {}), ...(next || {}), express: normalizedExpress };
    });

    if (opts?.force) {
      // Limpiar TODOS los datos del cálculo anterior
      setFletesCalc([]);
      setEntidadesConFlete([]);
      setEntidadConFlete(null);
      setValoresCalculados({});
      setValoresCalculadosPorEntidad([]);
      setValoresCalculadosScale([]);
      setValoresCalculadosInternos([]);
      setRubrosProcesadosDueCarrier([]);
      setRubrosSeleccionadosDueAgent([]);
      setValoresCalculadosDueCarrierBasadoEnDueAgent([]);
      setTotalDueAgentSeleccionado(0);
      setValorFleteCarrierManual(null);
      setTarifasSpotDueCarrier([]);

      // Invalidar las keys de deduplicación
      fleteReqKeyRef.current = "";
      tarifaReqKeyRef.current = "";

      // Incrementar token para forzar re-ejecución de efectos
      setResetCalcToken((t) => t + 1);
      setRecalcToken((t) => t + 1);
    }
  }, []);

  const generarVersion = useCallback(async () => {
    if (!versionActual) return;
    if (!cod_cotizacion_cabecera) return;
    if (!rubrosConGruposConCW.length) return;
    if (!Object.keys(criterios || {}).length) return;

    startLoader("guardar", "Guardando versión");

    try {
      const rubro_spot = rubrosConGruposConCW.find((r) => r.es_tarifa_spot);
      const spot_is_higher = rubro_spot ? Number(rubro_spot?.venta_rubro) > Number(rubro_spot?.original_venta) : true;
      // const rubro_spot = rubrosConGruposConCW.find((r) => r.es_tarifa_spot);

      if (rubro_spot && !archivoSPOT && !spot_is_higher) {
        setMostrarSolicitarArchivoSPOT(true);
        stopLoader("guardar");
        return;
      }

      setMostrarSolicitarArchivoSPOT(false);

      const apiBaseURL = "/api/appweb/insertar-cotizacion-detalle";
      const reqBody = {
        ...versionActual,
        cod_cotizacion_cabecera,
        cod_estado: CODS_ESTADOS.INACTIVO,
        fecha_vencimiento: moment().add(30, "days").toDate(),
        es_spot: !!rubro_spot,
      };
      const response = await api.post(apiBaseURL, reqBody);
      const cod_cotizaciondetalle = response.data.data.cod_cotizaciondetalle;
      if (!cod_cotizaciondetalle) return;

      const agrupados = rubrosConGruposConCW.reduce((acc, item) => {
        const orden = obtenerOrdenGrupoDefault({
          nombre: item?.gruporubro_nombre,
          idDeGrupo: item?.idDeGrupo,
          codCc: cotizacion?.cod_cc,
          codTipoTransporte: cotizacion?.cod_tipo_transporte,
        });

        if (!acc[orden]) acc[orden] = [];

        acc[orden].push(item);

        return acc;
      }, {});

      const ordenes = Object.keys(agrupados)
        .map(Number)
        .sort((a, b) => a - b);

      if (rubro_spot) {
        const flete_sin_spot = rubrosConGruposConCW.find((r) => r.es_flete && !r.es_tarifa_spot);
        const responseSpot = await api.post("/api/appweb/insertar-tarifa-spot", {
          venta: rubro_spot?.rate_venta,
          costo: rubro_spot?.rate_costo,
          flete: rubro_spot?.venta_rubro,
          url_documento: null,
          cod_usuario_tarifaspot: cod_usuario,
          cod_usuario_autoriza_tarifaspot: null,
          cod_estado: !spot_is_higher ? CODS_ESTADOS.ACTIVO : CODS_ESTADOS.AUTORIZADO,
          venta_original: rubro_spot?.original_rate_venta ?? 0,
          costo_original: rubro_spot?.original_rate_costo ?? 0,
          reason_code: reasonCodeSPOT?.value ?? null,
          jusificacion: descripcionSPOT ?? "",
          cod_cotizaciondetalle,
        });

        if (archivoSPOT) {
          const formData = new FormData();
          // Usar los campos correctos según la API
          formData.append("cod_tarifa_spot", responseSpot.data.data.cod_tarifa_spot); // Campo requerido por la API
          formData.append("archivo", archivoSPOT);
          const response = await api.post("/api/appweb/cargar-archivo-tarifa-spot", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        }
        setArchivoSPOT(null);
      }

      for (const orden of ordenes) {
        const grupo = agrupados[orden];
        const estaAgrupado = grupo.length > 1;

        await Promise.all(
          grupo.map((i) =>
            api.post("/api/appweb/insertar-cotizacion-detalle-rubro", {
              ...i,
              detalle: estaAgrupado ? null : i.detalle,
              cod_cotizaciondetalle,
              cod_cotizacion_cabecera,
            }),
          ),
        );
      }

      await Promise.all(
        legs.map(async (l) =>
          api.post("/api/appweb/insertar-cotizacion-detalle-legs", {
            ...l,
            cod_cotizaciondetalle,
          }),
        ),
      );

      const pesoTotalDirecto = criterios?.total_peso;

      const volumenTotalDirecto = criterios?.total_volumen;

      const cwTotalDirecto = criterios?.valor_cw ?? Math.max(pesoTotalDirecto, volumenTotalDirecto);

      const tieneTotalesDirectos = pesoTotalDirecto > 0 || volumenTotalDirecto > 0;

      const dimensionesParaGuardar = listaDimensionesIngresadas?.length
        ? listaDimensionesIngresadas
        : tieneTotalesDirectos
          ? [
              {
                cantidad: 1,
                largo: volumenTotalDirecto,
                ancho: 1,
                alto: 1,
                cotdetdim_peso_unitario: pesoTotalDirecto,
                cotdetdim_unidad_medida: 165,
                cotdetdim_unidad_peso: 162,
                total_peso: pesoTotalDirecto,
                total_volumen: volumenTotalDirecto,
                total_cw: cwTotalDirecto,
                esTotalDirecto: true,
              },
            ]
          : [];

      const dimensionesPayload = dimensionesParaGuardar.map((i) => {
        const esTotalDirecto = i.esTotalDirecto === true;

        return {
          cotizaciondetalle_id: Number(cod_cotizaciondetalle),
          cod_cotizaciondetalle: Number(cod_cotizaciondetalle),
          cotdetdim_cantidad: Number(i.cantidad ?? 1),
          cotdetdim_largo: Number(i.largo ?? 0),
          cotdetdim_ancho: Number(i.ancho ?? 0),
          cotdetdim_alto: Number(i.alto ?? 0),
          cotdetdim_peso_unitario: esTotalDirecto ? 0 : Number(i.total_volumen ?? i.volumenTotalKg ?? i.pesoUnitario ?? 0),
          cotdetdim_unidad_medida: i.unidadMedida?.value ?? i.cotdetdim_unidad_medida ?? null,
          cotdetdim_unidad_peso: i.unidadPeso?.value ?? i.cotdetdim_unidad_peso ?? null,
          total_peso: i.total_peso,
          total_volumen: i.total_volumen,
          total_cw: i.total_cw,
        };
      });

      await Promise.all(
        dimensionesPayload.map(async (d) =>
          api.post("/api/appweb/insertar-cotizacion-detalle-dimension", {
            ...d,
            cotizaciondetalle_id: Number(cod_cotizaciondetalle), // parche temporal mientras cambian al campo con cod_
            cod_cotizaciondetalle: Number(cod_cotizaciondetalle),
            cod_cotizacion_cabecera,
          }),
        ),
      );

      await Promise.all(
        Object.entries({ ...criterios, ...criterioCobertura })
          .filter(([campo]) => campo !== "flete_fuente ")
          .map(async ([campo, valor]) => {
            const criterioEncontrado = listaTiposCriterios.data.find((c) => c.campo === campo);
            if (!criterioEncontrado?.cod_criterio) return null;

            return api.post("/api/appweb/insertar-cotizacion-detalle-criterio", {
              cod_cotizaciondetalle,
              cod_criterio: criterioEncontrado.cod_criterio,
              valor: campo === "express" ? (valor === "NORMAL" ? true : false) : (["number", "string"].includes(typeof valor) ? valor : valor?.value) || 0,
            });
          }),
      );
      await api.post(`api/appweb/generar-pdf-cotizacion-detalle`, {
        cod_cotizaciondetalle,
      });

      if (!rubro_spot)
        await api.post(`/api/appweb/activar-cotizacion-detalle`, {
          cod_cotizacion_cabecera,
          cod_cotizaciondetalle,
        });
      else if (spot_is_higher)
        await api.post(`/api/appweb/activar-cotizacion-detalle`, {
          cod_cotizacion_cabecera,
          cod_cotizaciondetalle,
        });
      await obtenerVersionesDeCotizacion();
      await viewVersionCotizacion(cod_cotizaciondetalle, {
        ...reqBody,
        cod_cotizaciondetalle,
      });
    } catch (error) {
      console.error("Error al guardar versión", error);
    } finally {
      setDescripcionSPOT(null);
      setArchivoSPOT(null);
      setReasonCodeSPOT(null);
      stopLoader("guardar");
    }
  }, [
    versionActual,
    cod_cotizacion_cabecera,
    rubrosConGruposConCW,
    criterios,
    startLoader,
    archivoSPOT,
    legs,
    criteriosParaFlete,
    listaDimensionesIngresadas,
    criterioCobertura,
    obtenerVersionesDeCotizacion,
    viewVersionCotizacion,
    stopLoader,
    cotizacion?.cod_cc,
    cotizacion?.cod_tipo_transporte,
    cod_usuario,
    reasonCodeSPOT?.value,
    descripcionSPOT,
    listaTiposCriterios.data,
  ]);

  /* =========================
     Efectos (PIPELINE)
  ========================= */

  // A) Cuando cambian plantilla + criterios base → obtener flete
  useEffect(() => {
    if (isReadOnly) return;
    if (plantilla?.cod_tarifaplantilla == null) return;
    if (!Object.keys(criteriosParaFlete || {}).length) return;

    // El resetCalcToken garantiza que siempre se re-ejecute aunque el key sea igual
    const requestKey = `${plantilla.cod_tarifaplantilla}__${criteriosParaFleteKey}__${resetCalcToken}`;
    obtenerFlete(criteriosParaFlete, requestKey);
  }, [plantilla?.cod_tarifaplantilla, criteriosParaFleteKey, obtenerFlete, resetCalcToken]);

  // B) Cuando cambia express (o cambian options), ajustar entidad seleccionada
  useEffect(() => {
    if (isReadOnly) return;

    const options = entidadesConFleteSegunExpress || [];

    // console.group("🟠 [EFECTO B] Validando carrier seleccionado");

    // console.log("seleccion actual:", {
    //   entidad_id: entidadConFlete?.entidad_id,
    //   value: entidadConFlete?.value,
    //   label: entidadConFlete?.label,
    // });

    // console.log(
    //   "options:",
    //   options.map((o, index) => ({
    //     index,
    //     entidad_id: o.entidad_id,
    //     value: o.value,
    //     label: o.label,
    //   })),
    // );

    // console.log(
    //   "¿value seleccionado existe EXACTAMENTE?:",
    //   options.some((o) => String(o.value) === String(entidadConFlete?.value)),
    // );

    // console.log(
    //   "¿entidad_id seleccionada todavía existe?:",
    //   options.some((o) => String(o.entidad_id) === String(entidadConFlete?.entidad_id)),
    // );

    // console.log({
    //   entidadIdGuardadaEnVersion,
    //   cotizacionEntidadId: cotizacion?.entidad_id,
    // });

    // console.groupEnd();

    if (!options.length) {
      // console.warn("🔴 [EFECTO B] NO HAY OPTIONS -> limpiará carrier", entidadConFlete?.value);

      if (entidadConFlete?.value) {
        setEntidadConFlete(null);
        setValoresCalculados({});
        setValoresCalculadosPorEntidad([]);
        setValoresCalculadosScale([]);
        setValoresCalculadosInternos([]);
      }
      return;
    }

    if (entidadConFlete?.value && options.some((o) => String(o.value) === String(entidadConFlete.value))) {
      // console.log("✅ [EFECTO B] carrier sigue siendo válido, NO cambia", entidadConFlete.value);

      return;
    }

    const targetId = entidadIdGuardadaEnVersion ?? cotizacion?.entidad_id ?? null;

    const byTarget = targetId ? options.find((o) => String(getEntidadIdDesdeOpcionCarrier(o.value)) === String(targetId)) : null;

    const next = byTarget || options[0] || null;

    // console.warn("🚨 [EFECTO B] VA A CAMBIAR EL CARRIER", {
    //   actual: entidadConFlete,
    //   targetId,
    //   byTarget,
    //   primerOption: options[0],
    //   next,
    // });

    if (next?.value && String(next.value) === String(entidadConFlete?.value)) return;

    setEntidadConFlete(next);

    setValoresCalculados({});
    setValoresCalculadosPorEntidad([]);
    setValoresCalculadosScale([]);
    setValoresCalculadosInternos([]);
  }, [isReadOnly, entidadesConFleteSegunExpress, entidadConFlete?.value, entidadIdGuardadaEnVersion, cotizacion?.entidad_id, getEntidadIdDesdeOpcionCarrier]);

  // C) recalcular tarifas
  useEffect(() => {
    if (isReadOnly) return;
    if (plantilla?.cod_tarifaplantilla === null || plantilla?.cod_tarifaplantilla === undefined) return;
    if (!Object.keys(criteriosParaFlete || {}).length) return;
    if (!entidadSeleccionadaId) return;
    if (!fletesCalc.length) return;

    const servicioSeleccionado = fletesCalc
      .find((r) => String(r.cod_rubro) === String(codRubroFleteSeleccionado))
      ?.servicios?.find((s) => String(s.entidad_id) === String(entidadSeleccionadaId) && String(s.cod_servicio) === String(codServicioFleteSeleccionado));
    if (!servicioSeleccionado) return;

    const nuevoValor = valorFleteCarrierManual ?? fleteSeleccionado ?? servicioSeleccionado?.metodo?.venta;
    if (nuevoValor == null) return;

    const categoria_transporte = servicioSeleccionado.categoria_transporte ?? null;

    const tarifaKey = [
      plantilla.cod_tarifaplantilla,
      criteriosParaFleteKey,
      String(entidadConFlete?.value ?? ""),
      String(servicioSeleccionado?.cod_servicio ?? ""),
      String(nuevoValor),
      String(categoria_transporte ?? ""),
      String(recalcToken || 0),
      String(resetCalcToken), // ← AGREGAR: invalida la key anterior
    ].join("__");

    if (tarifaReqKeyRef.current === tarifaKey) return;
    tarifaReqKeyRef.current = tarifaKey;

    const next = {
      ...(criterios || {}),
      categoria_transporte: categoria_transporte ?? null,
      valor_flete: nuevoValor,
    };
    // console.group("🟣 [EFECTO C] Carrier que va a calcular");

    // console.log("entidadConFlete:", entidadConFlete);

    // console.log({
    //   entidadSeleccionadaId,
    //   codRubroFleteSeleccionado,
    //   codServicioFleteSeleccionado,
    //   fleteSeleccionado,
    // });

    // console.log("servicioSeleccionado:", servicioSeleccionado);

    // console.log("categorías del servicio:", {
    //   categoria_transporte: servicioSeleccionado?.categoria_transporte,

    //   cod_categoria_transporte: servicioSeleccionado?.cod_categoria_transporte,

    //   metodo_categoria_transporte: servicioSeleccionado?.metodo?.categoria_transporte,

    //   metodo_cod_categoria_transporte: servicioSeleccionado?.metodo?.cod_categoria_transporte,

    //   criterio_actual: criterios?.categoria_transporte,
    // });

    // console.groupEnd();
    setCriterios(next);
    consultarCalcuo(next);
  }, [
    isReadOnly,
    plantilla?.cod_tarifaplantilla,
    criteriosParaFleteKey,
    entidadSeleccionadaId,
    codRubroFleteSeleccionado,
    codServicioFleteSeleccionado,
    entidadConFlete?.value,
    fleteSeleccionado,
    fletesCalc,
    consultarCalcuo,
    criterios,
    recalcToken,
    criteriosParaFlete,
    valorFleteCarrierManual,
    resetCalcToken, // ← AGREGAR
  ]);

  // D) Cuando hay valores calculados → armar listas por entidad e internos
  useEffect(() => {
    if (isReadOnly) return;

    if (!entidadSeleccionadaId) {
      setValoresCalculadosPorEntidad([]);
      setValoresCalculadosScale([]);
      if (!isReadOnly) setValoresCalculadosInternos([]);
      return;
    }

    if (!valoresCalculados.data?.length) {
      setValoresCalculadosPorEntidad([]);
      setValoresCalculadosScale([]);
      if (!isReadOnly) setValoresCalculadosInternos([]);
      return;
    }

    const filtradosEntidad = filtrarServicios(valoresCalculados.data, {
      entidad_id: entidadSeleccionadaId,
    })
      .map((rubro) => {
        if (!categoriaSeleccionada) return rubro;

        if (rubro?.es_flete) return rubro;

        const serviciosFiltrados = (rubro.servicios || []).filter((s) => {
          const codServicio = Number(s?.categoria_transporte || s?.categoria_transporte || s?.metodo?.categoria_transporte || s?.metodo?.categoria_transporte || "");

          const catServicio = (categoriaTransporte.data ?? []).find((c) => c.value === codServicio)?.label;

          // Si el servicio no tiene categoría, lo dejamos pasar
          if (!catServicio) return true;

          return catServicio === categoriaSeleccionada;
        });

        // if (!serviciosFiltrados.length &&) return null;
        if (!serviciosFiltrados.length) return null;
        return { ...rubro, servicios: serviciosFiltrados };
      })
      .filter(Boolean);

    if (!filtradosEntidad?.length) {
      setValoresCalculadosPorEntidad([]);
      setValoresCalculadosScale([]);
      if (!isReadOnly) setValoresCalculadosInternos([]);
      return;
    }

    const listaProcesada = filtrarServiciosPorClasificaciones(filtradosEntidad, CLASIFICACIONES_DUE_CARRIER, true).reduce((acc, rubro) => {
      const esRubroFlete = rubro?.es_flete === true;

      const cod_rubro_seleccionado = getCodRubroDesdeOpcionCarrier(entidadConFlete.value);

      const cod_servicio_seleccionado = getCodServicioDesdeOpcionCarrier(entidadConFlete.value);

      if (esRubroFlete && String(rubro.cod_rubro) !== String(cod_rubro_seleccionado)) {
        return acc;
      }

      const servs = (rubro.servicios || []).filter((s) => {
        if (!esRubroFlete) return true;

        return String(s.cod_servicio) === String(cod_servicio_seleccionado);
      });

      const tarifas = servs.map((s) => {
        const value = `${rubro.cod_rubro}-${s.cod_servicio}`;

        const metodo = s?.metodo || {};
        const detallesBase = Array.isArray(metodo?.detalles) ? metodo.detalles : [];
        const rateValor = metodo?.rate_venta ?? null;
        const minimo = rateValor === 0 ? metodo?.venta : undefined;
        const yaTieneRate = detallesBase.some(
          (d) =>
            String(d?.tipo_desc || "")
              .trim()
              .toUpperCase() === "CW",
        );

        const monedaVenta = monedas.data?.find((m) => m.cod_moneda === metodo?.cod_moneda_venta);

        const moneda = monedaVenta?.SIMBOLO_MONEDA ?? monedaVenta?.monedaVenta;
        const monedaSimbolo = moneda;

        const agregarRate = esRubroFlete && rateValor != null && String(rateValor).trim() !== "" && !yaTieneRate;
        const agregarMinimo = esRubroFlete && (rateValor === 0 || (minimo != null && String(minimo).trim() !== "")) && !yaTieneRate;

        const servicioConRate =
          agregarRate || agregarMinimo
            ? {
                ...s,
                metodo: {
                  ...metodo,
                  detalles: [
                    ...detallesBase,
                    {
                      tipo_desc: "CW",
                      tarifadetalle_descripcion: `${criterios.valor_cw} / ${agregarMinimo ? `Tarifa ${moneda} ${minimo}` : `${monedaSimbolo}${String(rateValor)}/KG`}`,
                      custom: true,
                    },
                  ],
                },
              }
            : s;

        return {
          value,
          ...rubro,
          ...servicioConRate,
          servicios: undefined,
          servicio: servicioConRate,
        };
      });
      return [...acc, ...tarifas];
    }, []);

    setValoresCalculadosPorEntidad(listaProcesada.filter((i) => i.cod_rubro !== 134));
    setValoresCalculadosScale(listaProcesada.filter((i) => i.cod_rubro === 134));

    if (!isReadOnly) {
      setValoresCalculadosInternos(filtrarServiciosPorClasificaciones(valoresCalculados.data, CLASIFICACIONES_DUE_AGENT));
    }
  }, [
    valoresCalculados.data,
    entidadSeleccionadaId,
    categoriaSeleccionada,
    isReadOnly,
    criterios.express,
    codigosFletes,
    criterios.valor_cw,
    monedas.data,
    categoriaTransporte.data,
    entidadConFlete?.value,
    plantillaSeleccionada,
    plantillasRubros,
  ]);

  // E) Cargar versiones cuando cambia cabecera
  useEffect(() => {
    if (!cod_cotizacion_cabecera) return;
    obtenerVersionesDeCotizacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cod_cotizacion_cabecera]);

  // F) Carga de rubros guardados si es modo lectura
  useEffect(() => {
    if (!isReadOnly) return;

    const rubrosGuardadosArmados = armarRubrosConServiciosDesdeDetalleConCatalogos(rubrosSeleccionados, {
      filtrarPorClasificacion: false,
      entidadId: null,
    });

    const dueAgentGuardados = rubrosGuardadosArmados.filter(esRubroDueAgent);
    const dueCarrierGuardados = rubrosGuardadosArmados.filter(esRubroDueCarrier);

    setValoresCalculadosInternos(dueAgentGuardados);

    setValoresCalculadosPorEntidad(dueCarrierGuardados.filter((i) => Number(i.cod_rubro) !== 134));

    setValoresCalculadosScale(dueCarrierGuardados.filter((i) => Number(i.cod_rubro) === 134));
  }, [isReadOnly, rubrosSeleccionados, armarRubrosConServiciosDesdeDetalleConCatalogos]);

  // G) Reset al cambiar cotización
  useEffect(() => {
    setVersiones([]);
    setVersionActual(null);

    setRubrosSeleccionados([]);
    setListaDimensiones([]);
    setCriteriosSeleccionados([]);
    setValoresDefaultCriterios({});
    setCriterios({});
    setPlantilla(null);

    setEntidadConFlete(null);
    setEntidadIdGuardadaEnVersion(null);

    setFletesCalc([]);
    setEntidadesConFlete([]);

    setValoresCalculados({});
    setValoresCalculadosPorEntidad([]);
    setValoresCalculadosScale([]);
    setValoresCalculadosInternos([]);

    setRubrosSeleccionadosDueAgent([]);
    setValoresCalculadosDueCarrierBasadoEnDueAgent([]);
    setTotalDueAgentSeleccionado(0);

    setRubrosConGrupos([]);
    setTotalesCriteriosIngresados([]);
    setListaDimensionesIngresadas([]);
    setRubrosProcesadosDueCarrier([]);

    setHayError(false);
    setErrorMessage("");

    fleteReqKeyRef.current = "";
    tarifaReqKeyRef.current = "";

    if (abortFleteRef.current) abortFleteRef.current.abort();
    abortFleteRef.current = null;

    resetAllLoaders();
  }, [cotizacion?.cod_cotizacion_cabecera, resetAllLoaders]);

  useEffect(() => {
    return () => {
      if (pdfUri) URL.revokeObjectURL(pdfUri);
    };
  }, [pdfUri]);

  const verificarSiDatosCompletos = useMemo(() => {
    if (!versionActual?.tipo_servicio) return false;
    if (!versionActual?.tipo_transito) return false;
    if (!versionActual?.salida) return false;
    if (!versionActual?.tipo_producto) return false;

    return true;
  }, [versionActual]);

  const handleRubrosSeleccionadosDueAgent = useCallback((rubros) => {
    const next = rubros || [];
    const total = calcularTotalRubros(next);

    setRubrosSeleccionadosDueAgent(next);
    setTotalDueAgentSeleccionado(total);
  }, []);

  useEffect(() => {
    if (isReadOnly) return;
    if (!entidadSeleccionadaId) return;

    if (!totalDueAgentSeleccionado) {
      setValoresCalculadosDueCarrierBasadoEnDueAgent([]);
      return;
    }

    // NUEVO: espera antes de consultar para no pegarle a la API en cada cambio rápido
    const timer = setTimeout(() => {
      consultarDueCarrierBasadoEnDueAgent(totalDueAgentSeleccionado);
    }, 600);

    return () => clearTimeout(timer);
  }, [totalDueAgentSeleccionado, consultarDueCarrierBasadoEnDueAgent, isReadOnly, entidadSeleccionadaId]);

  /* =========================
     Watch
  ========================= */
  // useEffect(() => {
  //   console.log("💥 [WATCH] entidadConFlete CAMBIÓ", {
  //     entidad_id: entidadConFlete?.entidad_id,
  //     value: entidadConFlete?.value,
  //     label: entidadConFlete?.label,
  //   });
  // }, [entidadConFlete]);

  // useEffect(() => {
  //   console.log("💥 [WATCH] criterios CAMBIARON", {
  //     categoria_transporte: criterios?.categoria_transporte,
  //     valor_flete: criterios?.valor_flete,
  //     criterios,
  //   });
  // }, [criterios]);

  // useEffect(() => {
  //   console.log(
  //     "💥 [WATCH] OPTIONS CAMBIARON",
  //     entidadesConFleteSegunExpress.map((o, index) => ({
  //       index,
  //       entidad_id: o.entidad_id,
  //       value: o.value,
  //     })),
  //   );
  // }, [entidadesConFleteSegunExpress]);

  /* =========================
     Render
  ========================= */

  return (
    <Grid
      container
      sx={{
        "& .divContainer": { border: "1px solid black" },
        position: "relative",
      }}
    >
      <Grid size={12} pb={2}>
        <Box sx={{ position: "relative" }}>
          <TablaEditableComponent
            idKey="cod_cotizaciondetalle"
            onRowAdded={() => {}}
            onRowUpdated={() => {}}
            onRowDeleted={() => {}}
            onRowView={viewVersionCotizacion}
            onRowEdit={() => {}}
            onRowAuth={reactivarCotizacion}
            onRowKanban={() => {}}
            onRowPdf={(id, version) => generarPDFDeCotizacion(id, version, 1)}
            onRowPdf1={(id, version) => generarPDFDeCotizacion(id, version, 2)}
            data={versiones}
            encabezados={encabezados}
            acciones={{ view: true }}
            accionesTooltip={{ pdf1: "Descargar PDF de estacion" }}
            botones={
              versiones.length >= 1 && !!versiones[0].fecha_creacion && ![CODS_ESTADOS.CONFIRMADO, CODS_ESTADOS.RECHAZADO].includes(cotizacion.cod_estado)
                ? [
                    {
                      label: "Nuevo calculo",
                      onClick: () => cargarNuevaVersion(false),
                    },
                  ]
                : []
            }
          />
        </Box>
      </Grid>

      <Grid container size={12} direction="column" columnSpacing={2}>
        <Grid
          container
          direction="row"
          size={"auto"}
          rowSpacing={2}
          sx={{
            border: "1px solid",
            borderColor: "gray.100",
            boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
          }}
          justifyContent="left"
          alignItems="center"
          borderRadius={1.2}
          px={1}
          mb={2}
        >
          <Grid size={"auto"}>
            <Typography sx={{ fontSize: 20 }}>VERSIÓN {versionActual?.version || 0}</Typography>
          </Grid>
          <Grid size={"auto"}>
            <Typography sx={{ fontSize: 20, letterSpacing: 3 }}>modo {isReadOnly ? "lectura" : "edicion"}</Typography>
          </Grid>
        </Grid>

        <Grid container size="grow" pb={2}>
          <Grid container size={12} pb={2}>
            <Grid size={esMovil ? 12 : 7} pb={2} pr={2}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "gray.100",
                  boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                  borderRadius: 2,
                  position: "relative",
                }}
              >
                <GenerarFiltrosCriterios
                  resetKey={`${cotizacion?.cod_cotizacion_cabecera || 0}-${versionActual?.cod_cotizaciondetalle || 0}`}
                  listaDimensiones={listaDimensiones}
                  valoresDefault={valoresDefaultParaFiltros}
                  criterios={criteriosSeleccionados}
                  lectura={isReadOnly}
                  cotizacion={cotizacion}
                  onValoresChange={handleValoresChange}
                  onTotalesChange={setTotalesCriteriosIngresados}
                  onDimensionesChage={setListaDimensionesIngresadas}
                  // mostrarExpress={mostrarExpress}
                />
              </Box>
            </Grid>

            <Grid size={esMovil ? 12 : 5} pb={2} pr={2}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "gray.100",
                  boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                  borderRadius: 2,
                  position: "relative",
                }}
              >
                <GenerarFormularioDatosPdf
                  valoresDefault={versionActual}
                  lectura={isReadOnly}
                  onValoresChange={({ id, val }) => setVersionActual((v) => ({ ...v, [id]: val }))}
                  cotizacion={cotizacion}
                />
              </Box>
            </Grid>
            <LoaderComponent texto={textoLoaderGlobal} open={cargandoGlobal} sx={{ position: "absolute" }} />
          </Grid>
          <Grid container direction="column" size={esMovil ? 12 : 7} justifyContent="start" alignItems="center">
            <Grid size={12} pb={2} pr={2}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "gray.100",
                  boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                  borderRadius: 2,
                  position: "relative",
                }}
                py={0.5}
                px={1}
              >
                <SelectComponent
                  key={`carrier-${entidadConFlete?.value || "null"}`}
                  input={{
                    id: "entidad",
                    label: "CARRIER",
                    val: entidadConFlete,
                    options: entidadesConFleteSegunExpress,
                    readonly: isReadOnly,
                    renderOption: "render",
                  }}
                  onInput={handleSeleccionarEntidad}
                />
              </Box>
            </Grid>

            <Grid size={12} pr={2}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "gray.100",
                  boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                  borderRadius: 2,
                  position: "relative",
                }}
                py={0.5}
                px={1}
              >
                <GenerarRubrosDueCarrier
                  lectura={isReadOnly || !entidadConFlete}
                  rubros={rubrosDueCarrierSinDuplicados}
                  entidad={entidadConFlete}
                  onRubrosProcesados={setRubrosProcesadosDueCarrier}
                  onValoresChange={(rubroFleteBase, valorSpot, rateValor) => {
                    agregarTarifaSpotDueCarrier(rubroFleteBase, valorSpot, rateValor);

                    recalcularDesdeDueCarrier(valorSpot);
                  }}
                  onRemoveSpot={quitarTarifaSpotDueCarrier}
                  criterios={criterios}
                  fleteNuevo={valorFleteCarrierManual}
                />
              </Box>
            </Grid>

            <Grid size={12} pb={2} pr={2}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "gray.100",
                  boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                  borderRadius: 2,
                  position: "relative",
                }}
                py={0.5}
                px={1}
              >
                <GenerarRubrosDueAgent
                  key={`${cotizacion?.cod_cotizacion_cabecera || 0}-${versionActual?.cod_cotizaciondetalle || 0}-${entidadConFlete?.value || 0}`}
                  lectura={isReadOnly || !entidadConFlete}
                  rubros={rubrosDueAgentSinDuplicados}
                  onRubrosSeleccionados={handleRubrosSeleccionadosDueAgent}
                  dueAgentIsValid={setDueAgentIsValid}
                  valoresDefault={rubrosSeleccionadosDueAgent}
                  serviciosAutoSeleccion={serviciosAutoSeleccion}
                  valorFlete={criterios?.valor_flete ?? null} // ← AGREGAR
                  setCriterios={setCriterioCobertura}
                  codMonedaFlete={
                    // ← AGREGAR (opcional pero útil)
                    entidadConFlete
                      ? (fletesCalc.find((r) => String(r.cod_rubro) === String(codRubroFleteSeleccionado))?.servicios?.find((s) => String(s.cod_servicio) === String(codServicioFleteSeleccionado))
                          ?.metodo?.cod_moneda_venta ?? null)
                      : null
                  }
                />
              </Box>
            </Grid>

            {valoresCalculadosDueCarrierBasadoEnDueAgent.length > 0 && (
              <Grid size={12} pb={2} pr={2}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "gray.100",
                    boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                    borderRadius: 2,
                    position: "relative",
                  }}
                  py={0.5}
                  px={1}
                >
                  <GenerarRubrosDueCarrier rubros={valoresCalculadosDueCarrierBasadoEnDueAgent} entidad={entidadConFlete} esBasadoEnDueAgent />
                </Box>
              </Grid>
            )}
            {entidadTieneRubroScale && (
              <Grid size={12} pb={2} pr={2}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "gray.100",
                    boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                    borderRadius: 2,
                    position: "relative",
                  }}
                  py={0.5}
                  px={1}
                >
                  <GenerarRubrosScalling
                    key={`${cotizacion?.cod_cotizacion_cabecera || 0}-${versionActual?.cod_cotizaciondetalle || 0}-${entidadConFlete?.value || 0}`}
                    lectura={isReadOnly || !entidadConFlete}
                    rubros={filtrarRubrosDuplicados(valoresCalculadosScale)}
                    entidad={entidadConFlete}
                    calcularScalling={consultarCalcuoScale}
                    cotizacion={cotizacion}
                    version={versionActual}
                    legs={legs}
                    setLegs={setLegs}
                    monedas={monedas.data}
                  />
                </Box>
              </Grid>
            )}
          </Grid>

          <Grid size={esMovil ? 12 : 5} pb={2} pr={2}>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "gray.100",
                boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
                borderRadius: 2,
                position: "relative",
              }}
              py={0.5}
              px={1}
            >
              <GenerarTotalRubros entidad={entidadConFlete} lectura={isReadOnly || !entidadConFlete} cotizacion={cotizacion} rubros={rubrosParaTotal} onRubrosAgrupados={setRubrosConGrupos} />
            </Box>
          </Grid>

          <Grid size={esMovil ? 12 : 7} pb={2} pr={2} textAlign="right"></Grid>
          <Grid size={esMovil ? 12 : 5} pb={2} pr={2} textAlign="right">
            {!rubrosConGruposConCW.length ? (
              <BandaAlertaComponent tipo="warning">No se ha seleccionado ningun rubro</BandaAlertaComponent>
            ) : !dueAgentIsValid ? (
              <BandaAlertaComponent tipo="error">Hay un error en la seccion de Due Agent, favor corregir antes de continuar</BandaAlertaComponent>
            ) : !verificarSiDatosCompletos ? (
              <BandaAlertaComponent tipo="error">Hay un error en la seccion de Datos complementarios de cotización, favor corregir antes de continuar</BandaAlertaComponent>
            ) : null}
            {versionActual?.cod_cotizaciondetalle === 0 && (
              <Button variant="contained" onClick={generarVersion} disabled={!verificarSiDatosCompletos || !dueAgentIsValid || loaders.guardar > 0}>
                {loaders.guardar > 0 ? "Guardando..." : "Guardar"}
              </Button>
            )}
          </Grid>
        </Grid>
      </Grid>

      <DialogComponent
        titulo="Solicitar Archivo SPOT"
        width={"50vw"}
        open={mostrarSolicitarArchivoSPOT}
        setOpen={() => {
          setMostrarSolicitarArchivoSPOT((v) => !v);
          setDescripcionSPOT("");
          setArchivoSPOT(null);
          setReasonCodeSPOT(null);
        }}
      >
        <AgregarArchivoDescripcionSPOT
          {...{ archivoSPOT, setArchivoSPOT, generarVersion, descripcionSPOT, setDescripcionSPOT, reasonCodeSPOT, setReasonCodeSPOT, reasonsCodes: tiposReasonCodeSpot.data || [] }}
        />
      </DialogComponent>

      <DialogComponent titulo="Preview de Cotizacion" width={"90vw"} open={previewPdf} setOpen={() => setPreviewPdf((v) => !v)}>
        <Grid width="100%" container>
          <Grid sx={estiloBotonIdioma(idioma, "es")} onClick={idioma !== "es" ? () => cambiarIdiomaPDF("es") : undefined}>
            Español
          </Grid>

          <Grid sx={estiloBotonIdioma(idioma, "en")} onClick={idioma !== "en" ? () => cambiarIdiomaPDF("en") : undefined}>
            Inglés
          </Grid>
        </Grid>
        <Button sx={{ width: "100%", mb: 3 }} disabled={!funcionDescargaPdf} variant="contained" onClick={funcionDescargaPdf}>
          <Grid container direction="columns" spacing={2} width="100%" justifyContent="center" justifyItems="center" alignItems="center" alignContent="center">
            <Download />
            Descargar
          </Grid>
        </Button>
        {pdfUri ? <iframe src={`${pdfUri}#toolbar=0&navpanes=0&scrollbar=0`} width="100%" height="500px" /> : <LoaderComponent texto={"Traduciendo PDF"} open={true} sx={{ position: "relative" }} />}
      </DialogComponent>

      <LoaderComponent texto={textoLoaderGlobal} open={cargandoGlobal} sx={{ position: "absolute" }} />
      {/* <pre>{JSON.stringify({ ...entidadConFlete, render: undefined }, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(valoresCalculadosScale, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(valoresCalculados, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(plantillasRubros, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(plantillaSeleccionada, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(rubrosConGruposConCW, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(rubrosParaTotal.filter(i => i.es_tarifa_spot), null, 2)}</pre> */}
    </Grid>
  );
};

GridVersionesDetalles.propTypes = { cotizacion: PropTypes.object, plantillaSeleccionada: PropTypes.object, plantillasRubros: PropTypes.array };

export default GridVersionesDetalles;
