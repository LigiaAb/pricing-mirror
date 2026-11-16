"use client";

/**
 * Capa de datos del detalle CTS privado (Fase A.2 del plan de paridad):
 * espejo de `use-datos-carta-publica` alimentado por los endpoints privados.
 * La vista lee la carta de instrucciones fusionada (json_data +
 * json_data_usuario) y deriva de ahí lo que muestran las secciones públicas
 * en modo privado; la coordinación aporta los originales y la preselección.
 */

import { useMemo } from "react";
import {
  construirEntidadesPublicas,
  construirFacturacionPublica,
  construirNotificacionesPublica,
  normalizeKeys,
  resolveEntidadId,
  useCartaInstruccionesData,
} from "@/features/carta-instrucciones";
import { paises, relacionTipo, tipos } from "@/features/catalogos";
import {
  useCoordinacion,
  useCoordinacionCargas,
  useFetchCoordinacionFechaMov,
} from "@/features/coordinaciones";
import { resolverCargasParaPdf } from "@/features/embarques/lib/cargas-pdf";
import { adaptarCoordinacionParaCarta } from "@/features/embarques/lib/carta-privada";
import {
  COD_RUBRO_DOCS_CROPA,
  COD_RUBRO_FECHAS,
  TIPO_ENTIDAD,
} from "@/features/embarques/lib/constantes";
import { useFetchDatosEntidadRelacionadaPrivado, useFetchEntidades } from "@/features/entidades";
import {
  useListarCoordinacionGastos,
  useObtenerUltimaVersionCoordinacionGastos,
} from "@/features/gastos";
import { construirDetallesData } from "../public/carta-publica-data";
import {
  encontrarShipperFallbackId,
  type JsonRecord,
  resolverContactoEntidad,
} from "../public/entidad-resolvers";
import { useCatalogosCartaPrivada } from "./use-catalogos-carta-privada";

