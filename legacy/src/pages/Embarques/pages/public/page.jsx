import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tooltip,
  GlobalStyles,
} from "@mui/material";
import { Link2Off, Info } from "lucide-react";
import StepperNav from "../../components/StepperNav";
import { useParams, useLocation } from "react-router-dom";
import ShipperPublicas from "../../components/seccionesPublicas/shipperPublicas";
import ConsignatarioPublicas from "../../components/seccionesPublicas/consignatarioPublicas";
import NotificacionesPublicas from "../../components/seccionesPublicas/NotificacionesPublicas";
import FacturacionPublica from "../../components/seccionesPublicas/FacturacionPublica";
import DetallesPublica from "../../components/seccionesPublicas/DetallesPublica";
import CargasPublicas from "../../components/seccionesPublicas/CargasPublicas";
import FechasPublicas from "../../components/seccionesPublicas/FechasPublicas";
import DocumentosPublicas from "../../components/seccionesPublicas/DocumentosPublicas";
import {
  useActualizarJsonCartaInstruccionesPublico,
  useCartaInstruccionesData,
  useFetchDatosEntidadPublico,
  useFetchDatosEntidadRelacionadaPublico,
  useFetchIndustriasPublico,
  useFetchPaisesPublico,
  useResumenCoordinacionPublico,
  useFetchTiposV2,
  useFetchRelacionTipoPublicV2,
  extraerJsonCartaInstrucciones,
} from "../../../../hooks/Bpm";
import { useFetchIncotermsPublicV2 } from "../../../../hooks/Fetch/useFetchPublic";
import ActionAlertComponent from "../../../../components/Dialog/ActionAlertComponent";
import SuccessScreen from "../../../../components/bpm/SuccessScreen";
import SubirInstructivoFirmadoModal from "../../../../components/bpm/modals/SubirInstructivoFirmadoModal";
import { useInformacionPdf } from "../../hooks/useInformacionPdf";
import LoaderComponent from "../../../../components/Loader/LoaderComponent";
import { CROPA_DOCS } from "../../components/secciones/detalles";
import { unionModificados } from "../../components/seccionesPublicas/validation";
import {
  buildCartaJson,
  buildFacturacionMods,
  construirEntidadesPublicas,
  construirFacturacionPublica,
  construirNotificacionesPublica,
  construirInfoCoordinacionPublica,
  extraerCamposModificados,
  resolveEntidadId,
} from "../../components/cartaInstrucciones/cartaModel";
import {
  buildEntidadRelacionadaSlim,
  normalizeKeys,
} from "../../components/cartaInstrucciones/entidadRelacionada";

const steps = [
  "Shipper",
  "Consignatario",
  "Notificacion",
  "Producto",
  "Facturacion",
  "Detalles",
  "Documentos",
  "Fechas",
];

// Clasificación de carga que exige documentación de peligrosidad (hoja de seguridad).
const CLASIFICACION_CARGA_PELIGROSA = 122;

// Instrucciones mostradas al cliente, dependientes de la sección activa.
const INSTRUCCIONES_POR_PASO = {
  Shipper: "Selecciona el shipper a utilizar. No olvides guardar tus cambios al final del formulario.",
  Consignatario: "Selecciona un consignatario de tu lista o crea uno nuevo. No olvides guardar tus cambios.",
  Notificacion: "Ingresa los datos de contacto. No olvides guardar tus cambios.",
  Producto: "En la tabla, da clic en \"Ver\" y completa la información del producto.",
  Facturacion: "Tus datos de facturación ya están ingresados. Verifica que la información sea correcta.",
  Detalles: "Completa los detalles de pago, tipo de carga e incoterm de tu embarque.",
  Documentos: "Adjunta los documentos requeridos para continuar con el proceso.",
  Fechas: "Indica la fecha y hora en que se realizará la recolección de tu carga.",
};
const INSTRUCCION_DEFAULT = "Complete el formulario y guarde los cambios en cada sección.";

