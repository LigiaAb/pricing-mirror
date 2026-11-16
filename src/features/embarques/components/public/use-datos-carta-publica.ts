"use client";

/**
 * Datos derivados de la carta pública (port de la capa de datos de
 * public/page.jsx del legacy): resumen de coordinación, carta fusionada,
 * entidades relacionadas del cliente y `cartaPublicaData` (payload del PDF).
 * La lógica pura (resolvers de fallback y constructor del payload) vive en
 * carta-publica-data.ts.
 */

import { useCallback, useMemo } from "react";
import {
  construirEntidadesPublicas,
  construirFacturacionPublica,
  construirInfoCoordinacionPublica,
  construirNotificacionesPublica,
  normalizeKeys,
  resolveEntidadId,
  useCartaInstruccionesData,
} from "@/features/carta-instrucciones";
import { paisesPublico } from "@/features/catalogos";
import { useResumenCoordinacionPublico } from "@/features/coordinaciones";
import { resolverCargasParaPdf } from "@/features/embarques/lib/cargas-pdf";
import type { CliInfo } from "@/features/embarques/lib/cli-info";
import {
  useFetchDatosEntidadPublico,
  useFetchDatosEntidadRelacionadaPublico,
} from "@/features/entidades";
import { construirDetallesData } from "./carta-publica-data";
import {
  aplanarEntidadPublica,
  encontrarShipperFallbackId,
  type JsonRecord,
  resolverContactoEntidad,
  resolverFacturacionEntidad,
} from "./entidad-resolvers";
import { useCartaPublicaPdfPayload } from "./use-carta-publica-pdf-payload";
import { useCatalogosCartaPublica } from "./use-catalogos-carta-publica";
import { useCatalogosPdfCargas } from "./use-catalogos-pdf-cargas";
import { useFlagsCartaPublica } from "./use-flags-carta-publica";

// Referencia estable mientras `paisesCatalog` no cargue (`data` es `undefined`
// y el default `= []` del destructuring crea un array nuevo cada render, lo
// que invalidaría `cargasParaPdf` y, con él, el useMemo de `datos` de abajo).
const EMPTY_PAISES: never[] = [];