export function useDatosCartaPrivada({
  embarqueId,
  cargasPublicasValues = [],
}: {
  embarqueId: number | null;
  /** Cargas editadas en pantalla (ganan sobre las persistidas para el PDF). */
  cargasPublicasValues?: JsonRecord[];
}) {
  const { data: embarqueData, isLoading: loadingEmbarque } = useCoordinacion(
    embarqueId ?? undefined,
  );

  // ID de cotización-cabecera con el que está indexada la carta que llenó el
  // cliente en la vista pública.
  const cotizacionCabeceraId = embarqueData?.cotizacionCabeceraId ?? null;

  // MISMO camino de lectura/fusión que la vista pública: el asesor ve
  // exactamente lo que el cliente guardó.
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

  // true cuando la carta ya se consultó, o cuando el embarque cargó y no hay
  // cotizacionCabeceraId (no hay carta que buscar).
  const cartaFetchDone = cartaFilaFetched || (!loadingEmbarque && !cotizacionCabeceraId);

  const listaCoordinacion = useMemo(
    () => adaptarCoordinacionParaCarta(embarqueData),
    [embarqueData],
  );
  // La carta ya fusionada — base de "lo ya guardado" al guardar una sección.
  const cartaListaCoordinacionGuardada = useMemo(
    () => (jsonCartaCliente?.["lista-coordinacion"] as JsonRecord | undefined) ?? {},
    [jsonCartaCliente],
  );

  const entidadIdCliente = embarqueData?.entidadIdCli ?? null;
  const contactoIdCliente = embarqueData?.contactoIdCliente ?? null;
  const cliInfoPrivado = useMemo(
    () => (entidadIdCliente ? { entidad_id: entidadIdCliente } : null),
    [entidadIdCliente],
  );

  // Entidades relacionadas al cliente: preselección de shipper con fallback y
  // registro slim para el guardado (mismos aliases que la vista pública).
  const { data: entidadesRelacionadasData } = useFetchDatosEntidadRelacionadaPrivado(
    { entidad_id: entidadIdCliente, cod_tipo: TIPO_ENTIDAD.cliente, cod_estado: 1 },
    { enabled: Boolean(entidadIdCliente) },
  );
  const allEntidades = useMemo(
    () => (entidadesRelacionadasData?.data || []).map((e) => normalizeKeys(e)),
    [entidadesRelacionadasData],
  );

  const entidadIdConsignatarioCoord = useMemo(
    () => resolveEntidadId(jsonCartaCliente ?? {}, listaCoordinacion, "consignatario"),
    [jsonCartaCliente, listaCoordinacion],
  );
  const entidadIdShipperCoord = useMemo(() => {
    const id = resolveEntidadId(jsonCartaCliente ?? {}, listaCoordinacion, "shipper");
    return id || encontrarShipperFallbackId(allEntidades);
  }, [jsonCartaCliente, listaCoordinacion, allEntidades]);

  // Pre-cliente: sin fila en lista-entidad tipo CLIENTE la facturación avisa
  // que debe convertirse en Cliente antes de crear la coordinación.
  const { data: clienteEntidadesTipo = [], isSuccess: clienteTipoQueryDone } = useFetchEntidades(
    { tipo_entidad: "CLIENTE", entidad_id: entidadIdCliente },
    { enabled: Boolean(entidadIdCliente) },
  );
  const esClientePreCliente = clienteTipoQueryDone && clienteEntidadesTipo.length === 0;

  // --- display de secciones --------------------------------------------------
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

  // "Copiar de consignatario": carta_consignatario solo guarda lo que el
  // cliente editó, así que el contacto se resuelve contra el maestro cuando la
  // carta no lo trae (mismo fallback que la vista pública).
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

  // Facturación siempre con la entidad cliente de la coordinación; el valor
  // guardado en carta solo aplica si la coordinación no trae entidad_id_cli.
  const entidadIdClienteFacturacion = entidadIdCliente ?? facturacionPublica.entidad_id ?? null;

  // --- catálogos privados para resolver IDs a labels ---------------------------
  const tipoIdEmbarque = embarqueData?.tipo_id_embarque ?? null;
  const catalogos = useCatalogosCartaPrivada({ tipoIdEmbarque });
  // Catálogos del PDF de cargas (G1): régimen aduanal, país de origen y
  // unidad de medida de dimensiones — resuelven el ID crudo de cada carga a
  // etiqueta legible, igual que el <select> del formulario.
  const { data: regimenAduanalCatalog = [] } = tipos.useLista({ tipo_tabla: "REGIMEN_ADUANAL" });
  const { data: paisesCatalog = [] } = paises.useLista({});
  const { data: unidadMedidaCatalog = [] } = relacionTipo.useLista({
    tipo_tabla: "coordinacion_carga",
    cod_tipo_padre: 296,
  });

  // Detalles: lo guardado en carta gana; fallback a la coordinación resuelta
  // contra catálogos (mismo constructor que la vista pública).
  const detallesData = useMemo(
    () => construirDetallesData({ facturacionPublica, listaCoordinacion, catalogos }),
    [facturacionPublica, listaCoordinacion, catalogos],
  );

  // --- cargas y fechas ---------------------------------------------------------
  const { data: cargas = [] } = useCoordinacionCargas(embarqueId ? String(embarqueId) : undefined);
  // Prioriza las cargas que el cliente guardó en la carta sobre las de BD.
  const cargasCarta = useMemo((): JsonRecord[] => {
    const saved = jsonCartaCliente?.["lista-coordinacion-carga"];
    if (Array.isArray(saved) && saved.length > 0) return saved as JsonRecord[];
    return cargas as unknown as JsonRecord[];
  }, [jsonCartaCliente, cargas]);

  // G1: las ediciones en pantalla ganan sobre lo persistido/guardado en la
  // carta; resuelto SIEMPRE (sin atajo para "cargas sin editar").
  const cargasParaPdf = useMemo(() => {
    const fuente = cargasPublicasValues.length > 0 ? cargasPublicasValues : cargasCarta;
    return resolverCargasParaPdf(fuente, {
      regimenAduanal: regimenAduanalCatalog,
      tipoEmbalaje: catalogos.embalaje,
      paises: paisesCatalog,
      unidadMedida: unidadMedidaCatalog,
    });
  }, [
    cargasPublicasValues,
    cargasCarta,
    regimenAduanalCatalog,
    catalogos.embalaje,
    paisesCatalog,
    unidadMedidaCatalog,
  ]);

  const { data: fechasMovData = [] } = useFetchCoordinacionFechaMov(
    { embarque_id: embarqueId },
    { enabled: Boolean(embarqueId) },
  );

  // "Fechas" solo se muestra si algún gasto de la última versión tiene
  // cod_rubro = 12 (mismo criterio que la vista pública).
  const { data: ultimaVersionGastos, isSuccess: versionGastosLoaded } =
    useObtenerUltimaVersionCoordinacionGastos(embarqueId ?? undefined);
  const { data: gastosCoordinacion = [] } = useListarCoordinacionGastos({
    embarque_id: embarqueId ?? undefined,
    embarque_version: ultimaVersionGastos?.embarque_version ?? undefined,
    enabled: Boolean(embarqueId) && versionGastosLoaded,
  });
  const showFechas = useMemo(
    () => gastosCoordinacion.some((g) => Number(g.codRubro) === COD_RUBRO_FECHAS),
    [gastosCoordinacion],
  );
  // "Documentos CROPA" solo si algún gasto tiene cod_rubro = 127 (mismo
  // criterio que la vista pública, §7.D.3 del plan de paridad).
  const showCropaDocs = useMemo(
    () => gastosCoordinacion.some((g) => Number(g.codRubro) === COD_RUBRO_DOCS_CROPA),
    [gastosCoordinacion],
  );

  const codFileFromCargas = cargas.length > 0 ? String(cargas[0]?.codFile ?? "") : "";
  const codFile = codFileFromCargas || String(embarqueData?.cod_file ?? "");

  const seccionesLoading = loadingEmbarque || !cartaFetchDone;

  // Referencia estable mientras ningún dato subyacente cambie: evita que cada
  // tecla escrita en una sección (que solo actualiza estado local del wizard)
  // re-renderice las demás secciones vía `React.memo` con la prop `datos`.
  return useMemo(
    () => ({
      embarqueData,
      loadingEmbarque,
      cotizacionCabeceraId,
      idServicio: embarqueData?.id_servicio ?? null,
      jsonCartaCliente,
      filaCartaCliente,
      refetchCartaCliente,
      cartaFetchDone,
      seccionesLoading,
      listaCoordinacion,
      cartaListaCoordinacionGuardada,
      entidadIdCliente,
      contactoIdCliente,
      cliInfoPrivado,
      esClientePreCliente,
      allEntidades,
      entidadIdShipperCoord,
      entidadIdConsignatarioCoord,
      entidadIdClienteFacturacion,
      entidadesPublicas,
      facturacionPublica,
      notificacionesPublica,
      consignatarioParaNotificaciones,
      detallesData,
      catalogos,
      cargas,
      cargasCarta,
      cargasParaPdf,
      fechasMovData,
      showFechas,
      showCropaDocs,
      codFile,
    }),
    [
      embarqueData,
      loadingEmbarque,
      cotizacionCabeceraId,
      jsonCartaCliente,
      filaCartaCliente,
      refetchCartaCliente,
      cartaFetchDone,
      seccionesLoading,
      listaCoordinacion,
      cartaListaCoordinacionGuardada,
      entidadIdCliente,
      contactoIdCliente,
      cliInfoPrivado,
      esClientePreCliente,
      allEntidades,
      entidadIdShipperCoord,
      entidadIdConsignatarioCoord,
      entidadIdClienteFacturacion,
      entidadesPublicas,
      facturacionPublica,
      notificacionesPublica,
      consignatarioParaNotificaciones,
      detallesData,
      catalogos,
      cargas,
      cargasCarta,
      cargasParaPdf,
      fechasMovData,
      showFechas,
      showCropaDocs,
      codFile,
    ],
  );
}
