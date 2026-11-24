import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Icon,
  Tooltip,
  GlobalStyles,
} from "@mui/material";
import StepperNav from "../../../components/StepperNav";
import { useParams, useNavigate } from "react-router-dom";
import { decryptId } from "../../../../../api/encryptDecrypt";
import {
  RutasSection,
  GastosSection,
  DocumentosSection,
  SeguimientoSection,
} from "../../../components";
import ShipperPublicas from "../../../components/seccionesPublicas/shipperPublicas";
import ConsignatarioPublicas from "../../../components/seccionesPublicas/consignatarioPublicas";
import NotificacionesPublicas from "../../../components/seccionesPublicas/NotificacionesPublicas";
import CargasPublicas from "../../../components/seccionesPublicas/CargasPublicas";
import FacturacionPublica from "../../../components/seccionesPublicas/FacturacionPublica";
import DetallesPublica from "../../../components/seccionesPublicas/DetallesPublica";
import FechasPublicas from "../../../components/seccionesPublicas/FechasPublicas";
import { useCoordinaciones, useCoordinacionCargas, useFetchIncoterms, useFetchTipos, useFetchRelacionTipo, useGenerarLinkCartaInstruccionesPrivado, useFetchPaises, useUpdateCoordinacion, useActualizarJsonCartaInstruccionesPrivado, useCartaInstruccionesData, useFetchCoordinacionFechaMov, useFetchEntidades, useFetchDatosEntidadRelacionadaAppweb, useListarCoordinacionGastos, useObtenerUltimaVersionCoordinacionGastos, extraerJsonCartaInstrucciones } from "../../../../../hooks/Bpm";
import {
  buildCartaJson,
  buildFacturacionMods,
  construirEntidadesPublicas,
  construirFacturacionPublica,
  construirNotificacionesPublica,
  extraerCamposModificados,
} from "../../../components/cartaInstrucciones/cartaModel";
import { useSelector } from "react-redux";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import CrearCoordinacionModal from "../../../components/CrearCoordinacionModal";
import InfoCoordinacion from "../../../components/infoCoordinacion";
import LinkClienteDialog from "../../../components/linkCliente";
import { buildCoordPayload } from "../../../components/secciones/payloadUtils";
import BannerInformativo from "../../../components/banner";
import LoaderComponent from "../../../../../components/Loader/LoaderComponent";

// Cuanto tiempo extra (ms) mantener el loader visible una vez que todos los
// endpoints de la vista ya respondieron, para evitar un parpadeo cuando las
// respuestas llegan casi instantáneas (cache/red local).
const ENTRY_LOADER_EXTRA_MS = 2000;

const steps = [
  "Shipper",
  "Consignatario",
  "Notificacion",
  "Producto",
  "Facturacion",
  "Detalles",
  "Gastos",
  "Documentos",
  "Fechas",
  "Rutas",
  "Seguimiento",
];

const clearPayloadIds = (obj) => {
  if (Array.isArray(obj)) return obj.map(clearPayloadIds);

  if (obj !== null && typeof obj === "object") {
    const mapped = {};

    for (const [key, value] of Object.entries(obj)) {
      if (/^(id)$|id$|_id$|^cod_/i.test(key) && !key.includes("identificacion_numero")) {
        continue;
      }

      if (["entidad", "cons_entidad", "identificacion_tributaria", "cons_identificacion_tributaria"].includes(key)) {
        continue;
      }

      mapped[key] = clearPayloadIds(value);
    }

    return mapped;
  }

  return obj;
};

const findCatalogLabel = (catalog, value) => {
  if (value === undefined || value === null || value === "") return "";

  const found = (catalog || []).find(
    (option) =>
      String(option.value) === String(value) ||
      String(option.cod_tipo) === String(value) ||
      String(option.cod_relacion_tipo) === String(value),
  );

  return found ? found.label || found.nombre || "" : String(value);
};

const mapCargaForLink = (carga, paisesCatalog, tiposEmbalajeCatalog = []) => {
  const paisIdStr = String(carga.paisOrigenId || "");
  const paisFound = paisIdStr
    ? paisesCatalog?.find(
      (pais) => String(pais.cod_pais || pais.value || "") === paisIdStr,
    )
    : null;
  const nombrePais = paisFound
    ? paisFound.nombre_pais || paisFound.NOMBRE_PAIS || paisFound.label || ""
    : "";

  const tipoEmbalajeRaw =
    carga.tipoEmbalaje ??
    carga.codTipoEmbalaje ??
    carga.TIPO_EMBALAJE ??
    carga.tipo_embalaje ??
    carga.cod_tipo_embalaje ??
    "";

  // Resolve to label text
  let tipoEmbalajeValue = tipoEmbalajeRaw;
  if (tipoEmbalajeRaw !== "" && tipoEmbalajeRaw !== null && tiposEmbalajeCatalog.length > 0) {
    const byId = tiposEmbalajeCatalog.find(
      (t) => String(t.value ?? t.codTipo ?? t.cod_tipo ?? "") === String(tipoEmbalajeRaw),
    );
    if (byId) {
      tipoEmbalajeValue = byId.label ?? byId.nomTipo ?? byId.nom_tipo ?? tipoEmbalajeRaw;
    } else {
      const byLabel = tiposEmbalajeCatalog.find(
        (t) =>
          (t.label ?? t.nomTipo ?? t.nom_tipo ?? "").toLowerCase() ===
          String(tipoEmbalajeRaw).toLowerCase(),
      );
      if (byLabel) {
        tipoEmbalajeValue = byLabel.label ?? byLabel.nomTipo ?? byLabel.nom_tipo ?? tipoEmbalajeRaw;
      }
    }
  }

  return {
    embCargaId: carga.embCargaId ?? carga.id ?? null,
    Rubro: carga.rubroNombre || "",
    PaisOrigen: nombrePais,
    Descripcion: carga.descripcionCarga || "",
    Valor: carga.valor !== undefined && carga.valor !== null ? carga.valor : "",
    TipoEmbalaje: tipoEmbalajeValue,
    PartidaArancelaria: carga.partidaArancelaria || "",
    RegimenAduanal: carga.regimenAduanal || "",
    DefinitivoGeneral: carga.definitivoGeneral || "",
    Cantidad: carga.cantidad ?? carga.bultos ?? "",
    VolumenTotal: carga.volumen ?? "",
    PesoTotal: carga.peso ?? "",
    Largo: carga.largo ?? carga.LARGO ?? carga.largo_cm ?? "",
    Alto: carga.alto ?? carga.ALTO ?? carga.alto_cm ?? "",
    Ancho: carga.ancho ?? carga.ANCHO ?? carga.ancho_cm ?? "",
    UnidadMedida: carga.tipoDescripcion || "",
    Bultos: carga.bultos ?? "",
    CW: carga.cw ?? carga.CW ?? "",
  };
};