const Page = () => {
  const { id } = useParams();
  // En la URL pública `/public/cts/:id`, `id` es el cod_cotizacion_cabecera con el
  // que se indexa la carta de instrucciones (lo escribe genera-link como url_front).
  const cotizacionCabeceraId = id;
  const location = useLocation();
  const queryClient = useQueryClient();
  const [tokenReady, setTokenReady] = useState(false);

  // decode cli_inf query parameter (base64 or JWT) once
  const cliInfo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const cli = params.get("cli_inf");
    if (!cli) return null;

    // Sanitizar: los + del base64 se convierten a espacio en query params
    const cliSanitized = cli.replace(/\s/g, "+");

    // intento 1: cli_inf es base64 de un JSON plano
    // (solo si no parece JWT, para evitar el falso positivo de atob)
    if (!cliSanitized.includes(".")) {
      try {
        const decoded = atob(cliSanitized);
        const json = JSON.parse(decoded);
        if (json && typeof json === "object") {
          return { ...json, token_interaccion: json.token_interaccion || cli };
        }
      } catch (error) {
        // no era base64-json, sigue
        console.error(error)
      }
    }

    // intento 2: cli_inf es un JWT — decodifica el payload para extraer
    // entidad_id / app_version sin necesidad de validar la firma.
    const parts = cliSanitized.split(".");
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]));
        return {
          token_interaccion: cli,
          entidad_id: payload?.entidad_id ?? payload?.ENTIDAD_ID ?? null,
          app_version: payload?.app_version ?? null,
          embarque_id: payload?.embarque_id ?? payload?.EMBARQUE_ID ?? null,
        };
      } catch (error) {
        // no era un JWT válido, ignora
        console.error(error)
      }
    }

    return { token_interaccion: cli };
  }, [location.search]);

  // Seteo de los tokens en localStorage cuando cliInfo esté listo.
  // Esto se ejecuta antes de montar los componentes hijos gracias al retraso de renderizado.
  useEffect(() => {
    if (cliInfo?.token_interaccion) {
      localStorage.setItem("public_token", cliInfo.token_interaccion);
    } else {
      localStorage.removeItem("public_token");
    }
    const versionApp = cliInfo?.version_app || "0.0.2";
    localStorage.setItem("public_version_app", versionApp);
    setTokenReady(true);

    return () => {
      localStorage.removeItem("public_token");
      localStorage.removeItem("public_version_app");
    };
  }, [cliInfo]);

  const [estado, setEstado] = useState(0);
  const [stepValidity, setStepValidity] = useState(() => {
    const obj = {};
    steps.forEach((_, idx) => {
      obj[idx] = false;
    });
    return obj;
  });
  const [shipperValues, setShipperValues] = useState({});
  const [consignatarioValues, setConsignatarioValues] = useState({});
  const [notificacionesValues, setNotificacionesValues] = useState({});
  const [fechasValues, setFechasValues] = useState({});
  const [facturacionValues, setFacturacionValues] = useState({ cliente: {}, detalles: {} });

  const handleFacturacionValuesChange = useCallback((vals) => {
    setFacturacionValues((prev) => ({ ...prev, ...vals }));
  }, []);

  const handleDetallesPublicasValuesChange = useCallback((vals) => {
    setFacturacionValues((prev) => ({ ...prev, ...vals }));
  }, []);

  const [cargasPublicasValues, setCargasPublicasValues] = useState([]);
  const [documentosValues] = useState({ cropa: {} });
  // estado para mostrar alertas genericas
  const [alertState, setAlertState] = useState({ open: false, tipo: "success", content: "" });
  // Mensaje del backend cuando la gestión ya culminó (cod_mensaje 1002). Al
  // setearlo, la página reemplaza el formulario por la SuccessScreen.
  const [completadoMensaje, setCompletadoMensaje] = useState("");
  const embarqueData = {};
  // Modal intermedio que solicita al cliente subir el PDF del Instructivo
  // Embarque firmado antes de ejecutar las acciones de "Completar".
  const [modalCompletarAbierto, setModalCompletarAbierto] = useState(false);

  const {
    data: resumenData,
    isLoading: cartaLoading,
    refetch: refetchCarta,
  } = useResumenCoordinacionPublico(
    { embarque_id: cliInfo?.embarque_id },
    { enabled: tokenReady && !!cliInfo?.embarque_id },
  );

  // Carta guardada (json_data + json_data_usuario fusionados). MISMO camino de
  // lectura que la vista privada: así el cliente vuelve a ver sus propias
  // modificaciones tras recargar y el asesor ve exactamente lo mismo.
  const {
    jsonCarta: jsonCartaCliente,
    yaCulmino,
    mensajeCulmino,
    tokenExpirado,
    refetch: refetchFilaCarta,
    isFetched: cartaFilaFetched,
  } = useCartaInstruccionesData({
    cotizacionCabeceraId,
    apiMode: "public",
    enabled: tokenReady,
  });

  // cargas: prioriza las ediciones guardadas por el cliente (json), cae al resumen.
  const cargas = useMemo(() => {
    const saved = jsonCartaCliente?.["lista-coordinacion-carga"];
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return resumenData?.cargas || [];
  }, [jsonCartaCliente, resumenData]);

  const { mutateAsync: actualizarJson, isLoading: isSaving } = useActualizarJsonCartaInstruccionesPublico();

  const codFileFromCargas = cargas && cargas.length > 0 ? cargas[0].codFile : "";

  const listaCoordinacion = useMemo(() => resumenData?.coordinacion || {}, [resumenData]);
  // A diferencia de `listaCoordinacion` (snapshot crudo de resumen-coordinacion,
  // sin carta_shipper/carta_consignatario/carta_facturacion), esta es la carta ya
  // fusionada (json_data + json_data_usuario). `handleGuardarSeccion` la necesita
  // como "originals.listaCoordinacion" para preservar las secciones que el cliente
  // ya guardó y que no está tocando en el guardado actual — usar `listaCoordinacion`
  // ahí borraba carta_shipper/carta_consignatario al guardar solo Facturación (o
  // cualquier otra sección), porque esos campos nunca existen en el resumen crudo.
  const cartaListaCoordinacionGuardada = useMemo(
    () => jsonCartaCliente?.["lista-coordinacion"] || {},
    [jsonCartaCliente],
  );
  const entidadIdConsignatarioCoord = useMemo(
    () => resolveEntidadId(jsonCartaCliente, listaCoordinacion, "consignatario"),
    [jsonCartaCliente, listaCoordinacion],
  );

  // Las secciones quedan en loading hasta que también resuelva la carta guardada
  // (evita un flash con los originales antes de aplicar los overrides del cliente).
  const seccionesLoading = cartaLoading || (Boolean(cotizacionCabeceraId) && !cartaFilaFetched);

  // El loader de pantalla completa debe cubrir TODA la carga inicial: token +
  // carta + fila de carta Y también TODOS los endpoints que disparan los
  // componentes hijos al montarse (catálogos de embalaje, ENTIDAD_CONTACTOS,
  // depto/municipio/ciudad, relación-tipo SERVICIO, etc.).
  //
  // Antes el loader sólo esperaba los hooks del padre y se ocultaba antes de
  // que los hijos se montaran — los selects del formulario aparecían vacíos
  // hasta que sus catálogos terminaban, y se veían peticiones terminando con
  // el formulario ya visible.
  //
  // Solución: usar `useIsFetching()` (cuenta TODAS las queries activas en el
  // QueryClient) como puerta mientras sea la carga inicial. Para que esa cuenta
  // incluya las queries de los hijos, el formulario se monta desde el inicio
  // *detrás* del overlay del loader (position:absolute) en vez de
  // cortocircuito con un early-return — así los hijos montan y sus fetches se
  // registran antes de que el loader se oculte.
  //
  // Hay un detalle importante: la carga es en CASCADA — `lista-relacion-tipo
  // SERVICIO` depende de `resumen-coordinacion.coordinacion.tipoIdEmbarque`, y
  // `depto-x-pais` / `municipios` / `ciudad` dependen de que `paises` se cargue
  // y el formulario seleccione un país. Estas queries se disparan SOLO después
  // de que las anteriores terminan, en momentos distintos. Si marcáramos
  // `initialLoadRef.current = false` al primer silencio de `fetchingCount`,
  // nuevas queries de la cascada reabrirían el gate pero con
  // `initialLoadRef.current=false` уже no, y el loader se ocultaría demasiado
  // pronto — por eso el ref sólo se voltea a false DENTRO del timer, una vez
  // que se sostiene el silencio por una ventana de debounce.
  //
  // `initialLoadRef` también asegura que cualquier refetch posterior (p.ej.
  // al descargar PDF, al guardar, o refetchOnMount) NO reabra el loader global.
  const fetchingCount = useIsFetching();
  const initialLoadRef = useRef(true);
  const isInitialFetching = initialLoadRef.current && fetchingCount > 0;
  const isPageLoading = !tokenReady || seccionesLoading || isInitialFetching;
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    if (isPageLoading) {
      setShowLoader(true);
      return;
    }
    // Sólo cuando `isPageLoading` es false se dispara el timer. Si nuevas
    // queries (siguiente etapa de la cascada) reabren `isPageLoading`, el
    // efecto se re-corre y este timer se cancela — el loader no parpadea.
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
      setShowLoader(false);
    }, 1000 * 2); // x segundos
    return () => clearTimeout(timer);
  }, [isPageLoading]);

  // Entidades relacionadas del cliente — misma query que usa EntidadPublicFormSection,
  // TanStack Query la cachea y no genera peticiones extra.
  const {
    data: entidadesRelacionadasData,
    refetch: refetchEntidadesRelacionadas,
  } = useFetchDatosEntidadRelacionadaPublico(
    { entidad_id: cliInfo?.entidad_id, cod_estado: 1 },
    { enabled: Boolean(cliInfo?.entidad_id) && tokenReady },
  );
  const allEntidades = useMemo(
    () => (entidadesRelacionadasData?.data || []).map(normalizeKeys),
    [entidadesRelacionadasData],
  );

  // Entidades filtradas por rol shipper para el fallback (mismos aliases que ShipperPublicas).
  const entidadesShipper = useMemo(() => {
    const normalizeLabel = (v) => String(v || "").normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "").trim().toUpperCase();
    const aliases = new Set(["SHIPPER", "CONSIGNOR", "REMITENTE", "EXPORTADOR", "CLIENTE"]);
    return allEntidades.filter((e) => {
      const clasificacion = normalizeLabel(e.entidad_clasificacion);
      if (clasificacion) return aliases.has(clasificacion);
      return aliases.has(normalizeLabel(e.descripcion_tipo_relacion));
    });
  }, [allEntidades]);

  const entidadIdShipperCoord = useMemo(
    () => {
      const id = resolveEntidadId(jsonCartaCliente, listaCoordinacion, "shipper");
      if (id) return id;
      const first = entidadesShipper.find(
        (e) => e.entidad_id && (e.entidad_nombre || e.data_nombres?.[0]?.entidadnombre_nombre),
      );
      return first?.entidad_id ?? null;
    },
    [jsonCartaCliente, listaCoordinacion, entidadesShipper],
  );

  // catálogo de países público: se usa para traducir los IDs de país que
  // vienen en la coordinación (paisIdOrigen/paisIdDestino) a nombres legibles
  // cuando la carta no trae ya el nombre resuelto.
  const { data: paisesCatalog = [] } = useFetchPaisesPublico();
  const paisesPorId = useMemo(() => {
    const map = new Map();
    (paisesCatalog || []).forEach((p) => {
      if (p.cod_pais != null) map.set(String(p.cod_pais), p.nombre_pais);
    });
    return map;
  }, [paisesCatalog]);
  const resolverNombrePais = useCallback(
    (id) => (id != null && id !== "" ? paisesPorId.get(String(id)) || "" : ""),
    [paisesPorId],
  );

  // `entidad_nombre` a veces llega vacío en la fila de coordinación/carta
  // guardada (mismo problema documentado en entidadPublicFormSection.jsx);
  // si pasa, tomamos el nombre desde la lista de entidades relacionadas del
  // cliente buscando por el entidad_id del shipper/consignatario.
  const resolverNombreEntidadPorId = useCallback(
    (entidadId) => {
      if (entidadId == null || entidadId === "") return "";
      const ent = allEntidades.find((e) => String(e.entidad_id) === String(entidadId));
      return ent?.entidad_nombre || ent?.data_nombres?.[0]?.entidadnombre_nombre || "";
    },
    [allEntidades],
  );

  // el contacto (nombre/email) tampoco se guarda en carta_shipper/carta_consignatario
  // (solo el teléfono y el `_contacto_tipo_list` seleccionado); el nombre/email real
  // vive en `data_contactos` de la entidad relacionada.
  const resolverContactoEntidadPorId = useCallback(
    (entidadId, tiposSeleccionados = [], contactoIdPreferido = null) => {
      if (entidadId == null || entidadId === "") return { nombre: "", email: "", telefono: "" };
      const ent = allEntidades.find((e) => String(e.entidad_id) === String(entidadId));
      const contactos = ent?.data_contactos || [];
      if (contactos.length === 0) return { nombre: "", email: "", telefono: "" };
      const tipos = (tiposSeleccionados || []).map(String);
      const tiposDeContacto = (c) => {
        let raw = c.data_entidad_contacto_tipo ?? [];
        if (typeof raw === "string") {
          try { raw = JSON.parse(raw); } catch { raw = []; }
        }
        return Array.isArray(raw) ? raw : [];
      };
      // algunas entidades tienen contactos "vacíos" (mismo tipo de contacto
      // pero sin nombre/email/teléfono, por ejemplo registros de prueba); el
      // match heurístico por tipo debe ignorarlos, si no el PDF terminaba
      // mostrando "N/A" pese a que la entidad sí tenía un contacto real con
      // datos para ese mismo tipo.
      const tieneDatos = (c) => Boolean(
        c?.entidadcontacto_nombre || c?.entidadcontacto_email || c?.entidadcontacto_telefono,
      );
      // el contacto elegido explícitamente en la coordinación (por ID) siempre
      // gana sobre el match por tipo de contacto, que es solo un fallback
      // heurístico cuando no hay un contacto puntual seleccionado.
      const porId = contactoIdPreferido != null && contactoIdPreferido !== ""
        ? contactos.find((c) => String(c.entidadcontacto_id) === String(contactoIdPreferido))
        : null;
      const match = tipos.length
        ? contactos.find((c) => tieneDatos(c) && tiposDeContacto(c).some(
          (t) => tipos.includes(String(t.cod_tipo ?? t.COD_TIPO)),
        ))
        : null;
      const contacto = porId || match || contactos.find(tieneDatos) || contactos[0];
      return {
        nombre: contacto?.entidadcontacto_nombre || "",
        email: contacto?.entidadcontacto_email || "",
        telefono: contacto?.entidadcontacto_telefono || "",
      };
    },
    [allEntidades],
  );

  // El NIT tampoco se guarda en carta_shipper/carta_consignatario salvo que el
  // cliente lo edite explícitamente (EntidadPublicFormSection solo lo autocompleta
  // en pantalla desde el maestro de la entidad, vía `allEntidades`). Sin este
  // fallback, justo después de guardar (antes de recargar la página) el PDF
  // mostraba "N/A" en NIT aunque el formulario sí lo mostrara relleno.
  const resolverNitEntidadPorId = useCallback(
    (entidadId) => {
      if (entidadId == null || entidadId === "") return "";
      const ent = allEntidades.find((e) => String(e.entidad_id) === String(entidadId));
      const nit = (ent?.data_identificaciones || []).find(
        (i) => String(i.nom_identificacion || "").toLowerCase() === "nit",
      );
      return nit?.entidadidentificacio_numero || "";
    },
    [allEntidades],
  );

  // Misma situación que el NIT: la dirección de recolección/entrega solo se
  // autocompleta en pantalla desde `allEntidades` (cod_tipo 145) y no se
  // persiste en carta_shipper/carta_consignatario si el cliente no la edita.
  const resolverDireccionEntidadPorId = useCallback(
    (entidadId) => {
      if (entidadId == null || entidadId === "") return "";
      const ent = allEntidades.find((e) => String(e.entidad_id) === String(entidadId));
      const direccion = (ent?.data_direcciones || []).find((d) => Number(d.cod_tipo) === 145);
      return direccion?.entidaddireccion_direccion || "";
    },
    [allEntidades],
  );

  const entidadesPublicas = useMemo(
    () => construirEntidadesPublicas(jsonCartaCliente || {}, listaCoordinacion),
    [jsonCartaCliente, listaCoordinacion],
  );
  const facturacionPublica = useMemo(
    () => construirFacturacionPublica(jsonCartaCliente || {}),
    [jsonCartaCliente],
  );
  const notificacionesPublica = useMemo(
    () => construirNotificacionesPublica(jsonCartaCliente || {}),
    [jsonCartaCliente],
  );

  // Facturación es de solo lectura: la entidad cliente la fija siempre la
  // coordinación (entidadIdCli); solo se cae a la entidad que el cliente haya
  // guardado en carta_facturacion.cliente.entidad_id (de cuando la sección aún
  // era editable) si la coordinación no trae entidadIdCli propio.
  const entidadIdClienteCoord = useMemo(
    () => listaCoordinacion?.entidadIdCli ?? facturacionPublica.entidad_id ?? null,
    [facturacionPublica, listaCoordinacion],
  );
  const contactoIdClienteCoord = useMemo(
    () => listaCoordinacion?.contactoIdCliente ?? null,
    [listaCoordinacion],
  );

  // Mismo maestro que consulta FacturacionPublica (`recuperar-datos-entidad`)
  // para autocompletar NIT/dirección fiscal en pantalla; TanStack Query cachea
  // por `entidad_id` así que esto no genera una petición extra. Sin esto,
  // `cartaPublicaData.nitFactura` quedaba vacío justo después de guardar
  // (antes de recargar) cuando el cliente nunca editó el NIT manualmente,
  // porque esa entidad de facturación no siempre aparece en `allEntidades`
  // (que solo trae las entidades relacionadas al cliente del link, no
  // necesariamente la entidad de facturación elegida).
  const { data: facturacionEntidadData } = useFetchDatosEntidadPublico(
    { entidad_id: entidadIdClienteCoord },
    { enabled: tokenReady && Boolean(entidadIdClienteCoord) },
  );
  const nitFacturacionResuelto = useMemo(() => {
    const idents = (facturacionEntidadData?.data_identificaciones || []).filter(
      (i) => i.cod_estado == null || Number(i.cod_estado) === 1,
    );
    const nit =
      idents.find((i) => String(i.nom_identificacion || "").toLowerCase() === "nit") ||
      idents.find((i) => ["46", "3"].includes(String(i.cod_identificacion))) ||
      idents[0] ||
      null;
    return nit?.entidadidentificacio_numero || "";
  }, [facturacionEntidadData]);
  const direccionFiscalResuelta = useMemo(() => {
    const dirs = (facturacionEntidadData?.data_direcciones || []).filter(
      (d) => d.cod_estado == null || Number(d.cod_estado) === 1,
    );
    const direccion =
      dirs.find((d) => Number(d.cod_tipo) === 12) ||
      dirs.find((d) => Number(d.cod_tipo) === 11) ||
      dirs[0] ||
      null;
    return direccion?.entidaddireccion_direccion || "";
  }, [facturacionEntidadData]);
  // Mismo problema que el NIT/dirección fiscal: nombre y contacto de la
  // entidad de facturación se autocompletan en pantalla desde este mismo
  // maestro (`recuperar-datos-entidad`), no desde `allEntidades` (que puede no
  // incluir esta entidad) — sin este fallback el PDF mostraba "N/A" en Nombre
  // y Email de Facturación justo después de guardar, aunque el formulario los
  // mostrara rellenos.
  const nombreFacturacionResuelto = useMemo(
    () => facturacionEntidadData?.data_entidad?.[0]?.entidad_nombre || "",
    [facturacionEntidadData],
  );
  const contactoFacturacionResuelto = useMemo(() => {
    const contactos = (facturacionEntidadData?.data_contactos || []).filter(
      (c) => c.cod_estado == null || Number(c.cod_estado) === 1,
    );
    if (contactos.length === 0) return { nombre: "", email: "", telefono: "" };
    const contacto =
      contactos.find((c) => String(c.entidadcontacto_id) === String(contactoIdClienteCoord)) ||
      contactos[0];
    return {
      nombre: contacto?.entidadcontacto_nombre || "",
      email: contacto?.entidadcontacto_email || "",
      telefono: contacto?.entidadcontacto_telefono || "",
    };
  }, [facturacionEntidadData, contactoIdClienteCoord]);

  // Catalogs needed to resolve IDs from resumen-coordinacion into selector text values.
  const { data: tipoPagoCatalog = [] } = useFetchTiposV2("PAGO", { enabled: tokenReady });
  const { data: tipoCargaCatalog = [] } = useFetchTiposV2("TIPO_CARGA", { enabled: tokenReady });
  const { data: clasificacionCargaCatalog = [] } = useFetchTiposV2("clasificacion_carga", { enabled: tokenReady });
  // catálogo para traducir el código de régimen aduanal (guardado por carga)
  // a su etiqueta legible en el PDF (p. ej. "366" -> "ALMACENADORA").
  const { data: regimenAduanalCatalog = [] } = useFetchTiposV2("REGIMEN_ADUANAL", { enabled: tokenReady });
  // catálogo para traducir el código de tipo de embalaje (guardado por carga)
  // a su etiqueta legible en el PDF, igual que se hace con régimen aduanal.
  const { data: tipoEmbalajeCatalog = [] } = useFetchTiposV2("embalaje", { enabled: tokenReady });
  // catálogo de unidad de medida de las dimensiones (largo/alto/ancho) de la
  // carga; el mismo que alimenta el select "Unidad de medida" en CargasPublicas.
  const { data: unidadMedidaCatalog = [] } = useFetchRelacionTipoPublicV2(
    { tipo_tabla: "coordinacion_carga", cod_tipo_padre: 296 },
    { enabled: tokenReady },
  );
  const { data: serviciosCatalog = [] } = useFetchRelacionTipoPublicV2(
    { tipo_tabla: "SERVICIO", cod_tipo_padre: listaCoordinacion?.tipoIdEmbarque },
    { enabled: tokenReady && !!listaCoordinacion?.tipoIdEmbarque },
  );
  const { data: incotermCatalog = [] } = useFetchIncotermsPublicV2({}, { enabled: tokenReady });

  // Resolve IDs from resumen-coordinacion.coordinacion into the text/ID values
  // that the Detalles selectors use as their option values.
  const detallesFromCoordinacion = useMemo(() => {
    const findLabel = (catalog, id) => {
      if (id == null || id === "") return "";
      const s = String(id);
      return catalog.find(
        (t) => String(t.value ?? "") === s || String(t.cod_tipo ?? t.codTipo ?? "") === s,
      )?.label ?? "";
    };
    const incotermOption = incotermCatalog.find(
      (t) => String(t.value ?? "") === String(listaCoordinacion?.incotermId ?? ""),
    );
    return {
      tipoPago: findLabel(tipoPagoCatalog, listaCoordinacion?.tipoIdPago),
      tipoCarga: findLabel(tipoCargaCatalog, listaCoordinacion?.tipoIdCarga),
      incoterm: incotermOption?.value ?? listaCoordinacion?.incotermId ?? "",
      servicio: findLabel(serviciosCatalog, listaCoordinacion?.idServicio),
      clasificacionCarga: listaCoordinacion?.clasificacionCargaId ?? "",
      peligrosidad: listaCoordinacion?.peligrosidad,
    };
  }, [listaCoordinacion, tipoPagoCatalog, tipoCargaCatalog, serviciosCatalog, incotermCatalog]);

  // Merge: saved carta values win; fall back to coordinacion-derived values for empty fields.
  const detallesData = useMemo(() => {
    const pick = (a, b) => {
      if (a != null && a !== "") return a;
      if (b != null && b !== "") return b;
      return "";
    };
    return {
      ...facturacionPublica,
      tipoPago: pick(facturacionPublica.tipoPago, detallesFromCoordinacion.tipoPago),
      tipoCarga: pick(facturacionPublica.tipoCarga, detallesFromCoordinacion.tipoCarga),
      incoterm: pick(facturacionPublica.incoterm, detallesFromCoordinacion.incoterm),
      servicio: pick(facturacionPublica.servicio, detallesFromCoordinacion.servicio),
      clasificacionCarga: pick(facturacionPublica.clasificacionCarga, detallesFromCoordinacion.clasificacionCarga),
      peligrosidad: facturacionPublica.peligrosidad ?? detallesFromCoordinacion.peligrosidad,
    };
  }, [facturacionPublica, detallesFromCoordinacion]);

  const infoCoordinacionPublica = useMemo(
    () => construirInfoCoordinacionPublica(embarqueData, jsonCartaCliente || {}),
    [jsonCartaCliente],
  );

  // Determinar si se debe mostrar la sección de documentos CROPA:
  // solo si algún gasto de la coordinación tiene cod_rubro = 127.
  const showCropaDocs = useMemo(() => {
    const gastos = resumenData?.gastos || [];
    return gastos.some((g) => Number(g.codRubro) === 127);
  }, [resumenData]);

  // Determinar si se debe mostrar la sección Fecha:
  // solo si algún gasto de la coordinación tiene cod_rubro = 12.
  const showFechas = useMemo(() => {
    const gastos = resumenData?.gastos || [];
    return gastos.some((g) => Number(g.codRubro) === 12);
  }, [resumenData]);

  // Determinar si se debe mostrar la pestaña Documentos: solo si la
  // clasificación de carga es PELIGROSA (122), para exigir la Hoja de
  // Seguridad (MSDS) antes de completar el formulario.
  const showDocumentosPeligrosidad = useMemo(() => {
    return Number(detallesData.clasificacionCarga) === CLASIFICACION_CARGA_PELIGROSA;
  }, [detallesData.clasificacionCarga]);

  // Determinar si hay cobertura de seguro activa: en Detalles se guarda como
  // "C" dentro del array `peligrosidad` (checkbox "Cobertura de Seguro"), no
  // como un booleano `coberturaSeguro` separado — ver DetallesPublica.jsx y
  // construirFacturacionPublica en cartaModel.js. Cuando está activa se exige
  // la Factura de Cobertura de Seguro en la pestaña Documentos.
  const showDocumentosCoberturaSeguro = useMemo(() => {
    return Array.isArray(detallesData.peligrosidad) && detallesData.peligrosidad.includes("C");
  }, [detallesData.peligrosidad]);

  // Pasos visibles: se omiten "Documentos" y "Fechas" cuando no aplican.
  const filteredSteps = useMemo(() => {
    return steps.filter((s) => {
      if (s === "Documentos") return showDocumentosPeligrosidad || showDocumentosCoberturaSeguro;
      if (s === "Fechas") return showFechas;
      return true;
    });
  }, [showFechas, showDocumentosPeligrosidad, showDocumentosCoberturaSeguro]);

  // `detallesData.incoterm` guarda el ID numérico del catálogo (lo que espera
  // el <select>), pero el PDF no tiene un control de selección que resuelva ese
  // ID a texto — necesita el label directamente. Sin esto, `cartaPublicaData.incoterm`
  // llevaba el ID crudo (o "") al PDF y el campo siempre mostraba "No especificado"
  // aunque el Incoterm sí estuviera seleccionado y guardado.
  const incotermLabelParaPdf = useMemo(() => {
    const id = detallesData.incoterm;
    if (id == null || id === "") return "";
    const opcion = incotermCatalog.find((t) => String(t.value ?? "") === String(id));
    return opcion?.label ?? String(id);
  }, [detallesData.incoterm, incotermCatalog]);

  // Mismo problema que el Incoterm: tipoPago/tipoCarga/servicio se guardan como
  // IDs de catálogo en `carta_facturacion.detalles`. Sin resolverlos a su etiqueta
  // legible, el PDF los mostraba en blanco aunque el cliente ya los hubiera
  // seleccionado y guardado.
  const resolverLabelCatalogo = useCallback((catalog, id) => {
    if (id == null || id === "") return "";
    const opcion = (catalog || []).find((t) => String(t.value ?? "") === String(id));
    return opcion?.label ?? String(id);
  }, []);
  const tipoPagoLabelParaPdf = useMemo(
    () => resolverLabelCatalogo(tipoPagoCatalog, detallesData.tipoPago),
    [resolverLabelCatalogo, tipoPagoCatalog, detallesData.tipoPago],
  );
  const tipoCargaLabelParaPdf = useMemo(
    () => resolverLabelCatalogo(tipoCargaCatalog, detallesData.tipoCarga),
    [resolverLabelCatalogo, tipoCargaCatalog, detallesData.tipoCarga],
  );
  const servicioLabelParaPdf = useMemo(
    () => resolverLabelCatalogo(serviciosCatalog, detallesData.servicio),
    [resolverLabelCatalogo, serviciosCatalog, detallesData.servicio],
  );
  const clasificacionCargaLabelParaPdf = useMemo(
    () => resolverLabelCatalogo(clasificacionCargaCatalog, detallesData.clasificacionCarga),
    [resolverLabelCatalogo, clasificacionCargaCatalog, detallesData.clasificacionCarga],
  );

  // el codFile que mostramos en el encabezado debe preferir el valor
  // directo de la carta, pero caerá en el dato de las cargas si no hay
  // otra información disponible.
  const codFile = useMemo(() => {
    return codFileFromCargas || infoCoordinacionPublica?.cod_file || listaCoordinacion?.codFile || "";
  }, [codFileFromCargas, infoCoordinacionPublica, listaCoordinacion]);

  // objeto de overrides para el PDF: combina los datos enriquecidos de la carta
  // de instrucciones pública en un único objeto que el hook useInformacionPdf
  // puede aplicar con mayor prioridad que los datos crudos del embarque.
  const contactoExportadorResuelto = useMemo(
    () => resolverContactoEntidadPorId(
      entidadesPublicas.exportador.entidad_id ?? entidadIdShipperCoord,
      entidadesPublicas.exportador._contacto_tipo_list,
    ),
    [resolverContactoEntidadPorId, entidadesPublicas, entidadIdShipperCoord],
  );
  const contactoConsignatarioResuelto = useMemo(
    () => resolverContactoEntidadPorId(
      entidadesPublicas.consignatario.entidad_id ?? entidadIdConsignatarioCoord,
      entidadesPublicas.consignatario._contacto_tipo_list,
    ),
    [resolverContactoEntidadPorId, entidadesPublicas, entidadIdConsignatarioCoord],
  );
  // `entidadesPublicas.consignatario.contacto/email/telefonos` solo trae datos si
  // el cliente los editó explícitamente (extraerCamposModificados solo persiste
  // campos "modificados" en carta_consignatario); cuando el cliente solo
  // selecciona un consignatario existente, esos campos quedan vacíos en la carta
  // guardada aunque el formulario los muestre auto-rellenados desde el maestro.
  // Sin este fallback, "Copiar de consignatario" en Notificaciones no copiaba
  // nada en ese caso (el más común en producción).
  const consignatarioParaNotificaciones = useMemo(
    () => ({
      ...entidadesPublicas.consignatario,
      contacto: entidadesPublicas.consignatario.contacto || contactoConsignatarioResuelto.nombre,
      email: entidadesPublicas.consignatario.email || contactoConsignatarioResuelto.email,
      telefonos: entidadesPublicas.consignatario.telefonos || contactoConsignatarioResuelto.telefono,
    }),
    [entidadesPublicas, contactoConsignatarioResuelto],
  );
  // a diferencia de shipper/consignatario, la entidad de facturación no tiene un
  // objeto "carta_facturacion.cliente" que guarde siempre nombre/teléfono (solo
  // se persisten los campos que el cliente modificó); sin este fallback el PDF
  // mostraba "N/A" en Nombre/Teléfono aunque la entidad sí tuviera esos datos.
  const contactoClienteResuelto = useMemo(
    () => resolverContactoEntidadPorId(
      facturacionPublica.entidad_id ?? entidadIdClienteCoord,
      facturacionPublica._contacto_tipo_list,
      contactoIdClienteCoord,
    ),
    [resolverContactoEntidadPorId, facturacionPublica, entidadIdClienteCoord, contactoIdClienteCoord],
  );

  // Nota: este objeto sólo debe reflejar datos ya GUARDADOS (jsonCartaCliente /
  // resumenData / el maestro de la entidad vía allEntidades), nunca ediciones en
  // memoria sin guardar (shipperValues/consignatarioValues/facturacionValues) —
  // "Descargar PDF" debe garantizar que el documento coincide exactamente con lo
  // persistido en el backend, igual que la vista privada (ver cartaPublicaData en
  // CTS/[id]/page.jsx). Antes, algunos campos caían a shipperValues/consignatarioValues
  // (ediciones sin guardar del formulario en pantalla), lo que podía hacer que el
  // PDF mostrara datos que el cliente escribió pero nunca guardó.
  const cartaPublicaData = useMemo(() => {
    // `{}` (no `null`) mientras `resumenData` no ha cargado: `useInformacionPdf`
    // deriva `isPublicMode` de `cartaPublicaData != null`, así que un `null`
    // aquí hace que, durante la carga inicial, el hook se crea pensando que está
    // en modo privado y dispara `lista-servicios`/`lista-punto_enlace` (privados,
    // vía `useFetchServicios`/`useFetchPuntoEnlace`) antes de que esta página
    // pública termine de resolver sus propios datos.
    if (!resumenData) return {};
    return {
      // Shipper / exportador
      // fallback a `resolverXxxEntidadPorId`: EntidadPublicFormSection auto-rellena
      // NIT/dirección/teléfono desde el maestro de la entidad (allEntidades, dato ya
      // persistido) aunque el cliente nunca los haya editado explícitamente (y por
      // tanto nunca se persistieron en carta_shipper) — sin este fallback el PDF
      // mostraba "N/A" pese a que el formulario en pantalla sí mostraba esos datos.
      exportador: entidadesPublicas.exportador.nombre || resolverNombreEntidadPorId(entidadesPublicas.exportador.entidad_id ?? entidadIdShipperCoord),
      contactoExportador: entidadesPublicas.exportador.contacto || contactoExportadorResuelto.nombre,
      telefonoExportador: entidadesPublicas.exportador.telefono || contactoExportadorResuelto.telefono,
      emailExportador: entidadesPublicas.exportador.email || contactoExportadorResuelto.email,
      sitioRecoleccion: entidadesPublicas.exportador.direccionRecoleccion || entidadesPublicas.exportador.sitioRecoleccion || resolverDireccionEntidadPorId(entidadesPublicas.exportador.entidad_id ?? entidadIdShipperCoord),
      shipperNit: entidadesPublicas.exportador.nit || resolverNitEntidadPorId(entidadesPublicas.exportador.entidad_id ?? entidadIdShipperCoord),
      fechaRecoleccion: entidadesPublicas.exportador.fechaRecoleccion,
      horaRecoleccion: entidadesPublicas.exportador.horaRecoleccion,
      telefonoEmergencia: entidadesPublicas.exportador.telefonoEmergencia,
      // `facturacionPublica.documentosCropa` ya viene resuelto desde lo persistido
      // en la carta (`carta_documentos.cropa` o `carta_facturacion.detalles`); antes
      // este campo sólo leía `facturacionValues` (estado en memoria del formulario) y
      // `documentosValues.cropa` (que nunca se actualiza), así que tras recargar la
      // página sin editar nada el PDF mostraba los documentos CROPA vacíos aunque
      // estuvieran guardados.
      documentosCropa: (facturacionPublica.documentosCropa || []).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {}),
      // Consignatario
      consignatario: entidadesPublicas.consignatario.nombre || resolverNombreEntidadPorId(entidadesPublicas.consignatario.entidad_id ?? entidadIdConsignatarioCoord),
      direccionConsignatario: entidadesPublicas.consignatario.direccion || resolverDireccionEntidadPorId(entidadesPublicas.consignatario.entidad_id ?? entidadIdConsignatarioCoord),
      contactoConsignatario: entidadesPublicas.consignatario.contacto || contactoConsignatarioResuelto.nombre,
      telefonosConsignatario: entidadesPublicas.consignatario.telefonos || contactoConsignatarioResuelto.telefono,
      emailConsignatario: entidadesPublicas.consignatario.email || contactoConsignatarioResuelto.email,
      nitCliente: entidadesPublicas.consignatario.nit || resolverNitEntidadPorId(entidadesPublicas.consignatario.entidad_id ?? entidadIdConsignatarioCoord),
      // Facturación
      nombreFacturacion: facturacionPublica.cliente || resolverNombreEntidadPorId(facturacionPublica.entidad_id ?? entidadIdClienteCoord) || nombreFacturacionResuelto,
      nitFactura: facturacionPublica.numero || nitFacturacionResuelto,
      direccionFiscal: facturacionPublica.direccionFiscal || direccionFiscalResuelta,
      contactoFacturacion: facturacionPublica.clienteContacto || contactoClienteResuelto.nombre || contactoFacturacionResuelto.nombre,
      telefonoFacturacion: facturacionPublica.clienteContactoTelefono || contactoClienteResuelto.telefono || contactoFacturacionResuelto.telefono,
      emailFacturacion: facturacionPublica.clienteContactoEmail || contactoClienteResuelto.email || contactoFacturacionResuelto.email,
      incoterm: incotermLabelParaPdf,
      // Detalles (guardados en carta_facturacion.detalles): sin resolver estos
      // tres a su etiqueta legible el PDF los mostraba en blanco aunque el
      // cliente ya los hubiera seleccionado y guardado en el paso "Detalles".
      tipoPago: tipoPagoLabelParaPdf,
      tipoCarga: tipoCargaLabelParaPdf,
      servicio: servicioLabelParaPdf,
      clasificacionCarga: clasificacionCargaLabelParaPdf,
      peligrosidad: detallesData.peligrosidad,
      // DetallesPublica no expone el checkbox "S" de Carga Peligrosa (solo V/C),
      // así que la peligrosidad que obliga a subir la Hoja de Seguridad (MSDS)
      // se deriva de la clasificación de carga (=== 122), no del array de
      // checkbox. Sin este flag, useInformacionPdf solo marcaba
      // coberturaSeguro y el PDF listaba únicamente "Factura Cobertura Seguro"
      // bajo "Cliente" aunque la Hoja de Seguridad también estuviera subida.
      cargaPeligrosa: showDocumentosPeligrosidad,
      peligrosidadLabel: showDocumentosPeligrosidad ? "Sí" : "No",
      // Coordinación / trayecto
      paisOrigen:
        infoCoordinacionPublica.nombre_pais_origen ||
        resolverNombrePais(infoCoordinacionPublica.pais_id_origen ?? listaCoordinacion?.paisIdOrigen),
      paisDestino:
        infoCoordinacionPublica.nombre_pais_destino ||
        resolverNombrePais(infoCoordinacionPublica.pais_id_destino ?? listaCoordinacion?.paisIdDestino),
      enlaceOrigen: infoCoordinacionPublica.puntoenlace_nombre_origen,
      enlaceDestino: infoCoordinacionPublica.puntoenlace_nombree_destino,
      observaciones: infoCoordinacionPublica.observaciones,
      instruccionesManejo: facturacionPublica.instruccionesManejo,
      codFile: infoCoordinacionPublica.cod_file || codFile,
      // Notificaciones
      notificacionesNombre: notificacionesPublica.nombre,
      notificacionesEmail: notificacionesPublica.email,
      notificacionesTelefono: notificacionesPublica.telefono,
      notificacionesContacto: notificacionesPublica.contacto || "",
    };
  }, [
    resumenData,
    entidadesPublicas,
    facturacionPublica,
    notificacionesPublica,
    infoCoordinacionPublica,
    codFile,
    listaCoordinacion,
    resolverNombrePais,
    resolverNombreEntidadPorId,
    resolverNitEntidadPorId,
    resolverDireccionEntidadPorId,
    nitFacturacionResuelto,
    direccionFiscalResuelta,
    nombreFacturacionResuelto,
    contactoFacturacionResuelto,
    incotermLabelParaPdf,
    tipoPagoLabelParaPdf,
    tipoCargaLabelParaPdf,
    clasificacionCargaLabelParaPdf,
    servicioLabelParaPdf,
    detallesData.peligrosidad,
    showDocumentosPeligrosidad,
    entidadIdShipperCoord,
    entidadIdConsignatarioCoord,
    entidadIdClienteCoord,
    contactoExportadorResuelto,
    contactoConsignatarioResuelto,
    contactoClienteResuelto,
  ]);

  // Normalizar las filas editadas por el usuario (claves PascalCase) al formato
  // que espera useInformacionPdf (claves en snake_case / camelCase lowercase).
  const fuente = cargasPublicasValues.length > 0 ? cargasPublicasValues : cargas;
  // el select de "Régimen Aduanal" en el formulario de carga guarda el código
  // (p. ej. "366"), así que aquí lo traducimos a su etiqueta ("ALMACENADORA")
  // usando el mismo catálogo REGIMEN_ADUANAL que alimenta ese select; sin esto
  // el PDF mostraba el código crudo en vez del nombre legible.
  const resolverRegimenAduanal = useCallback(
    (value) => {
      if (value === undefined || value === null || value === "") return "";
      const found = (regimenAduanalCatalog || []).find(
        (t) => String(t.value) === String(value),
      );
      return found?.label || String(value);
    },
    [regimenAduanalCatalog],
  );
  const resolverTipoEmbalaje = useCallback(
    (value) => {
      if (value === undefined || value === null || value === "") return "";
      const found = (tipoEmbalajeCatalog || []).find(
        (t) => String(t.value) === String(value),
      );
      return found?.label || String(value);
    },
    [tipoEmbalajeCatalog],
  );
  const resolverUnidadMedida = useCallback(
    (value) => {
      if (value === undefined || value === null || value === "") return "";
      const found = (unidadMedidaCatalog || []).find(
        (t) => String(t.codTipo ?? t.cod_tipo) === String(value),
      );
      return found?.label || "";
    },
    [unidadMedidaCatalog],
  );
  const cargasParaPdf = useMemo(() => {
    if (!Array.isArray(fuente) || fuente.length === 0) return cargas;
    // si ya vienen del hook BPM (cargas API) las devolvemos tal cual
    // OJO: no hay atajo para el caso "cargas sin editar". Antes se devolvía
    // `cargas` tal cual cuando el cliente no había tocado la sección Producto,
    // y esas filas traen los IDs crudos de catálogo (tipo de embalaje, país de
    // origen, unidad de medida, régimen aduanal) — por eso el PDF mostraba p.
    // ej. "345" en Tipo de Embalaje o "No especificado" en Origen de Carga con
    // solo abrir y descargar. La resolución a nombre debe correr SIEMPRE, igual
    // que ocurre con tipo de carga / clasificación de carga.
    return fuente.map((f) => {
      const paisOrigenIdCarga = f.paisOrigenId ?? f.PaisOrigen ?? f.paisOrigen ?? "";
      const paisOrigenNombre = resolverNombrePais(paisOrigenIdCarga) || paisOrigenIdCarga;
      const tipoEmbalajeLabel = resolverTipoEmbalaje(
        f.tipoEmbalaje ?? f.TipoEmbalaje ?? f.tipo_embalaje ?? f.codTipoEmbalaje ?? f.cod_tipo_embalaje ?? "",
      );
      const regimenAduanalLabel = resolverRegimenAduanal(
        f.regimenAduanal ?? f.RegimenAduanal ?? f.regimen_aduanal ?? "",
      );
      const unidadMedidaLabel = resolverUnidadMedida(f.unidadMedida ?? f.UnidadMedida ?? f.unidadMedidaId ?? "");
      return {
        // conservar el resto de campos originales (cw, codFile, etc.) que el
        // generador del PDF sigue leyendo de la fila cruda.
        ...f,
        descripcionCarga: f.descripcionCarga ?? f.Descripcion ?? f.descripcion ?? "",
        valor: f.valor ?? f.Valor ?? "",
        bultos: f.cantidad ?? f.Cantidad ?? f.Bultos ?? f.bultos ?? 0,
        cantidad: f.cantidad ?? f.Cantidad ?? 0,
        peso: f.pesoTotal ?? f.PesoTotal ?? f.peso ?? 0,
        volumen: f.volumenTotal ?? f.VolumenTotal ?? f.volumen ?? 0,
        partidaArancelaria: f.partidaArancelaria ?? f.PartidaArancelaria ?? "",
        regimenAduanal: regimenAduanalLabel,
        // se escriben las dos variantes de nombre de clave que lee
        // `useInformacionPdf`, y la que tiene prioridad ahí, para que el label ya
        // resuelto gane siempre sobre el ID crudo que pueda venir en la fila.
        tipoEmbalaje: tipoEmbalajeLabel,
        tipo_embalaje: tipoEmbalajeLabel,
        definitivoGeneral: f.definitivoGeneral ?? f.DefinitivoGeneral ?? "N",
        // el campo de origen de la carga (por producto) es un país distinto
        // al país de origen del trayecto general del embarque; se resuelve
        // por id contra el mismo catálogo de países del formulario público.
        paisOrigen: paisOrigenNombre,
        nombre_pais_origen: paisOrigenNombre,
        tarimas: f.tarimas ?? f.Tarimas ?? 0,
        cajas: f.cajas ?? f.Cajas ?? 0,
        largo: f.largo ?? f.Largo ?? 0,
        alto: f.alto ?? f.Alto ?? 0,
        ancho: f.ancho ?? f.Ancho ?? 0,
        unidadMedidaLabel,
      };
    });
  }, [fuente, cargas, resolverRegimenAduanal, resolverTipoEmbalaje, resolverUnidadMedida, resolverNombrePais]);

  // Determinar si todos los pasos tienen datos obligatorios completos.
  // Debe iterar sobre `filteredSteps` (no sobre todas las claves de
  // `stepValidity`): si `showFechas` es false ese paso nunca se renderiza ni
  // dispara `onValidityChange`, así que `stepValidity[5]` se queda en su
  // valor inicial `false` para siempre — iterar `Object.values(stepValidity)`
  // dejaba `allStepsValid` permanentemente en false (y por lo tanto el PDF
  // siempre marcado como borrador) aunque todos los pasos visibles estuvieran
  // completos y guardados.
  const allStepsValid = filteredSteps.every(
    (_, idx) => stepValidity[idx] === true || stepValidity[idx] === "valid" || stepValidity[idx] === "pending",
  );

  // Para habilitar "Completar" se requiere que todos los pasos estén guardados
  // (no basta con tener cambios válidos sin guardar).
  const allStepsSaved = filteredSteps.every(
    (_, idx) => stepValidity[idx] === true || stepValidity[idx] === "valid",
  );

  const currentStepLabel = filteredSteps[estado] || filteredSteps[0];
  const currentStepInstruction = INSTRUCCIONES_POR_PASO[currentStepLabel] || INSTRUCCION_DEFAULT;

  // al llamar a useInformacionPdf debemos respetar el orden de parámetros
  // definido en el hook (incotermsCatalog, tiposPagoCatalog, tiposCargaCatalog,
  // isDraft, facturacionValues, cartaPublicaData). la versión anterior mezclaba
  // los argumentos y hacía que el payload no recibiera correctamente el valor
  // `facturacionValues.detalles.tipoCarga`.
  //
  // `facturacionValues` se pasa vacío (no el estado en memoria del formulario):
  // `useInformacionPdf` prioriza `facturacionValues` sobre `cartaPublicaData`
  // para nombreFacturacion/nitFactura/direccionFiscal/contacto/instruccionesManejo,
  // así que pasar el estado en memoria hacía que "Descargar PDF" mostrara texto
  // que el cliente escribió pero nunca guardó. `cartaPublicaData` ya trae todos
  // esos campos resueltos desde lo persistido (jsonCartaCliente).
  const { isGeneratingPdf, handleDownloadPdf } = useInformacionPdf(
    embarqueData,
    cargasParaPdf,
    [], // no tenemos catálogo de incoterms en la vista pública
    [], // tampoco catálogo de tipos de pago
    [], // tampoco catálogo de tipos de carga
    !allStepsValid, // isDraft flag
    {},
    cartaPublicaData,
    notificacionesValues, // send updated notifications state as well
    true // use legacy pdfInformacionEmbarque generator
  );

  // "Descargar PDF" debe reflejar la data más nueva y sólo la persistida: antes
  // de generar el PDF forzamos un refetch de la carta y del resumen (bypassa el
  // cache/staleTime de React Query, a diferencia de simplemente leer `resumenData`/
  // `jsonCartaCliente` que pueden estar obsoletos). `cartaPublicaData` depende de
  // esos hooks vía `useMemo`, así que no podemos usar el resultado del refetch
  // directamente dentro de este mismo callback (el closure de este render todavía
  // tiene los valores viejos) — en su lugar marcamos una descarga pendiente y la
  // disparamos en un efecto una vez que React ya re-renderizó con los datos
  // frescos (mismo problema/solución que ya documenta `handleGuardarSeccion` más
  // arriba sobre la consistencia eventual del backend).
  const [pendingPdfDownload, setPendingPdfDownload] = useState(null);
  const [isRefreshingForPdf, setIsRefreshingForPdf] = useState(false);
  // Ref que guarda el `resolve` de la promesa devuelta por
  // `handleDescargarPdfClick`. Permite que el caller (p. ej. el botón
  // "Completar") espere a que el PDF realmente termine de generarse antes de
  // continuar con acciones posteriores (como cambiar el cod_estado a 83).
  // Una vez que el estado cambia a 83, `fila-carta-instrucciones` ya no
  // entrega los datos necesarios para construir el PDF, por eso el orden
  // PDF-primero / cambio-estado-después es obligatorio.
  const pdfCompletionRef = useRef(null);
  // `handleDownloadPdf` cambia de identidad en cada render donde
  // `cartaPublicaData` (u otros useMemo del hook) se recalcula — eso pasaba
  // tras los refetch de `handleDescargarPdfClick`. Si la función estaba en el
  // array de dependencias del efecto de descarga, ese cambio de identidad
  // hacía que el efecto se re-disparara mientras `pendingPdfDownload` aún no
  // se había limpiado, lanzando la descarga del PDF varias veces con un solo
  // click. Guardarla en un ref y NO ponerla en las dependencias del efecto
  // garantiza que éste sólo corra cuando `pendingPdfDownload` cambia de
  // null a un objeto (una vez por click).
  const handleDownloadPdfRef = useRef(handleDownloadPdf);
  useEffect(() => {
    handleDownloadPdfRef.current = handleDownloadPdf;
  }, [handleDownloadPdf]);
  // Guard para impedir re-entradas: si por cualquier razón el efecto corriera
  // dos veces (Strict Mode, commits intercalados), la segunda invocación
  // encuentra el flag en true y sale sin descargar nada.
  const isDownloadingPdfRef = useRef(false);

  const handleDescargarPdfClick = useCallback(async (clickOptions = {}) => {
    setIsRefreshingForPdf(true);
    try {
      await Promise.all([refetchCarta(), refetchFilaCarta(), refetchEntidadesRelacionadas()]);
    } finally {
      setIsRefreshingForPdf(false);
    }
    const pdfPromise = new Promise((resolve) => {
      pdfCompletionRef.current = resolve;
    });
    setPendingPdfDownload({ ...clickOptions });
    return pdfPromise;
  }, [refetchCarta, refetchFilaCarta, refetchEntidadesRelacionadas]);

  useEffect(() => {
    if (!pendingPdfDownload) return;
    // Capturamos las opciones antes de limpiar el estado: el closure del
    // efecto ya tiene el valor correcto, pero lo materializamos en una
    // const para que el bloque async sea totalmente independiente de futuros
    // re-renders.
    const options = pendingPdfDownload;
    setPendingPdfDownload(null);
    if (isDownloadingPdfRef.current) return;
    isDownloadingPdfRef.current = true;
    (async () => {
      try {
        await handleDownloadPdfRef.current(options);
      } finally {
        isDownloadingPdfRef.current = false;
        if (pdfCompletionRef.current) {
          pdfCompletionRef.current();
          pdfCompletionRef.current = null;
        }
      }
    })();
  }, [pendingPdfDownload]);

  const handleValidityChange = useCallback((stepIndex, isValid) => {
    setStepValidity((prev) => {
      if (prev[stepIndex] === isValid) return prev;
      return { ...prev, [stepIndex]: isValid };
    });
  }, []);

  const validityHandlers = useMemo(
    () => filteredSteps.map((_, idx) => (isValid) => handleValidityChange(idx, isValid)),
    [handleValidityChange, filteredSteps],
  );

  const resolverValor = useCallback((carga = {}, keys = []) => {
    for (const key of keys) {
      if (carga[key] !== undefined && carga[key] !== null && carga[key] !== "") {
        return carga[key];
      }
    }
    return "";
  }, []);

  const normalizeCarga = useCallback((carga = {}) => ({
    ...carga,
    largo: resolverValor(carga, ["largo", "Largo", "LARGO", "largo_cm", "LARGO_CM", "largoCm", "LargoCm"]),
    ancho: resolverValor(carga, ["ancho", "Ancho", "ANCHO", "ancho_cm", "ANCHO_CM", "anchoCm", "AnchoCm"]),
    alto: resolverValor(carga, ["alto", "Alto", "ALTO", "alto_cm", "ALTO_CM", "altoCm", "AltoCm"]),
    LARGO: resolverValor(carga, ["largo", "Largo", "LARGO", "largo_cm", "LARGO_CM", "largoCm", "LargoCm"]),
    ANCHO: resolverValor(carga, ["ancho", "Ancho", "ANCHO", "ancho_cm", "ANCHO_CM", "anchoCm", "AnchoCm"]),
    ALTO: resolverValor(carga, ["alto", "Alto", "ALTO", "alto_cm", "ALTO_CM", "altoCm", "AltoCm"]),
  }), [resolverValor]);

  const getCargasBase = useCallback(() => {
    if (cargasPublicasValues.length > 0) return cargasPublicasValues;
    const saved = jsonCartaCliente?.["lista-coordinacion-carga"];
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return resumenData?.cargas || [];
  }, [cargasPublicasValues, jsonCartaCliente, resumenData]);

  const getDocumentosCropa = useCallback(() => {
    const cropaSeleccionados = facturacionValues?.detalles?.documentosCropa;
    if (Array.isArray(cropaSeleccionados)) {
      return CROPA_DOCS.reduce((acc, { key }) => {
        acc[key] = cropaSeleccionados.includes(key);
        return acc;
      }, {});
    }
    return { ...documentosValues.cropa };
  }, [facturacionValues, documentosValues]);

  const { data: industriasData = [] } = useFetchIndustriasPublico();
  const industriaLabel = useCallback(
    (code) => industriasData.find((i) => String(i.cod_industria) === String(code))?.nom_industria_es,
    [industriasData],
  );

  // Construye el array slim `recuperar-datos-entidad-relacionada` (solo público):
  // entidad_id + campos del shipper/consignatario que el cliente cambió respecto
  // al snapshot maestro. El backend lo usa para sincronizar la entidad.
  // Caso especial: una entidad recién creada vía "Crear Entidad" no trae
  // entidad_id (no hay endpoint público para crearla) — se identifica por traer
  // entidad_nombre sin entidad_id, y se envía igual para que el backend la cree
  // al procesar actualizar-json-link.
  const buildEntidadRelacionada = useCallback(() => {
    const entidadRelacionada = [];
    const pushSlim = (formVals) => {
      const eid = formVals?.entidad_id;
      const esNueva = (eid == null || eid === "") && Boolean(formVals?.entidad_nombre);
      if (eid == null || eid === "") {
        if (!esNueva) return;
      } else if (entidadRelacionada.some((x) => String(x.entidad_id) === String(eid))) {
        return;
      }
      const raw = esNueva ? null : allEntidades.find((e) => String(e.entidad_id) === String(eid));
      const slim = buildEntidadRelacionadaSlim(raw, formVals, { industriaLabel });
      if (slim) entidadRelacionada.push(slim);
    };
    pushSlim(shipperValues);
    pushSlim(consignatarioValues);
    return entidadRelacionada;
  }, [allEntidades, industriaLabel, shipperValues, consignatarioValues]);

  const handleGuardarSeccion = useCallback(async (overrideCargas, codEstado) => {
    if (overrideCargas?.nativeEvent) {
      overrideCargas = undefined;
    }

    const cargasChanged = overrideCargas !== undefined || cargasPublicasValues.length > 0;
    const cargasBase = overrideCargas ?? getCargasBase();
    const cargasToSend = (Array.isArray(cargasBase) ? cargasBase : []).map(normalizeCarga);
    const documentosCropa = getDocumentosCropa();

    // En público, las fechas de recolección pertenecen al shipper: se unen a sus
    // _modificados para que viajen dentro de carta_shipper, y además como carta_fechas.
    const shipperCamposUnidos = {
      ...shipperValues,
      ...fechasValues,
      _modificados: unionModificados(shipperValues?._modificados, fechasValues?._modificados),
    };
    const shipperMods = extraerCamposModificados(shipperCamposUnidos);
    const consignatarioMods = extraerCamposModificados(consignatarioValues);

    const facturacionMods = buildFacturacionMods(
      extraerCamposModificados(facturacionValues?.cliente),
      extraerCamposModificados(facturacionValues?.detalles),
    );

    const notificacionesMods = Object.keys(notificacionesValues).length > 0 ? notificacionesValues : null;
    const fechasMods = fechasValues?.fecha_recoleccion ? { fecha_recoleccion: fechasValues.fecha_recoleccion } : null;

    const cropaChanged = Object.values(documentosCropa).some(Boolean);
    const documentosMods = cropaChanged ? { cropa: documentosCropa } : null;

    const { json_data, json_data_usuario } = buildCartaJson({
      originals: {
        // Usar la carta ya fusionada (no el resumen crudo) como base de "lo ya
        // guardado": preserva carta_shipper/carta_consignatario/lista-coordinacion-carga
        // guardados en secciones previas al guardar solo la sección actual.
        listaCoordinacion: cartaListaCoordinacionGuardada,
        cargas,
        fechasMov: jsonCartaCliente?.["lista-coordinacion-fecha-mov"] || resumenData?.fechasMov || [],
      },
      secciones: {
        shipperMods,
        consignatarioMods,
        facturacionMods,
        notificacionesMods,
        fechasMods,
        documentosMods,
        cargas: cargasToSend,
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
      entidadRelacionada: buildEntidadRelacionada(),
    });

    try {
      const resultado = await actualizarJson({
        json_data,
        json_data_usuario,
        token_interaccion: cliInfo?.token_interaccion,
        version_app: cliInfo?.version_app || "0.0.2",
        ...(codEstado !== undefined ? { cod_estado: codEstado } : {}),
      });

      // 1002 "la gestión ya culminó": el backend indica que el formulario ya
      // fue completado y no admite más cambios. Mostramos la SuccessScreen en
      // vez del alert de "guardado correctamente" y frenamos el flujo del
      // botón Completar (que también dispararía la descarga del PDF).
      const codMensaje = Number(resultado?.data?.cod_mensaje ?? resultado?.cod_mensaje);
      const mensaje = resultado?.data?.mensaje ?? resultado?.mensaje ?? "";
      if (codMensaje === 1002 || /culmin/i.test(mensaje)) {
        setCompletadoMensaje(mensaje || "La gestión ya culminó de manera satisfactoria");
        return true;
      }

      // El backend responde HTTP 200 incluso cuando el guardado falla (p.ej.
      // token vencido/inválido, cod_mensaje 1001/1003/1062): axios nunca lanza
      // en ese caso, así que sin este chequeo el código de abajo mostraba
      // "Datos guardados correctamente" y limpiaba shipperValues/consignatarioValues/etc.
      // igual que un guardado exitoso — el cliente perdía completo lo que escribió
      // sin ningún aviso, y al recargar la página el formulario aparecía vacío.
      const success = resultado?.data?.success ?? resultado?.success;

      if (success === false) {
        setAlertState({
          open: true,
          tipo: "error",
          content: mensaje || "Error al guardar los datos. Intente nuevamente.",
        });
        return false;
      }

      setAlertState({ open: true, tipo: "success", content: "Datos guardados correctamente" });
      // Esperar el refetch ANTES de limpiar el estado local pendiente: si se
      // limpia antes, un guardado posterior (p.ej. el usuario sigue editando
      // otra sección mientras el refetch todavía está en vuelo) envía
      // shipperMods/consignatarioMods = null y buildCartaJson cae de vuelta a
      // `cartaListaCoordinacionGuardada`, que en ese momento sigue siendo el
      // snapshot ANTERIOR al guardado — deshaciendo cambios recién guardados
      // (p.ej. los checkboxes de tipo de contacto).
      // `allEntidades` (recuperar-datos-entidad-relacionada) alimenta los
      // fallbacks de nombre/contacto que usa `cartaPublicaData` para el PDF
      // (ver resolverNombreEntidadPorId / resolverContactoEntidadPorId). Si no
      // se refresca junto con la carta, un contacto o entidad recién creada/
      // seleccionada en este guardado queda ausente de esa lista y el PDF
      // generado sin recargar la página muestra esos campos vacíos hasta que
      // el usuario recarga (lo que sí dispara un fetch nuevo de esta query).
      await Promise.all([refetchCarta(), refetchFilaCarta(), refetchEntidadesRelacionadas()]);

      // El GET de `fila-carta-instrucciones` inmediatamente después del POST de
      // `actualizar-json-link` puede no reflejar aún la escritura (consistencia
      // eventual del backend): el refetch de arriba a veces devuelve el snapshot
      // ANTERIOR, dejando NIT/Dirección/etc. en blanco en el PDF generado sin
      // recargar, aunque el guardado sí ocurrió (recargar la página sí trae el
      // dato correcto). Como ya sabemos exactamente qué se guardó (json_data +
      // json_data_usuario), reconstruimos localmente el mismo `jsonCarta`
      // fusionado que produciría el backend y lo escribimos directo en la
      // caché — así el PDF ve el dato recién guardado sin depender del timing
      // de esa lectura.
      const jsonCartaOptimista = extraerJsonCartaInstrucciones({ data: { json_data, json_data_usuario } });
      if (jsonCartaOptimista) {
        queryClient.setQueryData(
          ["carta-instrucciones-data", "public", cotizacionCabeceraId],
          (prev) => ({ jsonCarta: jsonCartaOptimista, filaCarta: prev?.filaCarta ?? null }),
        );
      }

      setCargasPublicasValues([]);
      setShipperValues({});
      setConsignatarioValues({});
      setNotificacionesValues({});
      setFacturacionValues({ cliente: {}, detalles: {} });
      setFechasValues({});
    } catch (error) {
      console.error("Error actualizando json link público:", error);
      setAlertState({ open: true, tipo: "error", content: "Error al guardar los datos" });
    }
  }, [
    cargasPublicasValues,
    getCargasBase,
    normalizeCarga,
    getDocumentosCropa,
    shipperValues,
    consignatarioValues,
    facturacionValues,
    notificacionesValues,
    fechasValues,
    cartaListaCoordinacionGuardada,
    cargas,
    jsonCartaCliente,
    resumenData,
    entidadIdShipperCoord,
    entidadIdConsignatarioCoord,
    buildEntidadRelacionada,
    actualizarJson,
    cliInfo,
    refetchCarta,
    refetchFilaCarta,
    refetchEntidadesRelacionadas,
    queryClient,
    cotizacionCabeceraId,
  ]);

  const handleNuevaCargaSuccess = useCallback(() => {
    setCargasPublicasValues([]);
    setAlertState({ open: true, tipo: "success", content: "Carga guardada correctamente" });
    Promise.all([refetchCarta(), refetchFilaCarta()]);
  }, [refetchCarta, refetchFilaCarta]);

  // Flujo "Completar" extraído a su propio callback: ahora se invoca desde el
  // modal de subida del Instructivo Embarque firmado (una vez subido el PDF),
  // pero conserva exactamente las mismas acciones que tenía antes el botón
  // Completar (descargar PDF antes de cambiar cod_estado a 83). Si la gestión
  // ya culminó (1002) se cierra el modal y se deja que el render muestre la
  // SuccessScreen.
  const handleCompletar = useCallback(async () => {
    const culmino = await handleGuardarSeccion(undefined, 83);
    if (culmino) {
      setModalCompletarAbierto(false);
      return;
    }
    setModalCompletarAbierto(false);
    setAlertState({ open: true, tipo: "success", content: "Proceso completado exitosamente" });
  }, [handleGuardarSeccion]);

  // make sure any edited values are dropped whenever the carta object is
  // replaced from the server (for example after a fetch).  `handleGuardarSeccion`
  // already clears the cache on success, but this effect handles other cases.
  useEffect(() => {
    setCargasPublicasValues([]);
  }, [resumenData, jsonCartaCliente]);

  // Si el paso seleccionado deja de existir en filteredSteps (por ejemplo,
  // "Documentos" o "Fechas" dejan de aplicar mientras estaban seleccionados),
  // retroceder al último paso visible para evitar un estado inválido.
  useEffect(() => {
    if (estado >= filteredSteps.length) {
      setEstado(Math.max(0, filteredSteps.length - 1));
    }
  }, [filteredSteps, estado]);

  const opciones = filteredSteps.map((label, idx) => {
    let contentComponent;

    switch (label) {
      case "Shipper":
        contentComponent = (
          <ShipperPublicas
            data={entidadesPublicas.exportador}
            isLoading={seccionesLoading}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={setShipperValues}
            onSave={handleGuardarSeccion}
            isSaving={isSaving}
            cliInfo={cliInfo}
            selectedEntidadId={entidadIdShipperCoord}
          />
        );
        break;
      case "Consignatario":
        contentComponent = (
          <ConsignatarioPublicas
            data={entidadesPublicas.consignatario}
            isLoading={seccionesLoading}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={setConsignatarioValues}
            onSave={handleGuardarSeccion}
            isSaving={isSaving}
            cliInfo={cliInfo}
            selectedEntidadId={entidadIdConsignatarioCoord}
          />
        );
        break;
      case "Notificacion":
        contentComponent = (
          <NotificacionesPublicas
            data={notificacionesPublica}
            isLoading={seccionesLoading}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={setNotificacionesValues}
            onSave={handleGuardarSeccion}
            isSaving={isSaving}
            consignatarioData={consignatarioParaNotificaciones}
          />
        );
        break;
      case "Producto":
        contentComponent = (
          <CargasPublicas
            data={fuente}
            isLoading={seccionesLoading}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={setCargasPublicasValues}
            onSave={handleGuardarSeccion}
            isSaving={isSaving}
            jsonCarta={null}
            cliInfo={cliInfo}
            onActualizarJson={actualizarJson}
            onSaveSuccess={handleNuevaCargaSuccess}
          />
        );
        break;
      case "Facturacion":
        contentComponent = (
          <FacturacionPublica
            data={facturacionPublica}
            isLoading={seccionesLoading}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={handleFacturacionValuesChange}
            onSave={handleGuardarSeccion}
            isSaving={isSaving}
            cliInfo={cliInfo}
            apiMode="public"
            selectedEntidadId={entidadIdClienteCoord}
            contactoIdCliente={contactoIdClienteCoord}
          />
        );
        break;
      case "Detalles":
        contentComponent = (
          <DetallesPublica
            data={detallesData}
            isLoading={seccionesLoading}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={handleDetallesPublicasValuesChange}
            onSave={handleGuardarSeccion}
            isSaving={isSaving}
            tipoPagoCatalog={tipoPagoCatalog}
            tipoCargaCatalog={tipoCargaCatalog}
            serviciosCatalog={serviciosCatalog}
            clasificacionCargaCatalog={clasificacionCargaCatalog}
            showCropaDocs={showCropaDocs}
          />
        );
        break;
      case "Documentos":
        contentComponent = (
          <DocumentosPublicas
            embarqueId={cliInfo?.embarque_id}
            codFile={codFile}
            onValidityChange={validityHandlers[idx]}
            showPeligrosidad={showDocumentosPeligrosidad}
            showCoberturaSeguro={showDocumentosCoberturaSeguro}
          />
        );
        break;
      case "Fechas":
        contentComponent = (
          <FechasPublicas
            data={entidadesPublicas.exportador}
            isLoading={seccionesLoading}
            onValidityChange={validityHandlers[idx]}
            onValuesChange={setFechasValues}
            onSave={handleGuardarSeccion}
            isSaving={isSaving}
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

  // Si la gestión ya culminó (1002 al cargar la carta o al pulsar Completar),
  // reemplazamos completo el formulario por la SuccessScreen.
  if (yaCulmino || completadoMensaje) {
    return (
      <Box sx={{ width: "100%", p: { xs: 1, md: 2 } }}>
        <SuccessScreen
          mensaje={(completadoMensaje || mensajeCulmino) || undefined}
        />
      </Box>
    );
  }

  // Si el token de interacción del link público expiró (cod_mensaje 1003 al
  // cargar la fila), reemplazamos el formulario por un aviso pidiéndole al
  // cliente que solicite un nuevo link al asesor — sin este bloque el cliente
  // vería el formulario vacío (sin json_data) y cualquier guardado posterior
  // fallaría igual con 1003/1001 sin un mensaje claro.
  if (tokenExpirado) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: { xs: "60vh", md: "70vh" }, width: "100%", p: { xs: 1, md: 2 } }}>
        <Card elevation={3} sx={{ width: "100%", maxWidth: 560, borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ height: 8, width: "100%", bgcolor: "warning.main" }} />
          <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 2, py: { xs: 4, md: 6 }, px: { xs: 2, md: 4 } }}>
            <Box sx={{ color: (theme) => (theme.palette.mode === "dark" ? "#fff" : "#ed6c02"), display: "flex" }}>
              <Link2Off size={48} />
            </Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: "text.primary" }}>
              El link ha expirado
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, lineHeight: 1.6 }}>
              Por favor solicite un nuevo link a su asesor.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden", p: { xs: 1, md: 2 } }}>
      <GlobalStyles
        styles={(theme) =>
          theme.palette.mode === "dark"
            ? {
              // En modo oscuro el azul corporativo (#0B2967) queda ilegible sobre
              // fondos oscuros. Se fuerza a blanco el texto, los iconos y el
              // contorno de los botones primarios (text/outlined) y de los textos
              // e iconos sueltos que usan `color="primary"`. Los botones
              // `contained` mantienen su relleno azul con texto blanco.
              '[class^="c-"], [class*=" c-"]': { color: "#fff !important" },
              "svg.lucide": { color: "#fff !important", stroke: "#fff !important" },
              '.MuiButton-textPrimary, .MuiButton-outlinedPrimary': {
                color: "#fff !important",
                borderColor: "#fff !important",
              },
              '.MuiButton-textPrimary .MuiButton-startIcon, .MuiButton-outlinedPrimary .MuiButton-startIcon, .MuiButton-textPrimary svg, .MuiButton-outlinedPrimary svg':
                { color: "#fff !important", stroke: "#fff !important" },
              '.MuiIconButton-colorPrimary': { color: "#fff !important" },
              '.MuiIconButton-colorPrimary svg': { color: "#fff !important", stroke: "#fff !important" },
            }
            : {}
        }
      />
      {showLoader && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: { xs: "60vh", md: "80vh" },
            zIndex: 2100,
          }}
        >
          <LoaderComponent open texto="Cargando información" />
        </Box>
      )}

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
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: { xs: 1, md: 2 },
            mb: 2,
            width: "100%",
          }}
        >
          <Box
            sx={{
              flex: { xs: "1 1 auto", md: "1 1 320px" },
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, md: 1.5 },
              py: { xs: 0.5, md: 1.25 },
              px: { xs: 1, md: 1.75 },
              borderRadius: 2,
              border: "1px solid",
              borderColor: "primary.light",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(25, 118, 210, 0.12)"
                  : "rgba(25, 118, 210, 0.06)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: { xs: 24, md: 32 },
                height: { xs: 24, md: 32 },
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: (theme) => (theme.palette.mode === "dark" ? "#fff" : "primary.contrastText"),
                flexShrink: 0,
              }}
            >
              <Info size={16} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  display: { xs: "none", md: "block" },
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  color: (theme) => (theme.palette.mode === "dark" ? "#fff" : "primary.main"),
                  mb: 0.25,
                }}
              >
                Instrucciones · {currentStepLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.4,
                  fontWeight: 500,
                  fontSize: { xs: "1.05rem", md: "1.2rem" },
                  display: "-webkit-box",
                  WebkitLineClamp: { xs: 2, md: "unset" },
                  WebkitBoxOrient: "vertical",
                  overflow: { xs: "hidden", md: "visible" },
                }}
              >
                {currentStepInstruction}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              flexWrap: "wrap",
            }}
          >
            <Tooltip
              title={!allStepsSaved ? "Debe completar y guardar todos los pasos antes de continuar" : ""}
            >
              <span>
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  onClick={() => setModalCompletarAbierto(true)}
                  disabled={!allStepsSaved || cartaLoading}
                >
                  Completar
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Card sx={{ mb: 2, width: "100%", minWidth: 0, overflow: "hidden" }}>
          <CardContent sx={{ minWidth: 0, pb: "8px !important" }}>
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
          {/* Renderizar todas las secciones para que la validación corra siempre */}
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

      <ActionAlertComponent
        openDialog={alertState.open}
        tipo={alertState.tipo}
        content={alertState.content}
        handleClose={() => setAlertState((prev) => ({ ...prev, open: false }))}
      />

      <SubirInstructivoFirmadoModal
        open={modalCompletarAbierto}
        onClose={() => setModalCompletarAbierto(false)}
        onCompletar={handleCompletar}
        embarqueId={cliInfo?.embarque_id}
        codFile={listaCoordinacion?.codFile || codFile}
        isCompleting={isSaving}
        onDownloadPdf={handleDescargarPdfClick}
        isGeneratingPdf={isGeneratingPdf}
        isRefreshingForPdf={isRefreshingForPdf}
        allStepsValid={allStepsValid}
      />
    </Box>
  );
};

Page.propTypes = {};

export default Page;