export function useDatosCartaPublica({
  embarqueId,
  cliInfo,
  tokenReady,
  cargasPublicasValues = [],
}: {
  embarqueId: number;
  cliInfo: CliInfo | null;
  tokenReady: boolean;
  /** Cargas editadas en pantalla (ganan sobre las persistidas para el PDF). */
  cargasPublicasValues?: JsonRecord[];
}) {
  const {
    data: resumenData,
    isLoading: cartaLoading,
    refetch: refetchCarta,
  } = useResumenCoordinacionPublico(
    { embarque_id: cliInfo?.embarque_id },
    { enabled: tokenReady && Boolean(cliInfo?.embarque_id) },
  );

  // MISMO camino de lectura que la vista privada: el cliente vuelve a ver sus
  // modificaciones tras recargar y el asesor ve exactamente lo mismo.
  const {
    jsonCarta: jsonCartaCliente,
    yaCulmino,
    mensajeCulmino,
    tokenExpirado,
    refetch: refetchFilaCarta,
    isFetched: cartaFilaFetched,
  } = useCartaInstruccionesData({
    embarqueId,
    apiMode: "public",
    enabled: tokenReady,
  });

  // cargas: prioriza las ediciones guardadas por el cliente, cae al resumen.
  const cargas = useMemo((): JsonRecord[] => {
    const saved = jsonCartaCliente?.["lista-coordinacion-carga"];
    if (Array.isArray(saved) && saved.length > 0) return saved as JsonRecord[];
    return (resumenData?.cargas ?? []) as unknown as JsonRecord[];
  }, [jsonCartaCliente, resumenData]);

  const listaCoordinacion = useMemo(
    () => (resumenData?.coordinacion ?? {}) as unknown as JsonRecord,
    [resumenData],
  );
  // La carta ya fusionada — base de "lo ya guardado" en el guardado por
  // sección (usar el resumen crudo borraba carta_* guardadas antes).
  const cartaListaCoordinacionGuardada = useMemo(
    () => (jsonCartaCliente?.["lista-coordinacion"] as JsonRecord | undefined) ?? {},
    [jsonCartaCliente],
  );

  const seccionesLoading = cartaLoading || (Boolean(embarqueId) && !cartaFilaFetched);

  // Entidades relacionadas del cliente (misma query que las secciones — cacheada).
  const { data: entidadesRelacionadasData, refetch: refetchEntidadesRelacionadas } =
    useFetchDatosEntidadRelacionadaPublico(
      { entidad_id: cliInfo?.entidad_id, cod_estado: 1 },
      { enabled: Boolean(cliInfo?.entidad_id) && tokenReady },
    );
  const allEntidades = useMemo(
    () => (entidadesRelacionadasData?.data || []).map((e) => normalizeKeys(e)),
    [entidadesRelacionadasData],
  );

  const entidadIdConsignatarioCoord = useMemo(
    () => resolveEntidadId(jsonCartaCliente ?? {}, listaCoordinacion, "consignatario"),
    [jsonCartaCliente, listaCoordinacion],
  );

  // Shipper con fallback a la primera entidad relacionada con rol shipper.
  const entidadIdShipperCoord = useMemo(() => {
    const id = resolveEntidadId(jsonCartaCliente ?? {}, listaCoordinacion, "shipper");
    return id || encontrarShipperFallbackId(allEntidades);
  }, [jsonCartaCliente, listaCoordinacion, allEntidades]);

  const { data: paisesCatalog = EMPTY_PAISES } = paisesPublico.useLista(
    {},
    { enabled: tokenReady },
  );
  const resolverNombrePais = useCallback(
    (id: unknown) => {
      if (id == null || id === "") return "";
      return paisesCatalog.find((p) => String(p.cod_pais) === String(id))?.nombre_pais ?? "";
    },
    [paisesCatalog],
  );

  const { regimenAduanalCatalog, tipoEmbalajeCatalog, unidadMedidaCatalog } = useCatalogosPdfCargas(
    { tokenReady },
  );

  // --- display de secciones ---------------------------------------------------
  const entidadesPublicas = useMemo(
    () => construirEntidadesPublicas(jsonCartaCliente ?? {}, listaCoordinacion),
    [jsonCartaCliente, listaCoordinacion],
  );
  const facturacionPublica = useMemo(
    () => construirFacturacionPublica(jsonCartaCliente ?? {}),
    [jsonCartaCliente],
  );
  const notificacionesPublica = useMemo(
    () => construirNotificacionesPublica(jsonCartaCliente ?? {}),
    [jsonCartaCliente],
  );

  // "Copiar de consignatario" en Notificaciones: carta_consignatario solo
  // guarda los campos que el cliente editó, así que al elegir un consignatario
  // existente el contacto llega vacío. Sin este fallback al maestro el botón no
  // copiaba nada en el caso más común.
  const consignatarioParaNotificaciones = useMemo(() => {
    const consignatario = entidadesPublicas.consignatario;
    const resuelto = resolverContactoEntidad(
      allEntidades,
      consignatario.entidad_id ?? entidadIdConsignatarioCoord,
      consignatario._contacto_tipo_list,
    );
    return {
      contacto: String(consignatario.contacto || resuelto.nombre || ""),
      email: String(consignatario.email || resuelto.email || ""),
      telefonos: String(consignatario.telefonos || resuelto.telefono || ""),
    };
  }, [entidadesPublicas, allEntidades, entidadIdConsignatarioCoord]);

  // Facturación es de solo lectura: la entidad cliente la fija la coordinación.
  const entidadIdClienteCoord = useMemo(
    () => listaCoordinacion?.entidadIdCli ?? facturacionPublica.entidad_id ?? null,
    [facturacionPublica, listaCoordinacion],
  );
  const contactoIdClienteCoord = useMemo(
    () => listaCoordinacion?.contactoIdCliente ?? null,
    [listaCoordinacion],
  );

  // Maestro de la entidad de facturación (puede no aparecer en allEntidades).
  const { data: facturacionEntidadData } = useFetchDatosEntidadPublico(
    { entidad_id: entidadIdClienteCoord },
    { enabled: tokenReady && Boolean(entidadIdClienteCoord) },
  );
  const facturacionResuelta = useMemo(
    () => resolverFacturacionEntidad(facturacionEntidadData ?? null, contactoIdClienteCoord),
    [facturacionEntidadData, contactoIdClienteCoord],
  );

  // Maestro puntual del shipper (NIT/dirección/contacto): mismo fetch que ya
  // usa el formulario interactivo (useEntidadFallback, commit 6f1041be) para
  // hidratar sus campos de solo lectura. IMPORTANTE: `recuperar-datos-entidad`
  // vía token público SIEMPRE devuelve la entidad del propio token (el
  // cliente), sin importar el `entidad_id` pedido — por eso el resultado NO
  // se filtra por ID contra `idShipper` (nunca calzaría con un shipper
  // distinto del cliente): se usa tal cual, igual que ya hace el formulario
  // interactivo, para que el PDF muestre lo mismo que ve el cliente en pantalla.
  const idShipperParaPdf = entidadesPublicas.exportador.entidad_id ?? entidadIdShipperCoord;
  const { data: shipperEntidadData } = useFetchDatosEntidadPublico(
    { entidad_id: idShipperParaPdf },
    { enabled: tokenReady && Boolean(idShipperParaPdf) },
  );
  const entidadShipperFallback = useMemo(
    () => aplanarEntidadPublica(shipperEntidadData),
    [shipperEntidadData],
  );

  // --- catálogos para resolver IDs a labels ------------------------------------
  const catalogos = useCatalogosCartaPublica({
    tokenReady,
    tipoIdEmbarque: listaCoordinacion?.tipoIdEmbarque,
  });

  // IDs del resumen resueltos a los valores que usan los selectores de Detalles.
  const detallesData = useMemo(
    () => construirDetallesData({ facturacionPublica, listaCoordinacion, catalogos }),
    [facturacionPublica, listaCoordinacion, catalogos],
  );

  const infoCoordinacionPublica = useMemo(
    () => construirInfoCoordinacionPublica({}, jsonCartaCliente ?? {}) as JsonRecord,
    [jsonCartaCliente],
  );

  const {
    showCropaDocs,
    showFechas,
    showDocumentosPeligrosidad,
    showDocumentosCoberturaSeguro,
    codFile,
  } = useFlagsCartaPublica({ resumenData, detallesData });

  // G1: las ediciones en pantalla ganan sobre lo persistido, igual que el
  // resto del wizard; resuelto SIEMPRE (sin atajo para "cargas sin editar").
  const cargasParaPdf = useMemo(() => {
    const fuente = cargasPublicasValues.length > 0 ? cargasPublicasValues : cargas;
    return resolverCargasParaPdf(fuente, {
      regimenAduanal: regimenAduanalCatalog,
      tipoEmbalaje: tipoEmbalajeCatalog,
      paises: paisesCatalog,
      unidadMedida: unidadMedidaCatalog,
    });
  }, [
    cargasPublicasValues,
    cargas,
    regimenAduanalCatalog,
    tipoEmbalajeCatalog,
    paisesCatalog,
    unidadMedidaCatalog,
  ]);

  // --- payload del PDF (solo datos persistidos) --------------------------------
  const cartaPublicaData = useCartaPublicaPdfPayload({
    resumenData,
    entidadesPublicas,
    facturacionPublica,
    notificacionesPublica,
    infoCoordinacionPublica,
    detallesData,
    listaCoordinacion,
    facturacionResuelta,
    codFile,
    allEntidades,
    entidadShipperFallback,
    entidadIdShipperCoord,
    entidadIdConsignatarioCoord,
    entidadIdClienteCoord,
    contactoIdClienteCoord,
    catalogos,
    resolverNombrePais,
  });

  // Referencia estable mientras ningún dato subyacente cambie: evita que cada
  // tecla escrita en una sección (que solo actualiza estado local del wizard)
  // re-renderice las demás secciones vía `React.memo` con la prop `datos`.
  return useMemo(
    () => ({
      resumenData,
      cartaLoading,
      seccionesLoading,
      refetchCarta,
      refetchFilaCarta,
      refetchEntidadesRelacionadas,
      jsonCartaCliente,
      yaCulmino,
      mensajeCulmino,
      tokenExpirado,
      cargas,
      cargasParaPdf,
      listaCoordinacion,
      cartaListaCoordinacionGuardada,
      allEntidades,
      entidadIdShipperCoord,
      entidadIdConsignatarioCoord,
      entidadIdClienteCoord,
      contactoIdClienteCoord,
      entidadesPublicas,
      facturacionPublica,
      notificacionesPublica,
      consignatarioParaNotificaciones,
      detallesData,
      infoCoordinacionPublica,
      showCropaDocs,
      showFechas,
      showDocumentosPeligrosidad,
      showDocumentosCoberturaSeguro,
      codFile,
      cartaPublicaData,
      catalogos,
    }),
    [
      resumenData,
      cartaLoading,
      seccionesLoading,
      refetchCarta,
      refetchFilaCarta,
      refetchEntidadesRelacionadas,
      jsonCartaCliente,
      yaCulmino,
      mensajeCulmino,
      tokenExpirado,
      cargas,
      cargasParaPdf,
      listaCoordinacion,
      cartaListaCoordinacionGuardada,
      allEntidades,
      entidadIdShipperCoord,
      entidadIdConsignatarioCoord,
      entidadIdClienteCoord,
      contactoIdClienteCoord,
      entidadesPublicas,
      facturacionPublica,
      notificacionesPublica,
      consignatarioParaNotificaciones,
      detallesData,
      infoCoordinacionPublica,
      showCropaDocs,
      showFechas,
      showDocumentosPeligrosidad,
      showDocumentosCoberturaSeguro,
      codFile,
      cartaPublicaData,
      catalogos,
    ],
  );
}