const Page = () => {
  const { id: encryptedId } = useParams();
  // decrypt en caso de que la ruta venga con valor cifrado
  const id = encryptedId ? decryptId(encryptedId) : null;
  const [estado, setEstado] = useState(0);
  const navigate = useNavigate();
  const [stepValidity, setStepValidity] = useState(() => {
    const obj = {};
    steps.forEach((label, idx) => {
      obj[idx] = label === "Rutas" || label === "Fechas" || label === "Seguimiento" ? true : null; // Rutas, Fechas y Seguimiento no bloquean el flujo
    });
    return obj;
  });
  const [guardarSeccionError, setGuardarSeccionError] = useState("");

  const [facturacionValues, setFacturacionValues] = useState({ cliente: {}, detalles: {} });
  const handleFacturacionValuesChange = useCallback((partial) => {
    setFacturacionValues((prev) => {
      const next = { ...prev, ...partial };
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
  }, []);
  const handleDetallesPublicasValuesChange = useCallback((vals) => {
    setFacturacionValues((prev) => ({ ...prev, ...vals }));
  }, []);
  const [entidadesValues, setEntidadesValues] = useState({ shipper: {}, consignatario: {} });
  const [shipperValues, setShipperValues] = useState({});
  const [consignatarioValues, setConsignatarioValues] = useState({});
  const [notificacionesValues, setNotificacionesValues] = useState({});
  const [cargasPublicasValues, setCargasPublicasValues] = useState([]);
  const [documentosValues] = useState({ cropa: {} });
  const [fechasPublicasValues, setFechasPublicasValues] = useState({});

  const handleShipperValuesChange = useCallback((vals) => {
    setShipperValues(vals);
    setEntidadesValues((prev) => ({ ...prev, shipper: vals }));
  }, []);

  const handleConsignatarioValuesChange = useCallback((vals) => {
    setConsignatarioValues(vals);
    setEntidadesValues((prev) => ({ ...prev, consignatario: vals }));
  }, []);

  const {
    data: coordinaciones = [],
    isLoading: isLoadingEmbarque,
  } = useCoordinaciones({ cod_empresa: 1, cod_cc: 16, embarque_id: id });

  const embarqueData = coordinaciones[0] || {};

  // ID de cotización-cabecera con el que está indexada la carta de instrucciones
  // que llenó el cliente en la vista pública.
  const cotizacionCabeceraId = useMemo(
    () =>
      embarqueData?.cotizacionCabeceraId ||
      embarqueData?.cotizacioncabecera_id ||
      embarqueData?.COTIZACIONCABECERA_ID ||
      embarqueData?.cod_cotizacion_cabecera ||
      null,
    [embarqueData],
  );

  // Carta de instrucciones que el cliente ingresó/modificó desde el público.
  // Mismo camino de lectura/fusión (json_data + json_data_usuario) que la vista pública.
  const {
    jsonCarta: jsonCartaCliente,
    filaCarta: filaCartaCliente,
    refetch: refetchCartaCliente,
    isFetched: cartaFilaFetched,
  } = useCartaInstruccionesData({
    cotizacionCabeceraId,
    apiMode: "private",
    enabled: Boolean(cotizacionCabeceraId),
  });
  const { mutateAsync: actualizarJsonPrivado, isLoading: isSavingCarta } = useActualizarJsonCartaInstruccionesPrivado();

  // cartaFetchDone = true cuando: la carta ya se consultó, o cuando el embarque
  // cargó y no hay cotizacionCabeceraId (no hay carta que buscar).
  const cartaFetchDone = cartaFilaFetched || (!isLoadingEmbarque && !cotizacionCabeceraId);

  const listaCoordinacion = useMemo(() => {
    const cruda = jsonCartaCliente?.["lista-coordinacion"];
    if (Array.isArray(cruda)) return cruda[0] || {};
    if (cruda && typeof cruda === "object") return cruda;
    return {};
  }, [jsonCartaCliente]);

  // id_servicio de la coordinación (endpoint `lista-coordinacion`, ver
  // useCoordinaciones): 10 = Consolidado. Solo para ese servicio se asigna
  // guía (asignar-correlativo-guia-x-criterio) al crear la coordinación.
  // OJO: no confundir con el objeto `lista-coordinacion` dentro del JSON de la
  // carta de instrucciones (`jsonCartaCliente`) — ese es un blob distinto con
  // el mismo nombre de clave, pero solo trae los campos que el cliente llenó
  // (carta_shipper/consignatario/facturacion) y nunca incluye id_servicio.
  const idServicioListaCoordinacion = useMemo(
    () =>
      embarqueData?.idServicio ??
      embarqueData?.id_servicio ??
      embarqueData?.ID_SERVICIO ??
      null,
    [embarqueData],
  );

  // El backend usa `0` como sentinel de "sin asignar" para estos FKs (no `null`),
  // así que `??` no basta: `0 ?? siguienteFallback` devuelve `0` y nunca cae al
  // siguiente candidato. Sin filtrarlo, un shipper/consignatario con
  // ENTIDAD_ID_SHIPPER=0 "gana" sobre primerShipperRelacionado y el selector
  // queda con un id que no existe en ninguna entidad (combo vacío, y el nombre
  // tampoco se autocompleta porque las queries de detalle de entidad usan
  // `enabled: Boolean(entidad_id)`, que es false para 0).
  const primerValorAsignado = (...valores) =>
    valores.find((v) => v !== null && v !== undefined && v !== 0 && v !== "") ?? null;

  const entidadIdShipperCoordDirecto = primerValorAsignado(
    listaCoordinacion?.entidadIdShipper,
    listaCoordinacion?.entidad_id_shipper,
    embarqueData?.entidad_id_shipper,
    embarqueData?.ENTIDAD_ID_SHIPPER,
  );
  const entidadIdConsignatarioCoord = primerValorAsignado(
    listaCoordinacion?.entidadIdConsignatario,
    listaCoordinacion?.entidad_id_consignatario,
    embarqueData?.entidad_id_consignatario,
    embarqueData?.ENTIDAD_ID_CONSIGNATARIO,
  );

  const entidadIdCliente = useMemo(
    () =>
      embarqueData?.ENTIDAD_ID_CLI ??
      embarqueData?.entidad_id_cli ??
      embarqueData?.entidadIdCli ??
      null,
    [embarqueData],
  );
  // Facturación: la entidad cliente (y su contacto) los fija la coordinación,
  // igual que en la vista pública (ver entidadIdClienteCoord en public/page.jsx).
  const contactoIdCliente = useMemo(
    () =>
      embarqueData?.contactoIdCliente ??
      embarqueData?.contacto_id_cliente ??
      null,
    [embarqueData],
  );
  const cliInfoPrivado = useMemo(
    () => (entidadIdCliente ? { entidad_id: entidadIdCliente } : null),
    [entidadIdCliente],
  );

  // Cuando el cliente no cambió la selección de Shipper respecto al único
  // candidato preseleccionado (mismo fallback que ShipperPublicas/public/page.jsx
  // le muestra), `entidad_id`/`entidad_nombre` nunca entran en `_modificados` y
  // la coordinación queda sin ENTIDAD_ID_SHIPPER guardado. Sin este mismo
  // fallback acá, esta vista (CTS) muestra el selector de Shipper vacío aunque
  // la vista pública sí mostraba una entidad seleccionada — replicamos el
  // mismo criterio (primer shipper relacionado al cliente) para resolver la
  // misma entidad que el cliente vio preseleccionada.
  const { data: entidadesRelClienteData } = useFetchDatosEntidadRelacionadaAppweb(
    { entidad_id: entidadIdCliente, cod_tipo: 3, cod_estado: 1 },
    { enabled: Boolean(entidadIdCliente) && !entidadIdShipperCoordDirecto },
  );
  const primerShipperRelacionado = useMemo(() => {
    if (entidadIdShipperCoordDirecto) return null;
    const aliases = new Set(["SHIPPER", "CONSIGNOR", "REMITENTE", "EXPORTADOR", "CLIENTE"]);
    const normalizeLabel = (v) => String(v || "").normalize("NFD").replaceAll(/[̀-ͯ]/g, "").trim().toUpperCase();
    const entidades = entidadesRelClienteData?.data || [];
    return entidades.find((e) => {
      const clasificacion = normalizeLabel(e.entidad_clasificacion);
      const matchAlias = clasificacion ? aliases.has(clasificacion) : aliases.has(normalizeLabel(e.descripcion_tipo_relacion));
      return matchAlias && e.entidad_id && (e.entidad_nombre || e.data_nombres?.[0]?.entidadnombre_nombre);
    }) || null;
  }, [entidadIdShipperCoordDirecto, entidadesRelClienteData]);

  const entidadIdShipperCoord = entidadIdShipperCoordDirecto ?? primerShipperRelacionado?.entidad_id ?? null;

  // `recuperar-datos-entidad-relacionada` busca entidades RELACIONADAS a
  // entidad_id de un cod_tipo dado — no los datos propios de la entidad. El
  // cliente de facturación no tiene una relación "cliente" consigo mismo, así
  // que esa consulta siempre volvía vacía y el PDF mostraba NIT/Teléfono/Nombre
  // de Facturación en "N/A" pese a que la entidad sí tenía esos datos
  // guardados. `recuperar-datos-entidad` (singular) sí trae los datos propios
  // de la entidad — es el mismo endpoint que ya usa con éxito en pantalla
  // FacturacionPublica.jsx (apiMode="private") para autocompletar el formulario.
  const {
    data: clienteEntidadesTipo = [],
    isSuccess: clienteEntidadTipoQueryDone,
    isLoading: isLoadingClienteEntidadTipo,
  } = useFetchEntidades(
    { tipo_entidad: "CLIENTE", entidad_id: entidadIdCliente },
    { enabled: Boolean(entidadIdCliente) },
  );
  const esClientePreCliente = clienteEntidadTipoQueryDone && clienteEntidadesTipo.length === 0;
  const codTipoClienteFacturacion = clienteEntidadesTipo?.[0]?.cod_tipo ?? (esClientePreCliente ? 5 : 3);

  const entidadesPublicas = useMemo(
    () => construirEntidadesPublicas(jsonCartaCliente || {}, embarqueData),
    [jsonCartaCliente, embarqueData],
  );

  const facturacionPublica = useMemo(
    () => construirFacturacionPublica(jsonCartaCliente || {}),
    [jsonCartaCliente],
  );

  const notificacionesPublica = useMemo(
    () => construirNotificacionesPublica(jsonCartaCliente || {}),
    [jsonCartaCliente],
  );

  // Facturación es de solo lectura: la entidad de facturación es siempre la
  // entidad cliente de la coordinación (entidad_id_cli), nunca la que el
  // cliente haya guardado en carta_facturacion.cliente.entidad_id cuando la
  // sección todavía era editable (ese valor puede haber quedado desactualizado
  // y no corresponder a la entidad real de la coordinación). Solo se cae a ese
  // valor guardado si la coordinación no trae entidad_id_cli propio.
  const entidadIdClienteFacturacion = useMemo(
    () => entidadIdCliente ?? facturacionPublica.entidad_id,
    [facturacionPublica, entidadIdCliente],
  );

  const { data: incotermsCatalog = [], isLoading: isLoadingIncoterms } = useFetchIncoterms();
  const { data: tiposPagoCatalog = [], isLoading: isLoadingTiposPago } = useFetchTipos({ tipo_tabla: 'PAGO' });
  const { data: paisesCatalog = [], isLoading: isLoadingPaises } = useFetchPaises();

  const tipoIdEmbarque = useMemo(
    () =>
      embarqueData?.tipo_id_embarque ??
      embarqueData?.TIPO_ID_EMBARQUE ??
      embarqueData?.tipo_id ??
      null,
    [embarqueData],
  );
  const { data: tiposCargaCatalog = [], isLoading: isLoadingTiposCarga } = useFetchTipos({ tipo_tabla: 'TIPO_CARGA' });
  const { data: tiposEmbalajeCatalog = [], isLoading: isLoadingTiposEmbalaje } = useFetchTipos({ tipo_tabla: 'embalaje' });
  const { data: regimenAduanalCatalog = [] } = useFetchTipos({ tipo_tabla: 'REGIMEN_ADUANAL' });
  const { data: clasificacionCargaCatalog = [], isLoading: isLoadingClasificacionCarga } = useFetchTipos({ tipo_tabla: 'clasificacion_carga' });
  const { data: tiposServicioCatalog = [], isLoading: isLoadingTiposServicio } = useFetchRelacionTipo(
    { tipo_tabla: 'SERVICIO', cod_tipo_padre: tipoIdEmbarque },
    { enabled: Boolean(tipoIdEmbarque) },
  );
  // catálogo de unidad de medida de las dimensiones (largo/alto/ancho) de la
  // carga; el mismo que alimenta el select "Unidad de medida" en CargasPublicas.
  const { data: unidadMedidaCatalog = [] } = useFetchRelacionTipo(
    { tipo_tabla: 'coordinacion_carga', cod_tipo_padre: 296 },
  );
  const resolverUnidadMedida = useCallback(
    (value) => {
      if (value === undefined || value === null || value === "") return "";
      const found = (unidadMedidaCatalog || []).find(
        (t) => String(t.cod_tipo ?? t.codTipo) === String(value),
      );
      return found?.label || found?.tipo_desc || "";
    },
    [unidadMedidaCatalog],
  );
  // Mismo criterio que la vista pública: régimen aduanal, tipo de embalaje y
  // país de origen de la carga se guardan por carga como IDs (códigos) del
  // catálogo, pero el PDF necesita el nombre legible. Los resolvemos aquí con
  // el mismo catálogo que alimenta el <select> correspondiente; sin esto el PDF
  // mostraba el código crudo en vez del nombre (a diferencia de tipo de carga o
  // clasificación, que ya llegan resueltos a texto). Si el valor no matchea (p.
  // ej. ya viene como texto), se devuelve tal cual.
  const resolverRegimenAduanal = useCallback(
    (value) => {
      if (value === undefined || value === null || value === "") return "";
      const found = (regimenAduanalCatalog || []).find(
        (t) => String(t.value ?? t.cod_tipo ?? t.codTipo) === String(value),
      );
      return found?.label || found?.nombre || String(value);
    },
    [regimenAduanalCatalog],
  );
  const resolverTipoEmbalaje = useCallback(
    (value) => {
      if (value === undefined || value === null || value === "") return "";
      const found = (tiposEmbalajeCatalog || []).find(
        (t) => String(t.value ?? t.codTipo ?? t.cod_tipo) === String(value),
      );
      return found?.label || found?.nomTipo || found?.nom_tipo || String(value);
    },
    [tiposEmbalajeCatalog],
  );
  const resolverPaisOrigen = useCallback(
    (value) => {
      if (value === undefined || value === null || value === "") return "";
      const found = (paisesCatalog || []).find(
        (p) => String(p.cod_pais ?? p.value) === String(value),
      );
      return found?.nombre_pais || found?.NOMBRE_PAIS || found?.label || String(value);
    },
    [paisesCatalog],
  );

  // Resolve IDs from embarqueData into the label strings that the Detalles selectors use as values.
  const detallesFromEmbarque = useMemo(() => {
    const findLabel = (catalog, id) => {
      if (id == null || id === "") return "";
      const s = String(id);
      return catalog.find(
        (t) => String(t.value ?? "") === s || String(t.cod_tipo ?? t.codTipo ?? "") === s,
      )?.label ?? "";
    };
    const incotermId = embarqueData.incotermId ?? embarqueData.incoterm_id ?? embarqueData.INCOTERM_ID;
    const incotermOption = incotermsCatalog.find(
      (t) => String(t.value ?? "") === String(incotermId ?? ""),
    );
    return {
      tipoPago: findLabel(tiposPagoCatalog, embarqueData.tipoPago ?? embarqueData.tipo_id_pago),
      tipoCarga: findLabel(tiposCargaCatalog, embarqueData.tipoIdCarga ?? embarqueData.tipo_id_carga),
      incoterm: incotermOption?.value ?? incotermId ?? "",
      servicio: findLabel(tiposServicioCatalog, embarqueData.idServicio ?? embarqueData.id_servicio),
      clasificacionCarga: embarqueData?.clasificacionCargaId ?? embarqueData?.clasificacion_carga_id ?? "",
      peligrosidad: embarqueData.peligrosidad,
    };
  }, [embarqueData, tiposPagoCatalog, tiposCargaCatalog, tiposServicioCatalog, incotermsCatalog]);

  // Saved carta values win; fall back to embarqueData-derived values for empty fields.
  const detallesData = useMemo(() => {
    const pick = (a, b) => {
      if (a != null && a !== "") return a;
      if (b != null && b !== "") return b;
      return "";
    };
    return {
      ...facturacionPublica,
      tipoPago: pick(facturacionPublica.tipoPago, detallesFromEmbarque.tipoPago),
      tipoCarga: pick(facturacionPublica.tipoCarga, detallesFromEmbarque.tipoCarga),
      incoterm: pick(facturacionPublica.incoterm, detallesFromEmbarque.incoterm),
      servicio: pick(facturacionPublica.servicio, detallesFromEmbarque.servicio),
      clasificacionCarga: pick(facturacionPublica.clasificacionCarga, detallesFromEmbarque.clasificacionCarga),
      peligrosidad: facturacionPublica.peligrosidad ?? detallesFromEmbarque.peligrosidad,
    };
  }, [facturacionPublica, detallesFromEmbarque]);

  const { data: cargas = [], isLoading: isLoadingCargas } = useCoordinacionCargas(id);
  // Para la tabla editable, prioriza las cargas que el cliente modificó/guardó
  // (json) sobre las de BD, para que el asesor vea esas ediciones pendientes.
  const cargasCarta = useMemo(() => {
    const saved = jsonCartaCliente?.["lista-coordinacion-carga"];
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return cargas;
  }, [jsonCartaCliente, cargas]);
  // Igual que en la vista pública: si el asesor aún no ha guardado la sección
  // de cargas, usar lo que hay en pantalla (cargasPublicasValues) o en el
  // draft de la carta (cargasCarta) en vez de las cargas ya persistidas en BD
  // (`cargas`), que pueden venir vacías cuando el embarque todavía no tiene
  // filas guardadas en `coordinacion_carga`.
  const cargasParaPdf = useMemo(() => {
    const fuente = cargasPublicasValues.length > 0 ? cargasPublicasValues : cargasCarta;
    if (!Array.isArray(fuente) || fuente.length === 0) return cargasCarta;
    // OJO: no hay atajo para el caso "cargas sin editar". Antes se devolvía
    // `cargasCarta` tal cual cuando el asesor no había tocado la sección
    // Producto, y esas filas traen los IDs crudos de catálogo (tipo de embalaje,
    // país de origen, unidad de medida, régimen aduanal) — por eso el PDF
    // mostraba el código en vez del nombre con solo abrir y descargar. La
    // resolución debe correr SIEMPRE, igual que tipo/clasificación de carga.
    return fuente.map((f) => {
      const paisOrigenNombre = resolverPaisOrigen(f.paisOrigenId ?? f.PaisOrigen ?? f.paisOrigen ?? "");
      const tipoEmbalajeLabel = resolverTipoEmbalaje(
        f.tipoEmbalaje ?? f.TipoEmbalaje ?? f.tipo_embalaje ?? f.codTipoEmbalaje ?? f.cod_tipo_embalaje ?? "",
      );
      return {
        // conservar el resto de campos originales que el generador del PDF
        // sigue leyendo de la fila cruda.
        ...f,
        descripcionCarga: f.descripcionCarga ?? f.Descripcion ?? f.descripcion ?? "",
        valor: f.valor ?? f.Valor ?? "",
        bultos: f.cantidad ?? f.Cantidad ?? f.Bultos ?? f.bultos ?? 0,
        cantidad: f.cantidad ?? f.Cantidad ?? 0,
        peso: f.pesoTotal ?? f.PesoTotal ?? f.peso ?? 0,
        volumen: f.volumenTotal ?? f.VolumenTotal ?? f.volumen ?? 0,
        partidaArancelaria: f.partidaArancelaria ?? f.PartidaArancelaria ?? "",
        regimenAduanal: resolverRegimenAduanal(f.regimenAduanal ?? f.RegimenAduanal ?? f.regimen_aduanal ?? ""),
        // se escriben las dos variantes de clave que lee `useInformacionPdf`
        // para que el label ya resuelto gane sobre el ID crudo de la fila.
        tipoEmbalaje: tipoEmbalajeLabel,
        tipo_embalaje: tipoEmbalajeLabel,
        definitivoGeneral: f.definitivoGeneral ?? f.DefinitivoGeneral ?? "N",
        paisOrigen: paisOrigenNombre,
        nombre_pais_origen: paisOrigenNombre,
        tarimas: f.tarimas ?? f.Tarimas ?? 0,
        cajas: f.cajas ?? f.Cajas ?? 0,
        largo: f.largo ?? f.Largo ?? 0,
        alto: f.alto ?? f.Alto ?? 0,
        ancho: f.ancho ?? f.Ancho ?? 0,
        unidadMedidaLabel: resolverUnidadMedida(f.unidadMedida ?? f.UnidadMedida ?? f.unidadMedidaId ?? ""),
        cw: f.cw ?? f.CW ?? "",
      };
    });
  }, [cargasPublicasValues, cargasCarta, resolverUnidadMedida, resolverRegimenAduanal, resolverTipoEmbalaje, resolverPaisOrigen]);

  const { data: fechasMovData = [], isLoading: isLoadingFechasMov } = useFetchCoordinacionFechaMov({ embarque_id: id }, { enabled: !!id });

  // Determinar si se debe mostrar el paso "Fechas": solo si algún gasto de la
  // coordinación tiene cod_rubro = 12. Mismo criterio que la vista pública
  // (ver showFechas en public/page.jsx).
  const {
    data: ultimaVersionGastosData,
    isSuccess: isVersionGastosLoaded,
    isLoading: isLoadingVersionGastos,
  } = useObtenerUltimaVersionCoordinacionGastos(id || null);
  const embarqueVersionGastos = ultimaVersionGastosData?.embarque_version ?? null;
  const { data: gastosCoordinacion = [], isLoading: isLoadingGastosCoordinacion } = useListarCoordinacionGastos({
    embarque_id: id,
    embarque_version: embarqueVersionGastos,
    enabled: !!id && isVersionGastosLoaded,
  });
  const showFechas = useMemo(() => {
    return gastosCoordinacion.some((g) => Number(g.COD_RUBRO ?? g.cod_rubro) === 12);
  }, [gastosCoordinacion]);

  // Pasos visibles: se omite "Fechas" si showFechas es false.
  const filteredSteps = useMemo(() => {
    if (showFechas) return steps;
    return steps.filter((s) => s !== "Fechas");
  }, [showFechas]);

  const isLoadingPdfData =
    isLoadingEmbarque || isLoadingCargas ||
    isLoadingIncoterms || isLoadingTiposPago || isLoadingTiposCarga || isLoadingPaises || isLoadingClasificacionCarga;

  // Las secciones Gastos, Documentos, Rutas y Seguimiento se montan junto con
  // las demás (ver `opciones` más abajo: todas se renderizan a la vez y solo
  // se alternan con display none/block), así que disparan sus propios
  // endpoints desde el primer render sin esperar a que el usuario haga click
  // en su pestaña. Si no se incluyen aquí, el loader de entrada desaparece
  // mientras esas secciones todavía tienen peticiones en vuelo.
  const [isLoadingGastosSeccion, setIsLoadingGastosSeccion] = useState(true);
  const [isLoadingDocumentosSeccion, setIsLoadingDocumentosSeccion] = useState(true);
  const [isLoadingRutasSeccion, setIsLoadingRutasSeccion] = useState(true);
  const [isLoadingSeguimientoSeccion, setIsLoadingSeguimientoSeccion] = useState(true);

  // Las secciones de entidad (Shipper, Consignatario, Facturacion, Detalles)
  // usan EntidadPublicFormSection, que dispara sus propios endpoints
  // (recuperar-datos-entidad-relacionada, contactos, direcciones,
  // identificaciones, paises/ciudades/departamentos/municipios en cascada) sin
  // exponer ningun onLoadingChange al padre. Esos endpoints solo arrancan una
  // vez que el embarque/carta resuelven los IDs de entidad, asi que quedaban
  // en vuelo justo cuando el loader se ocultaba. useIsFetching cuenta cualquier
  // query de react-query todavia activa (no hay queries con polling en la app,
  // ver hooks/Bpm) y cubre esas secciones sin tener que cablear cada una.
  const anyQueryFetching = useIsFetching() > 0;

  // true mientras cualquier endpoint que la vista necesita para mostrarse
  // por completo aún esté en vuelo. Controla el loader de pantalla completa
  // que se muestra al entrar al registro.
  const isLoadingAnyEndpoint =
    anyQueryFetching ||
    isLoadingEmbarque ||
    !cartaFetchDone ||
    isLoadingClienteEntidadTipo ||
    isLoadingIncoterms ||
    isLoadingTiposPago ||
    isLoadingPaises ||
    isLoadingTiposCarga ||
    isLoadingTiposEmbalaje ||
    isLoadingTiposServicio ||
    isLoadingClasificacionCarga ||
    isLoadingCargas ||
    isLoadingFechasMov ||
    isLoadingVersionGastos ||
    isLoadingGastosCoordinacion ||
    isLoadingGastosSeccion ||
    isLoadingDocumentosSeccion ||
    isLoadingRutasSeccion ||
    isLoadingSeguimientoSeccion;

  const [showEntryLoader, setShowEntryLoader] = useState(true);
  useEffect(() => {
    if (isLoadingAnyEndpoint) return;
    const timer = setTimeout(() => setShowEntryLoader(false), ENTRY_LOADER_EXTRA_MS);
    return () => clearTimeout(timer);
  }, [isLoadingAnyEndpoint]);

  const codFileFromCargas = cargas && cargas.length > 0 ? cargas[0].codFile : "";
  const codFile =
    codFileFromCargas ||
    (embarqueData?.cod_file || embarqueData?.COD_FILE || embarqueData?.codFile || "");

  const nonValidatingSteps = new Set(["Rutas", "Fechas", "Seguimiento"]);
  const draftRelevantSteps = new Set(["Shipper", "Consignatario", "Producto", "Facturacion", "Detalles", "Gastos"]);
  // "pending" no cuenta como válido para habilitar "Crear Coordinación": esa acción
  // aplica los cambios ya guardados en json_data_usuario, así que una sección con
  // ediciones sin guardar debe bloquear el botón (ver useCommitPendingChanges).
  const allStepsValid = Object.entries(stepValidity)
    .filter(([idx]) => !nonValidatingSteps.has(filteredSteps[Number(idx)]))
    .every(([, value]) => value === true || value === "valid");
  const hasUnsavedSection = Object.entries(stepValidity)
    .filter(([idx]) => !nonValidatingSteps.has(filteredSteps[Number(idx)]))
    .some(([, value]) => value === "pending");
  const isPreClientWarning = stepValidity[3] === "pre-cliente";

  // Una sección reporta null mientras no ha disparado onValidityChange (está cargando).
  // Excluir pistas que no forman parte de la creación obligatoria.
  const allSectionsInitialized = Object.entries(stepValidity)
    .filter(([idx]) => !nonValidatingSteps.has(filteredSteps[Number(idx)]))
    .every(([, v]) => v !== null);

  const { cod_usuario } = useSelector((state) => state.auth);

  const isCrearCoordinacionDisabled =
    !allStepsValid || isLoadingPdfData || !allSectionsInitialized;

  const crearCoordinacionTooltip = (() => {
    if (!isCrearCoordinacionDisabled) return "";
    if (hasUnsavedSection) {
      return "Guarde los cambios pendientes en cada sección antes de crear la coordinación.";
    }
    const base = "Complete todos los pasos antes de crear la coordinación.";
    return isPreClientWarning
      ? `${base} El pre-cliente debe convertirse en Cliente para completar.`
      : base;
  })();
  const [isCrearCoordinacionOpen, setIsCrearCoordinacionOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const { mutateAsync: actualizarCoordinacion } = useUpdateCoordinacion();
  const queryClient = useQueryClient();

  const commitContext = useMemo(
    () => ({
      embarqueData,
      jsonCartaCliente,
      listaCoordinacion,
      fechasMovData,
      catalogos: {
        tiposPagoCatalog,
        tiposCargaCatalog,
        tiposServicioCatalog,
        tiposEmbalajeCatalog,
      },
      cod_usuario,
      entidadIdCliente,
      cotizacionCabeceraId,
      refetchCartaCliente,
      embarqueId: id,
      // Fallback de shipper/consignatario preseleccionados que el formulario ya
      // muestra como "válido" (ver entidadIdShipperCoord/entidadIdConsignatarioCoord
      // arriba) pero que puede no estar todavía en `lc.entidad_id_shipper` ni en
      // `embarqueData.entidad_id_shipper` (coordinación nueva, sin guardar
      // explícitamente ese campo porque coincide con el default). Sin pasarlo,
      // commitPendingChanges no tiene forma de saber cuál es esa entidad y omite
      // el rol por completo (ver candidateEntidadId en useCommitPendingChanges).
      entidadIdShipperCoord,
      entidadIdConsignatarioCoord,
    }),
    [
      embarqueData,
      jsonCartaCliente,
      listaCoordinacion,
      fechasMovData,
      tiposPagoCatalog,
      tiposCargaCatalog,
      tiposServicioCatalog,
      tiposEmbalajeCatalog,
      cod_usuario,
      entidadIdCliente,
      cotizacionCabeceraId,
      refetchCartaCliente,
      id,
      entidadIdShipperCoord,
      entidadIdConsignatarioCoord,
    ],
  );

  const handleCrearCoordinacionSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
    queryClient.invalidateQueries({ queryKey: ["lista-coordinacion"] });
    queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas"] });
  }, [queryClient]);

  // Extract existing link from json_datos_opcionales
  const existingLinkCliente = useMemo(() => {
    const raw =
      embarqueData?.json_datos_opcionales ??
      embarqueData?.jsonDatosOpcionales ??
      embarqueData?.json_atributos_opcionales ??
      embarqueData?.jsonAtributosOpcionales ??
      null;
    if (!raw) return "";
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return parsed?.linkCliente || "";
    } catch {
      return "";
    }
  }, [embarqueData]);

  const saveLinkToJson = useCallback(async (url) => {
    if (!url || !embarqueData) return;
    let existingJson = {};
    const rawJson =
      embarqueData?.json_datos_opcionales ??
      embarqueData?.jsonDatosOpcionales ??
      embarqueData?.json_atributos_opcionales ??
      embarqueData?.jsonAtributosOpcionales ??
      null;
    if (rawJson) {
      try {
        existingJson = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
      } catch {
        // ignore
      }
    }
    const newJson = { ...existingJson, linkCliente: url };
    const payload = buildCoordPayload(embarqueData, { json_datos_opcionales: newJson }, cod_usuario);
    try {
      await actualizarCoordinacion(payload);
    } catch (err) {
      console.error("Error guardando link en json_datos_opcionales:", err);
    }
  }, [embarqueData, cod_usuario, actualizarCoordinacion]);

  const {
    mutate: generarLink,
    isLoading: isGeneratingLink,
  } = useGenerarLinkCartaInstruccionesPrivado({
    onSuccess: (data) => {
      let url = data?.data?.url_cliente || data?.data?.link || data?.link || data?.url;
      if (!url && typeof data === "string") {
        url = data;
      }
      if (typeof url === "object") {
        url = JSON.stringify(url);
      }
      if (typeof url === "string") {
        url = url.replaceAll('"', "");
      }
      setGeneratedLink(url);
      saveLinkToJson(url);
    },
    onError: (err) => {
      console.error("Error generando link carta:", err);
      setGeneratedLink("");
    },
  });

  const handleGuardarSeccion = useCallback(
    async (overrideCargas) => {
      if (overrideCargas?.nativeEvent) {
        overrideCargas = undefined;
      }

      const cargasChanged =
        overrideCargas !== undefined || cargasPublicasValues.length > 0;

      const cargasBase =
        overrideCargas ??
        (cargasPublicasValues.length > 0
          ? cargasPublicasValues
          : jsonCartaCliente?.["lista-coordinacion-carga"] || []);

      const shipperMods = extraerCamposModificados(shipperValues);
      const consignatarioMods = extraerCamposModificados(consignatarioValues);
      const notificacionesMods = extraerCamposModificados(notificacionesValues);
      const facturacionMods = buildFacturacionMods(
        extraerCamposModificados(facturacionValues?.cliente),
        extraerCamposModificados(facturacionValues?.detalles),
      );
      const fechasMods = fechasPublicasValues?.fecha_recoleccion
        ? { fecha_recoleccion: fechasPublicasValues.fecha_recoleccion }
        : null;

      const cropaOriginal =
        jsonCartaCliente?.["lista-coordinacion"]?.carta_documentos?.cropa || {};
      const cropaActual = documentosValues.cropa || {};
      const cropaChanged = Object.entries(cropaActual).some(
        ([key, value]) => value !== (cropaOriginal[key] ?? false),
      );
      const documentosMods = cropaChanged ? { cropa: cropaActual } : null;

      const { json_data, json_data_usuario } = buildCartaJson({
        originals: {
          listaCoordinacion,
          cargas: jsonCartaCliente?.["lista-coordinacion-carga"] || [],
          fechasMov: jsonCartaCliente?.["lista-coordinacion-fecha-mov"] || [],
        },
        secciones: {
          shipperMods,
          consignatarioMods,
          notificacionesMods,
          facturacionMods,
          fechasMods,
          documentosMods,
          cargas: cargasBase,
          cargasChanged,
        },
        entidades: {
          shipper: {
            selected: shipperValues?.entidad_id,
            original: entidadIdShipperCoord,
            explicito: Array.isArray(shipperValues?._modificados) && shipperValues._modificados.includes("entidad_id"),
          },
          consignatario: {
            selected: consignatarioValues?.entidad_id,
            original: entidadIdConsignatarioCoord,
            explicito: Array.isArray(consignatarioValues?._modificados) && consignatarioValues._modificados.includes("entidad_id"),
          },
        },
      });

      try {
        setGuardarSeccionError("");
        // NO se envía cod_link_publico: en producción se observó que un guardado
        // con cod_link_publico escribe sobre OTRO link_id y el cambio nunca se
        // refleja al releer la carta (la lectura resuelve la fila por
        // cod_cotizacion_cabecera). Síntoma: capturar un shipper/consignatario,
        // guardar, y al recargar los datos vuelven al fallback de la cotización
        // (la sección reaparece como "Faltan campos" pese a haberse guardado).
        // Es el MISMO workaround que ya aplica commitPendingChanges al limpiar el
        // overlay: un guardado sin cod_link_publico sí persiste porque el backend
        // resuelve la fila con cod_cotizacion_cabecera. El validador del hook
        // acepta el campo como opcional.
        await actualizarJsonPrivado({
          json_data,
          json_data_usuario,
          cod_cotizacion_cabecera: cotizacionCabeceraId,
        });

        await refetchCartaCliente();

        // El GET de `fila-carta-instrucciones` inmediatamente después del POST
        // puede no reflejar aún la escritura (consistencia eventual del
        // backend), dejando el formulario con el indicador "Sin guardar" pese
        // a que el guardado sí ocurrió. Mismo workaround que ya usa la vista
        // pública (ver comentario en public/page.jsx): reconstruimos localmente
        // el `jsonCarta` fusionado que produciría el backend con lo que
        // acabamos de enviar y lo escribimos directo en la caché, para que el
        // formulario no dependa del timing de esa lectura.
        const jsonCartaOptimista = extraerJsonCartaInstrucciones({ data: { json_data, json_data_usuario } });
        if (jsonCartaOptimista) {
          queryClient.setQueryData(
            ["carta-instrucciones-data", "private", cotizacionCabeceraId],
            (prev) => ({ jsonCarta: jsonCartaOptimista, filaCarta: prev?.filaCarta ?? null }),
          );
        }
      } catch (err) {
        console.error(
          "Error guardando carta de instrucciones privado:",
          err
        );
        setGuardarSeccionError(
          err?.response?.data?.message || err?.message || "No se pudo guardar la sección. Intente nuevamente."
        );
      }
    },
    [
      jsonCartaCliente,
      listaCoordinacion,
      shipperValues,
      consignatarioValues,
      notificacionesValues,
      facturacionValues,
      fechasPublicasValues,
      cargasPublicasValues,
      documentosValues,
      entidadIdShipperCoord,
      entidadIdConsignatarioCoord,
      cotizacionCabeceraId,
      actualizarJsonPrivado,
      refetchCartaCliente,
      queryClient,
    ]
  );
  const handleNuevaCargaSuccess = useCallback(() => {
    refetchCartaCliente();
  }, [refetchCartaCliente]);

  const handleValidityChange = useCallback((stepIndex, isValid) => {
    setStepValidity((prev) => (prev[stepIndex] === isValid ? prev : { ...prev, [stepIndex]: isValid }));
  }, []);

  // Si showFechas cambia a false mientras Fechas está seleccionado, retroceder
  // a Documentos para evitar un estado inválido (mismo patrón que public/page.jsx).
  // Se dispara solo en la transición true -> false (no en cada cambio de `estado`):
  // una vez que "Fechas" se oculta, "Rutas" ocupa ese mismo índice en filteredSteps,
  // así que comparar por índice en cada render redirigía también al hacer click en Rutas.
  const fechasStepIndex = steps.indexOf("Fechas");
  const prevShowFechasRef = useRef(showFechas);
  useEffect(() => {
    const prevShowFechas = prevShowFechasRef.current;
    prevShowFechasRef.current = showFechas;
    if (prevShowFechas && !showFechas && estado === fechasStepIndex) {
      setEstado(fechasStepIndex - 1);
    }
  }, [showFechas, estado, fechasStepIndex]);

  const validityHandlers = useMemo(
    () => filteredSteps.map((_, index) => (isValid) => handleValidityChange(index, isValid)),
    [handleValidityChange, filteredSteps],
  );

  const opciones = filteredSteps.map((label, idx) => {
    let contentComponent;

    switch (label) {
      case "Shipper":
        contentComponent = (
          <ShipperPublicas
            data={entidadesPublicas.exportador}
            isLoading={!cartaFetchDone}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={handleShipperValuesChange}
            onSave={handleGuardarSeccion}
            isSaving={isSavingCarta}
            cliInfo={cliInfoPrivado}
            apiMode="private"
            selectedEntidadId={entidadIdShipperCoord}
          />
        );
        break;
      case "Consignatario":
        contentComponent = (
          <ConsignatarioPublicas
            data={entidadesPublicas.consignatario}
            isLoading={!cartaFetchDone}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={handleConsignatarioValuesChange}
            onSave={handleGuardarSeccion}
            isSaving={isSavingCarta}
            cliInfo={cliInfoPrivado}
            apiMode="private"
            selectedEntidadId={entidadIdConsignatarioCoord}
          />
        );
        break;
      case "Notificacion":
        contentComponent = (
          <NotificacionesPublicas
            data={notificacionesPublica}
            isLoading={!cartaFetchDone}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={setNotificacionesValues}
            onSave={handleGuardarSeccion}
            isSaving={isSavingCarta}
            consignatarioData={entidadesPublicas.consignatario}
            apiMode="private"
          />
        );
        break;
      case "Producto":
        contentComponent = (
          <CargasPublicas
            data={cargasCarta}
            isLoading={isLoadingCargas}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={setCargasPublicasValues}
            onSave={handleGuardarSeccion}
            isSaving={isSavingCarta}
            cliInfo={null}
            onSaveSuccess={handleNuevaCargaSuccess}
            apiMode="private"
          />
        );
        break;
      case "Facturacion":
        contentComponent = (
          <FacturacionPublica
            data={facturacionPublica}
            isLoading={!cartaFetchDone}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={handleFacturacionValuesChange}
            onSave={handleGuardarSeccion}
            isSaving={isSavingCarta}
            cliInfo={cliInfoPrivado}
            apiMode="private"
            selectedEntidadId={entidadIdClienteFacturacion}
            contactoIdCliente={contactoIdCliente}
          />
        );
        break;
      case "Detalles":
        contentComponent = (
          <DetallesPublica
            data={detallesData}
            isLoading={!cartaFetchDone}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={handleDetallesPublicasValuesChange}
            onSave={handleGuardarSeccion}
            isSaving={isSavingCarta}
            apiMode="private"
            tipoPagoCatalog={tiposPagoCatalog}
            tipoCargaCatalog={tiposCargaCatalog}
            serviciosCatalog={tiposServicioCatalog}
            clasificacionCargaCatalog={clasificacionCargaCatalog}
          />
        );
        break;
      case "Gastos":
        contentComponent = (
          <GastosSection
            embarqueId={id}
            embarqueData={embarqueData}
            onValidityChange={validityHandlers[idx]}
            onLoadingChange={setIsLoadingGastosSeccion}
            mostrarAgregarServicio={false}
          />
        );
        break;
      case "Documentos":
        contentComponent = (
          <DocumentosSection
            embarque_id={id}
            embarqueData={embarqueData}
            cod_file={codFile}
            onValidityChange={validityHandlers[idx]}
            onLoadingChange={setIsLoadingDocumentosSeccion}
          />
        );
        break;
      case "Fechas":
        contentComponent = (
          <FechasPublicas
            data={entidadesPublicas.exportador}
            isLoading={!cartaFetchDone}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={setFechasPublicasValues}
            onSave={handleGuardarSeccion}
            isSaving={isSavingCarta}
          />
        );
        break;
      case "Rutas":
        contentComponent = (
          <RutasSection
            embarque_id={Number(id)}
            onValidityChange={validityHandlers[idx]}
            required={false}
            onLoadingChange={setIsLoadingRutasSeccion}
            mostrarBotonAgregar={false}
          />
        );
        break;
      case "Seguimiento":
        contentComponent = (
          <SeguimientoSection
            embarqueData={embarqueData}
            onValidityChange={validityHandlers[idx]}
            codTipo={35}
            onLoadingChange={setIsLoadingSeguimientoSeccion}
          />
        );
        break;
      default:
        contentComponent = (
          <>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              {label}
            </Typography>
            <Typography>
              Contenido del paso {idx + 1}: {label}
            </Typography>
          </>
        );
    }

    return {
      id: idx,
      label,
      content: null,
      _realContent: contentComponent,
    };
  });

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, width: "100%", maxWidth: "100%", minWidth: 0, position: "relative", minHeight: showEntryLoader ? "100vh" : undefined }}>
      <GlobalStyles
        styles={(theme) =>
          theme.palette.mode === "dark"
            ? {
              // Iconos de fuente (clase c-*) y SVGs de lucide-react: blancos en dark mode
              // para que sean visibles sobre el fondo oscuro. Los iconos heredan color
              // del padre y, sin esta regla, en botones outlined con color primario
              // quedan azul oscuro (#0B2967) sobre fondo oscuro y son casi invisibles.
              '[class^="c-"], [class*=" c-"]': { color: "#fff !important" },
              "svg.lucide": { color: "#fff !important", stroke: "#fff !important" },
            }
            : {}
        }
      />
      <LoaderComponent open={showEntryLoader} sx={{ position: "fixed" }} />
      <Card sx={{ mb: 2, width: "100%", minWidth: 0, overflow: "hidden" }}>
        <CardContent sx={{ minWidth: 0 }}>
          {/* información de la coordinación y sus cargas */}
          <InfoCoordinacion
            cargas={cargas}
            isLoading={isLoadingEmbarque || isLoadingCargas}
            coordinacion={embarqueData}
            showGuia={false}
          />
        </CardContent>
      </Card>

      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.default",
          pt: { xs: 1, md: 2 },
          mt: { xs: -1, md: -2 },
        }}
      >
        <Card sx={{ mb: 2, width: "100%", minWidth: 0, overflow: "hidden" }}>
          <CardContent sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 1,
                justifyContent: "space-between",
                alignItems: { xs: "stretch", md: "center" },
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="outlined"
                size="small"
                fullWidth={false}
                sx={{
                  color: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined),
                  borderColor: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined),
                  width: { xs: "100%", md: "auto" },
                }}
                startIcon={<Icon className="c-izquierda" sx={{ color: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined) }} />}
                onClick={() => navigate(-1)}
              >
                Regresar
              </Button>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  flexGrow: 1,
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined),
                    borderColor: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined),
                    width: { xs: "100%", sm: "auto" },
                  }}
                  startIcon={<Icon className="c-link" sx={{ color: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined) }} />}
                  onClick={() => {
                    setGeneratedLink("");
                    setIsLinkDialogOpen(true);
                  }}
                  disabled={isGeneratingLink}
                >
                  Link Cliente
                </Button>
                <Tooltip
                  title={crearCoordinacionTooltip}
                  arrow
                  slotProps={{
                    tooltip: {
                      sx: {
                        fontSize: "1.05rem",
                        lineHeight: 1.4,
                        padding: "10px 14px",
                      },
                    },
                  }}
                >
                  <Box component="span" sx={{ display: "inline-block", width: { xs: "100%", sm: "auto" } }}>
                    <Button
                      variant="contained"
                      size="small"
                      color="success"
                      fullWidth
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                      startIcon={<Icon className="c-guardar" sx={{ color: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined) }} />}
                      onClick={() => setIsCrearCoordinacionOpen(true)}
                      disabled={isCrearCoordinacionDisabled}
                    >
                      Crear Coordinación
                    </Button>
                  </Box>
                </Tooltip>
              </Box>
            </Box>
            {/* dialog for copying the client link */}
            <LinkClienteDialog
              open={isLinkDialogOpen}
              onClose={() => setIsLinkDialogOpen(false)}
              existingLink={existingLinkCliente}
              generatedLink={generatedLink}
              isLoading={isGeneratingLink}
              onGenerateNew={(enviarNotificacion) => {
                setGeneratedLink("");


                const { cod_cc: coordCodCc, cod_empresa: coordCodEmpresa } =
                  buildCoordPayload(embarqueData);

                const cotizacionCabeceraId =
                  embarqueData?.cotizacionCabeceraId ||
                  embarqueData?.cotizacioncabecera_id ||
                  embarqueData?.COTIZACIONCABECERA_ID ||
                  embarqueData?.cod_cotizacion_cabecera;

                if (!cotizacionCabeceraId) {
                  console.error("No se encontró cotizacionCabeceraId en embarqueData para generar link");
                  return;
                }

                const entidadIdCliente =
                  embarqueData?.ENTIDAD_ID_CLI ||
                  embarqueData?.entidad_id_cli ||
                  embarqueData?.entidadIdCli ||
                  0;

                // Usar la carta ya fusionada (json_data + json_data_usuario) como base del
                // nuevo link, y reenviar json_data_usuario tal cual está guardado, para
                // que el nuevo link conserve exactamente el estado actual y no se pierda nada.
                const json_data_usuario_actual =
                  filaCartaCliente?.json_data_usuario ??
                  filaCartaCliente?.JSON_DATA_USUARIO ??
                  filaCartaCliente?.jsonDataUsuario ??
                  null;

                const payload = {
                  entidad_id: entidadIdCliente || 0,
                  cod_cotizacion_cabecera: Number(cotizacionCabeceraId),
                  embarque_id: Number(id),
                  cod_modulo: 12,
                  cod_cc: coordCodCc ?? 0,
                  cod_empresa: coordCodEmpresa ?? 0,
                  endpoint_front: import.meta.env.VITE_FRONT_URL || globalThis.location.origin,
                  url_front: `/public/cts/${cotizacionCabeceraId}`,
                  json_data: jsonCartaCliente || {
                    "lista-coordinacion": embarqueData,
                    "lista-coordinacion-carga": cargas,
                    "lista-coordinacion-fecha-mov": fechasMovData,
                  },
                  json_data_usuario: json_data_usuario_actual,
                  enviar_notificacion: Boolean(enviarNotificacion),
                };
                generarLink(payload);
              }}
            />
          </CardContent>
        </Card>

        <Card sx={{ mb: 2, width: "100%", minWidth: 0, overflow: "hidden" }}>
          <CardContent sx={{ minWidth: 0 }}>
            {guardarSeccionError && (
              <BannerInformativo
                titulo="Error al guardar"
                mensaje={guardarSeccionError}
                severidad="error"
                acciones={
                  <Button color="inherit" size="small" onClick={() => setGuardarSeccionError("")}>
                    Cerrar
                  </Button>
                }
              />
            )}
            <StepperNav
              steps={filteredSteps}
              activeStep={estado}
              stepValidity={stepValidity}
              onStepClick={setEstado}
            />
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 2, width: "100%", minWidth: 0, overflow: "hidden" }}>
        <CardContent sx={{ minWidth: 0 }}>
          {opciones.map((opcion, idx) => (
            <Box
              key={opcion.id}
              sx={{
                p: { xs: 1, md: 2 },
                display: estado === idx ? "block" : "none",
                width: "100%",
              }}
            >
              {opcion._realContent}
            </Box>
          ))}
        </CardContent>
      </Card>

      {
        isCrearCoordinacionOpen && (
          <CrearCoordinacionModal
            open={isCrearCoordinacionOpen}
            onClose={() => setIsCrearCoordinacionOpen(false)}
            embarqueData={embarqueData}
            embarqueId={id}
            idServicio={idServicioListaCoordinacion}
            onSuccess={handleCrearCoordinacionSuccess}
            commitContext={commitContext}
          />
        )
      }
    </Box >
  );
};

Page.propTypes = {};

export default Page;
