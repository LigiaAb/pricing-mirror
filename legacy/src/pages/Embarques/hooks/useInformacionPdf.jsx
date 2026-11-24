import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import pdfGeneratorEmbarques from '../lib/pdfGeneratorEmbarques';
import { generarPDFInformacionEmbarque } from '../lib/pdfInformacionEmbarque';
import {
  api,
} from '../../../api/api';
import {
  useFetchEntidadContacto,
  useFetchEntidadesDireccion,
  useFetchEntidadIdentificacion,
  useFetchEntidadRelaciones,
  useFetchServicios,
  useFetchTipos,
  useListarCoordinacionGastos,
  useObtenerUltimaVersionCoordinacionGastos,
  fetchUltimaVersionCoordinacionGastos,
  fetchCoordinacionGastos,
  fetchCoordinacionCargas,
  useFetchPuntoEnlace,
  useCoordinacionLegs,
  recuperarFilaCartaInstruccionesPrivado,
  extraerJsonCartaInstrucciones,
  extraerFilaCartaInstrucciones,
  extractFromData,
  extractResponseData,
} from '../../../hooks/Bpm';
import { construirCartaPlanaParaPdf, resolveEntidadId } from '../components/cartaInstrucciones/cartaModel';

const getFirst = (source, keys, fallback = '') => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return fallback;
};

const isEntregaYRecoleccion = (direccion = {}) => {
  const tipoDescripcion = String(
    getFirst(direccion, ['tipo_descripcion', 'TIPO_DESCRIPCION'], ''),
  ).toLowerCase().trim();

  if (tipoDescripcion) return tipoDescripcion === 'entrega y recoleccion';

  const codTipo = Number(getFirst(direccion, ['cod_tipo', 'COD_TIPO'], Number.NaN));
  return codTipo === 145;
};

const detectTransportMode = (source = {}) => {
  const raw = String(
    getFirst(source, [
      'transportMode',
      'TRANSPORT_MODE',
      'tipo_transporte',
      'TIPO_TRANSPORTE',
      'tipo_descripcion_transporte',
      'TIPO_DESCRIPCION_TRANSPORTE',
      'nom_tipo_transporte',
      'NOM_TIPO_TRANSPORTE',
    ], 'aereo'),
  ).toLowerCase();

  if (raw.includes('marit')) return 'maritimo';
  if (raw.includes('terrest') || raw.includes('road')) return 'terrestre';
  return 'aereo';
};

// Hook que construye el payload necesario para generar el PDF de
// información de embarque y expone una función `handleDownloadPdf` que
// dispara la creación/descarga.  En versiones anteriores la descarga se
// hacía con `generarPDFInformacionEmbarque`; a partir de la refactorización se
// utiliza el nuevo `pdfGeneratorEmbarques` (importado arriba) que unifica las
// variantes terrestres/marítimas/CTS y devuelve directamente una cadena data
// URI o un blob según el tipo de salida.  El orden de parámetros es
// importante y se documenta aquí para evitar errores similares al que
// generaba un valor nulo en `facturacionValues.detalles.tipoCarga`.
//
// Parámetros principales:
//  - embarqueData: objeto bruto de la API con la información del embarque
//  - cargas: lista de registros de cargas (items)
//  - incotermsCatalog: catálogo de incoterms (opcional)
//  - tiposPagoCatalog: catálogo de tipos de pago (opcional)
//  - tiposCargaCatalog: catálogo de tipos de carga (opcional, nuevo)
//  - isDraft: bandera para marcar documento como borrador
//  - facturacionValues: valores de la sección de facturación (cliente + detalles)
//  - cartaPublicaData: datos adicionales cuando se genera desde la vista pública
//  - notificacionesValues: sección de notificaciones recientemente añadida
//  - usePdfInformacionEmbarque: si true, usa el generador legacy `pdfInformacionEmbarque` (para CTS)
//  - entidadesValues: valores de shipper/consignatario seleccionados en la UI (usa para forzar datos en el PDF)
//  - options.useFreshData: si true, "Descargar PDF" hace fetch directo a los endpoints
//    (bypass de cache de React Query) y arma el PDF únicamente con la data persistida,
//    ignorando los valores en memoria del formulario (facturacionValues, entidadesValues,
//    notificacionesValues). Esto garantiza que el PDF refleje la versión más reciente
//    guardada en backend y no incluya cambios pendientes sin guardar.
//  - options.cotizacionCabeceraId: id de cotización cabecera (sólo requerido en modo
//    `useFreshData` para refrescar la carta de instrucciones desde el endpoint).
export function useInformacionPdf(
  embarqueData,
  cargas = [],
  incotermsCatalog = [],
  tiposPagoCatalog = [],
  tiposCargaCatalog = [], // <--- new catalog for carga types
  isDraft = false,
  facturacionValues = {}, // información temporal de la sección de facturación (cliente, nit, etc.)
  cartaPublicaData = null, // datos pre-construidos desde useFilaCartaInstruccionesPublico (página pública)
  notificacionesValues = {}, // estado recopilado por las secciones de notificaciones (privada o pública)
  usePdfInformacionEmbarque = false, // si true, usa el generador legacy pdfInformacionEmbarque.
  entidadesValues = {}, // valores seleccionados en UI para Shipper/Consignatario
  fechasValues = [], // fechas de coordinacion_fecha_mov desde FechasSection
  options = {}, // { useFreshData, cotizacionCabeceraId }
) {
  const {
    useFreshData = false,
    cotizacionCabeceraId = null,
    tiposServicioCatalog = [],
    codTipoClienteFacturacion = null,
  } = options || {};
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const queryClient = useQueryClient();

  // En modo público toda la data viene de cartaPublicaData, no necesitamos
  // hacer fetch a ningún endpoint de entidades.
  const isPublicMode = cartaPublicaData != null;

  const clienteId =
    getFirst(embarqueData || {}, ['ENTIDAD_ID_CLI', 'entidad_id_cli', 'entidadIdCli'], null);
  const { data: relacionesData = [] } = useFetchEntidadRelaciones(
    { entidad_id: clienteId },
    { enabled: !isPublicMode && Boolean(clienteId) },
  );

  // La entidad shipper/consignatario que el cliente seleccionó en la carta de
  // instrucciones (guardada en `lista-coordinacion.entidad_id_shipper/
  // entidad_id_consignatario`) puede diferir de la que trae `embarqueData`
  // (la fila de coordinación cruda), sobre todo antes de "Crear Coordinación",
  // momento en el que esa fila todavía no refleja la selección del cliente.
  // `cartaPublicaData` (armado con `construirCartaPlanaParaPdf`) ya trae esos
  // IDs resueltos con la misma prioridad que usa la vista pública
  // (`resolveEntidadId`); sin este fallback el PDF terminaba pidiendo
  // dirección/contacto/NIT de la entidad equivocada (o de ninguna) y mostraba
  // "N/A" aunque el formulario tuviera la entidad correcta seleccionada y
  // guardada.
  const shipperId = getFirst(
    { shipperEntidadId: cartaPublicaData?.shipperEntidadId, ...(embarqueData || {}) },
    ['shipperEntidadId', 'entidad_id_shipper', 'ENTIDAD_ID_SHIPPER', 'entidadIdShipper'],
    null,
  );
  const consignId = getFirst(
    { consignatarioEntidadId: cartaPublicaData?.consignatarioEntidadId, ...(embarqueData || {}) },
    ['consignatarioEntidadId', 'entidad_id_consignatario', 'ENTIDAD_ID_CONSIGNATARIO', 'entidadIdConsignatario'],
    null,
  );

  const shipperRelacion = (relacionesData || []).find((row) => {
    const id2 = row.entidad_id_2 || row.ENTIDAD_ID_2;
    const tipoDesc = String(row.tipo_descripcion_e2 || row.TIPO_DESCRIPCION_E2 || '').toLowerCase().trim();
    return (
      String(id2) === String(shipperId) &&
      (tipoDesc === 'shipper' || tipoDesc === 'consignor' || tipoDesc === 'remitente')
    );
  });

  const consignRelacion = (relacionesData || []).find((row) => {
    const id2 = row.entidad_id_2 || row.ENTIDAD_ID_2;
    const tipoDesc = String(row.tipo_descripcion_e2 || row.TIPO_DESCRIPCION_E2 || '').toLowerCase().trim();
    return (
      String(id2) === String(consignId) &&
      (tipoDesc === 'consignatario' || tipoDesc === 'consignee' || tipoDesc === 'destinatario')
    );
  });

  const codTipoShipper = Number(
    getFirst(
      shipperRelacion || {},
      ['cod_tipo_e2', 'COD_TIPO_E2'],
      getFirst(embarqueData || {}, ['cod_tipo_shipper', 'COD_TIPO_SHIPPER', 'shipper_cod_tipo'], null),
    ),
  );
  const codTipoConsign = Number(
    getFirst(
      consignRelacion || {},
      ['cod_tipo_e2', 'COD_TIPO_E2'],
      getFirst(
        embarqueData || {},
        ['cod_tipo_consignatario', 'COD_TIPO_CONSIGNATARIO', 'consign_cod_tipo'],
        null,
      ),
    ),
  );

  const { data: shipperDirecciones = [] } = useFetchEntidadesDireccion(
    { cod_tipo: codTipoShipper, entidad_id: shipperId },
    { enabled: !isPublicMode && Boolean(codTipoShipper && shipperId), staleTime: 0 },
  );
  const { data: consignDirecciones = [] } = useFetchEntidadesDireccion(
    { cod_tipo: codTipoConsign, entidad_id: consignId },
    { enabled: !isPublicMode && Boolean(codTipoConsign && consignId), staleTime: 0 },
  );

  const { data: shipperContactosResp = {} } = useFetchEntidadContacto(
    { cod_tipo: codTipoShipper, entidad_id: shipperId },
    { enabled: !isPublicMode && Boolean(codTipoShipper && shipperId), staleTime: 0 },
  );
  const { data: consignContactosResp = {} } = useFetchEntidadContacto(
    { cod_tipo: codTipoConsign, entidad_id: consignId },
    { enabled: !isPublicMode && Boolean(codTipoConsign && consignId), staleTime: 0 },
  );

  const { data: shipperIdentResp = {} } = useFetchEntidadIdentificacion(
    { cod_tipo: codTipoShipper, entidad_id: shipperId },
    { enabled: !isPublicMode && Boolean(codTipoShipper && shipperId), staleTime: 0 },
  );
  const { data: consignIdentResp = {} } = useFetchEntidadIdentificacion(
    { cod_tipo: codTipoConsign, entidad_id: consignId },
    { enabled: !isPublicMode && Boolean(codTipoConsign && consignId), staleTime: 0 },
  );

  const embarqueClienteId = Number(
    getFirst(embarqueData || {}, ['entidad_id_cli', 'ENTIDAD_ID_CLI', 'entidadIdCli', 'embarque_cliente', 'EMBARQUE_CLIENTE', 'cliente_bpartner_id']),
  );
  const { data: nitFacturacionResp = {} } = useFetchEntidadIdentificacion(
    {
      cod_tipo: 3,
      entidad_id: embarqueClienteId,
      cod_identificacion: 3,
      cod_estado: 1,
    },
    { enabled: !isPublicMode && !Number.isNaN(embarqueClienteId) && embarqueClienteId > 0 },
  );

  // catálogo para traducir el código de régimen aduanal (guardado por carga)
  // a su etiqueta legible en el PDF; sin esto la sección PRODUCTO mostraba el
  // id crudo (cod_tipo) en vez del nombre (nom_tipo).
  const { data: regimenAduanalCatalogInternal = [] } = useFetchTipos({ tipo_tabla: 'REGIMEN_ADUANAL' });
  // catálogo para traducir el código de tipo de embalaje a su nombre legible
  // en el PDF (respaldo cuando la carga no trae ya `tipo_embalaje` como texto).
  const { data: tipoEmbalajeCatalogInternal = [] } = useFetchTipos({ tipo_tabla: 'embalaje' });

  const embarqueId = Number(
    getFirst(embarqueData || {}, ['embarqueId', 'EMBARQUE_ID', 'embarque_id', 'id'], ''),
  );

  const codEmpresa = Number(getFirst(embarqueData || {}, ['empresaId', 'empresa_id', 'EMPRESA_ID'], 1)) || 1;
  const codCc = Number(getFirst(embarqueData || {}, ['centroId', 'cencos_id', 'CENCOS_ID', 'cencosId'], 16)) || 16;

  const { data: legsData = [] } = useCoordinacionLegs(
    embarqueId > 0 ? embarqueId : null,
    codCc,
    codEmpresa,
    { enabled: !isPublicMode && embarqueId > 0 },
  );

  const gastosEnabled = !isPublicMode && !Number.isNaN(embarqueId) && embarqueId > 0;
  const { data: ultimaVersionPdfData, isSuccess: isVersionPdfLoaded, isLoading: isLoadingVersion } =
    useObtenerUltimaVersionCoordinacionGastos(gastosEnabled ? embarqueId : null);
  const embarqueVersionPdf = ultimaVersionPdfData?.embarque_version ?? null;
  const { data: gastos = [], isLoading: isLoadingGastos } = useListarCoordinacionGastos({
    embarque_id: embarqueId,
    embarque_version: embarqueVersionPdf,
    enabled: gastosEnabled && isVersionPdfLoaded,
  });

  const { data: servicios = [] } = useFetchServicios({}, { enabled: !isPublicMode });
  const { data: puntosEnlace = [] } = useFetchPuntoEnlace({}, { enabled: !isPublicMode });

  const puntoEnlaceMap = useMemo(() => {
    const map = new Map();
    (puntosEnlace || []).forEach((pe) => {
      if (pe.cod_puntoenlace != null) map.set(Number(pe.cod_puntoenlace), pe);
    });
    return map;
  }, [puntosEnlace]);

  const servicioSiglasMap = useMemo(() => {
    const map = new Map();
    (servicios || []).forEach((s) => {
      const key = String(s.value ?? s.cod_servicio ?? s.COD_SERVICIO ?? '');
      const siglas = s.siglas ?? s.SIGLAS ?? '';
      if (key) map.set(key, siglas);
    });
    return map;
  }, [servicios]);

  const otherChargesFromGastos = useMemo(() => {
    if (!Array.isArray(gastos) || gastos.length === 0) return '';

    const lines = gastos
      .map((item) => {
        const codServicio = item?.cod_servicio ?? item?.COD_SERVICIO;
        const siglas =
          servicioSiglasMap.get(String(codServicio)) ??
          item?.servicio_siglas ??
          item?.siglas ??
          '';
        const normalizedSiglas = String(siglas).trim().toUpperCase();
        if (normalizedSiglas === 'A/F') return null;

        const venta =
          item?.venta_rubro ??
          item?.VENTA_RUBRO ??
          item?.venta ??
          item?.valor ??
          '';
        const ventaString = venta !== undefined && venta !== null ? String(venta).trim() : '';
        const parts = [];
        if (siglas) parts.push(siglas);
        if (ventaString) parts.push(ventaString);
        return parts.join(' ').trim();
      })
      .filter(Boolean);

    return lines.join('\n');
  }, [gastos, servicioSiglasMap]);

  const afRateCosto = useMemo(() => {
    if (!Array.isArray(gastos) || gastos.length === 0) return null;
    const afGasto = gastos.find((item) => {
      const codServicio = item?.cod_servicio ?? item?.COD_SERVICIO;
      const siglas =
        servicioSiglasMap.get(String(codServicio)) ??
        item?.servicio_siglas ??
        item?.siglas ??
        '';
      return String(siglas).trim().toUpperCase() === 'A/F';
    });
    if (!afGasto) return null;
    const val = afGasto?.rate_venta ?? afGasto?.RATE_VENTA ?? null;
    return val !== null && val !== '' ? Number(val) : null;
  }, [gastos, servicioSiglasMap]);

  const afTipoPagoCodigo = useMemo(() => {
    if (!Array.isArray(gastos) || gastos.length === 0) return null;
    const afGasto = gastos.find((item) => Number(item?.cod_rubro ?? item?.COD_RUBRO) === 11);
    if (!afGasto) return null;
    const val = afGasto?.cod_tipo_pago ?? afGasto?.COD_TIPO_PAGO ?? null;
    return val !== null && val !== '' ? Number(val) : null;
  }, [gastos]);

  const taxFromGastos = useMemo(() => {
    if (!Array.isArray(gastos) || gastos.length === 0) return null;
    const ivaGasto = gastos.find((item) => Number(item?.cod_rubro ?? item?.COD_RUBRO) === 133);
    if (!ivaGasto) return null;
    const venta = ivaGasto?.venta_rubro ?? ivaGasto?.VENTA_RUBRO ?? 0;
    const codTipoPago = ivaGasto?.cod_tipo_pago ?? ivaGasto?.COD_TIPO_PAGO ?? null;
    const tipoPagoInfo = tiposPagoCatalog.find((t) => String(t.value) === String(codTipoPago));
    const tipoPago = String(tipoPagoInfo?.label ?? '').toUpperCase();
    return { venta: Number(venta) || 0, tipoPago };
  }, [gastos, tiposPagoCatalog]);

  // Snapshot de los valores del closure ANTES de que `buildPdfPayload` los
  // sombree. `buildPdfPayload` reasigna estos mismos nombres más abajo con
  // `var X = ctx_X` para no tener que renombrar el resto de su cuerpo; pero
  // `var` se hoistea a TODO el scope de esa función, así que cualquier
  // referencia a `X` dentro de `buildPdfPayload` (incluida la que arma
  // `ctx_X = dataOverride.X ?? X`) apuntaba siempre a esa variable local
  // (`undefined` hasta su propia asignación), nunca al valor real del closure
  // del hook. Resultado: cuando `dataOverride` no traía el campo (el caso de
  // TODOS los llamadores que no usan `useFreshData`, p. ej. la vista pública),
  // `ctx_X` terminaba en `undefined` y el PDF se generaba completamente vacío
  // aunque `cartaPublicaData`/`embarqueData`/etc. sí tuvieran datos.
  const outerValuesForPdf = {
    embarqueData, cargas, incotermsCatalog, tiposPagoCatalog, tiposCargaCatalog,
    relacionesData, shipperDirecciones, consignDirecciones, shipperContactosResp,
    consignContactosResp, shipperIdentResp, consignIdentResp, nitFacturacionResp,
    legsData, fechasValues, gastos, servicios, puntosEnlace,
    facturacionValues, cartaPublicaData, notificacionesValues, entidadesValues,
  };

  const buildPdfPayload = async (dataOverride = {}) => {
    // Cuando se pasa `dataOverride` (modo `useFreshData`) los datos que vienen
    // del fetch directo a los endpoints reemplazan a los del closure (React
    // Query). Esto permite que `handleDownloadPdf` arme el PDF con la
    // información más reciente y solo persistida, ignorando los valores
    // pendientes del formulario.
    const ensureArray = (v, fallback = []) => (Array.isArray(v) ? v : fallback);
    const ensureObject = (v, fallback = {}) => (v && typeof v === 'object' && !Array.isArray(v) ? v : fallback);
    const ctx_embarqueData = dataOverride.embarqueData ?? outerValuesForPdf.embarqueData;
    const ctx_cargas = ensureArray(dataOverride.cargas, outerValuesForPdf.cargas);
    const ctx_incotermsCatalog = ensureArray(dataOverride.incotermsCatalog, outerValuesForPdf.incotermsCatalog);
    const ctx_tiposPagoCatalog = ensureArray(dataOverride.tiposPagoCatalog, outerValuesForPdf.tiposPagoCatalog);
    const ctx_tiposCargaCatalog = ensureArray(dataOverride.tiposCargaCatalog, outerValuesForPdf.tiposCargaCatalog);
    const ctx_relaciones = ensureArray(dataOverride.relaciones, outerValuesForPdf.relacionesData);
    const ctx_shipperDirecciones = ensureArray(dataOverride.shipperDirecciones, outerValuesForPdf.shipperDirecciones);
    const ctx_consignDirecciones = ensureArray(dataOverride.consignDirecciones, outerValuesForPdf.consignDirecciones);
    const ctx_shipperContactosResp = ensureObject(dataOverride.shipperContactosResp, outerValuesForPdf.shipperContactosResp);
    const ctx_consignContactosResp = ensureObject(dataOverride.consignContactosResp, outerValuesForPdf.consignContactosResp);
    const ctx_shipperIdentResp = ensureObject(dataOverride.shipperIdentResp, outerValuesForPdf.shipperIdentResp);
    const ctx_consignIdentResp = ensureObject(dataOverride.consignIdentResp, outerValuesForPdf.consignIdentResp);
    const ctx_nitFacturacionResp = ensureObject(dataOverride.nitFacturacionResp, outerValuesForPdf.nitFacturacionResp);
    const ctx_legsData = ensureArray(dataOverride.legsData, outerValuesForPdf.legsData);
    const ctx_fechasValues = ensureArray(dataOverride.fechasValues, outerValuesForPdf.fechasValues);
    const ctx_gastos = ensureArray(dataOverride.gastos, outerValuesForPdf.gastos);
    const ctx_servicios = ensureArray(dataOverride.servicios, outerValuesForPdf.servicios);
    const ctx_puntosEnlace = ensureArray(dataOverride.puntosEnlace, outerValuesForPdf.puntosEnlace);
    // En modo `useFreshData` los valores del formulario no deben mezclarse;
    // sólo se respeta `cartaPublicaData` (que es la carta persistida en la
    // vista pública) o lo que el caller haya pasado explícitamente.
    const ctx_facturacionValues = dataOverride.facturacionValues
      ?? (dataOverride.ignoreFormState ? {} : outerValuesForPdf.facturacionValues);
    const ctx_cartaPublicaData = dataOverride.cartaPublicaData
      ?? (dataOverride.ignoreFormState ? null : outerValuesForPdf.cartaPublicaData);
    const ctx_notificacionesValues = dataOverride.notificacionesValues
      ?? (dataOverride.ignoreFormState ? {} : outerValuesForPdf.notificacionesValues);
    const ctx_entidadesValues = dataOverride.entidadesValues
      ?? (dataOverride.ignoreFormState ? {} : outerValuesForPdf.entidadesValues);

    // Derivados del embarque + relaciones (recalculados con la data efectiva).
    // Igual que en el scope externo del hook: preferir la entidad resuelta
    // desde la carta (`ctx_cartaPublicaData.shipperEntidadId`/
    // `consignatarioEntidadId`) sobre la fila cruda de coordinación — en modo
    // `useFreshData` las direcciones/contactos/NIT ya se pidieron usando esa
    // misma entidad resuelta (ver `fetchAllDataForPdf`), así que filtrar aquí
    // con el ID equivocado dejaba los resultados en blanco pese a que la
    // llamada sí había traído los datos correctos.
    const ctx_shipperId = getFirst(
      { shipperEntidadId: ctx_cartaPublicaData?.shipperEntidadId, ...(ctx_embarqueData || {}) },
      ['shipperEntidadId', 'entidad_id_shipper', 'ENTIDAD_ID_SHIPPER', 'entidadIdShipper'],
      null,
    );
    const ctx_consignId = getFirst(
      { consignatarioEntidadId: ctx_cartaPublicaData?.consignatarioEntidadId, ...(ctx_embarqueData || {}) },
      ['consignatarioEntidadId', 'entidad_id_consignatario', 'ENTIDAD_ID_CONSIGNATARIO', 'entidadIdConsignatario'],
      null,
    );
    const ctx_shipperRelacion = (ctx_relaciones || []).find((row) => {
      const id2 = row.entidad_id_2 || row.ENTIDAD_ID_2;
      const tipoDesc = String(row.tipo_descripcion_e2 || row.TIPO_DESCRIPCION_E2 || '').toLowerCase().trim();
      return (
        String(id2) === String(ctx_shipperId) &&
        (tipoDesc === 'shipper' || tipoDesc === 'consignor' || tipoDesc === 'remitente')
      );
    });
    const ctx_consignRelacion = (ctx_relaciones || []).find((row) => {
      const id2 = row.entidad_id_2 || row.ENTIDAD_ID_2;
      const tipoDesc = String(row.tipo_descripcion_e2 || row.TIPO_DESCRIPCION_E2 || '').toLowerCase().trim();
      return (
        String(id2) === String(ctx_consignId) &&
        (tipoDesc === 'consignatario' || tipoDesc === 'consignee' || tipoDesc === 'destinatario')
      );
    });

    // Mapas y derivados de catálogos (recalculados con la data efectiva)
    const ctx_servicioSiglasMap = (() => {
      const map = new Map();
      (ctx_servicios || []).forEach((s) => {
        const key = String(s.value ?? s.cod_servicio ?? s.COD_SERVICIO ?? '');
        const siglas = s.siglas ?? s.SIGLAS ?? '';
        if (key) map.set(key, siglas);
      });
      return map;
    })();
    const ctx_puntoEnlaceMap = (() => {
      const map = new Map();
      (ctx_puntosEnlace || []).forEach((pe) => {
        if (pe.cod_puntoenlace != null) map.set(Number(pe.cod_puntoenlace), pe);
      });
      return map;
    })();

    const ctx_otherChargesFromGastos = (() => {
      if (!Array.isArray(ctx_gastos) || ctx_gastos.length === 0) return '';
      const lines = ctx_gastos.map((item) => {
        const codServicio = item?.cod_servicio ?? item?.COD_SERVICIO;
        const siglas =
          ctx_servicioSiglasMap.get(String(codServicio)) ??
          item?.servicio_siglas ??
          item?.siglas ??
          '';
        const normalizedSiglas = String(siglas).trim().toUpperCase();
        if (normalizedSiglas === 'A/F') return null;
        const venta =
          item?.venta_rubro ??
          item?.VENTA_RUBRO ??
          item?.venta ??
          item?.valor ??
          '';
        const ventaString = venta !== undefined && venta !== null ? String(venta).trim() : '';
        const parts = [];
        if (siglas) parts.push(siglas);
        if (ventaString) parts.push(ventaString);
        return parts.join(' ').trim();
      }).filter(Boolean);
      return lines.join('\n');
    })();

    const ctx_afRateCosto = (() => {
      if (!Array.isArray(ctx_gastos) || ctx_gastos.length === 0) return null;
      const afGasto = ctx_gastos.find((item) => {
        const codServicio = item?.cod_servicio ?? item?.COD_SERVICIO;
        const siglas =
          ctx_servicioSiglasMap.get(String(codServicio)) ??
          item?.servicio_siglas ??
          item?.siglas ??
          '';
        return String(siglas).trim().toUpperCase() === 'A/F';
      });
      if (!afGasto) return null;
      const val = afGasto?.rate_venta ?? afGasto?.RATE_VENTA ?? null;
      return val !== null && val !== '' ? Number(val) : null;
    })();

    const ctx_afTipoPagoCodigo = (() => {
      if (!Array.isArray(ctx_gastos) || ctx_gastos.length === 0) return null;
      const afGasto = ctx_gastos.find((item) => Number(item?.cod_rubro ?? item?.COD_RUBRO) === 11);
      if (!afGasto) return null;
      const val = afGasto?.cod_tipo_pago ?? afGasto?.COD_TIPO_PAGO ?? null;
      return val !== null && val !== '' ? Number(val) : null;
    })();

    const ctx_taxFromGastos = (() => {
      if (!Array.isArray(ctx_gastos) || ctx_gastos.length === 0) return null;
      const ivaGasto = ctx_gastos.find((item) => Number(item?.cod_rubro ?? item?.COD_RUBRO) === 133);
      if (!ivaGasto) return null;
      const venta = ivaGasto?.venta_rubro ?? ivaGasto?.VENTA_RUBRO ?? 0;
      const codTipoPago = ivaGasto?.cod_tipo_pago ?? ivaGasto?.COD_TIPO_PAGO ?? null;
      const tipoPagoInfo = ctx_tiposPagoCatalog.find((t) => String(t.value) === String(codTipoPago));
      const tipoPago = String(tipoPagoInfo?.label ?? '').toUpperCase();
      return { venta: Number(venta) || 0, tipoPago };
    })();

    // Usamos los nombres de las variables del closure para no tocar el resto
    // del cuerpo de la función.
    var embarqueData = ctx_embarqueData;
    var cargas = ctx_cargas;
    var incotermsCatalog = ctx_incotermsCatalog;
    var tiposPagoCatalog = ctx_tiposPagoCatalog;
    var tiposCargaCatalog = ctx_tiposCargaCatalog;
    var relacionesData = ctx_relaciones;
    var shipperRelacion = ctx_shipperRelacion;
    var consignRelacion = ctx_consignRelacion;
    var shipperDirecciones = ctx_shipperDirecciones;
    var consignDirecciones = ctx_consignDirecciones;
    var shipperContactosResp = ctx_shipperContactosResp;
    var consignContactosResp = ctx_consignContactosResp;
    var shipperIdentResp = ctx_shipperIdentResp;
    var consignIdentResp = ctx_consignIdentResp;
    var nitFacturacionResp = ctx_nitFacturacionResp;
    var legsData = ctx_legsData;
    var fechasValues = ctx_fechasValues;
    var gastos = ctx_gastos;
    var servicios = ctx_servicios;
    var puntosEnlace = ctx_puntosEnlace;
    var servicioSiglasMap = ctx_servicioSiglasMap;
    var puntoEnlaceMap = ctx_puntoEnlaceMap;
    var otherChargesFromGastos = ctx_otherChargesFromGastos;
    var afRateCosto = ctx_afRateCosto;
    var afTipoPagoCodigo = ctx_afTipoPagoCodigo;
    var taxFromGastos = ctx_taxFromGastos;
    var facturacionValues = ctx_facturacionValues;
    var cartaPublicaData = ctx_cartaPublicaData;
    var notificacionesValues = ctx_notificacionesValues;
    var entidadesValues = ctx_entidadesValues;

    const source = embarqueData || {};

    const buildEntidadDetalle = ({
      entidadId,
      relacion,
      direcciones,
      contactosResp,
      identResp,
      fallbackNombre,
    }) => {
      if (!entidadId) {
        return {
          nombre: '',
          direccion: '',
          contactoNombre: '',
          contactoTelefono: '',
          contactoEmail: '',
          nit: '',
        };
      }

      const nombre =
        getFirst(relacion || {}, ['entidad_nombre_2', 'ENTIDAD_NOMBRE_2'], '') ||
        getFirst(relacion || {}, ['entidad_nombre_1', 'ENTIDAD_NOMBRE_1'], '') ||
        fallbackNombre ||
        '';

      const direccionesFiltradas = (direcciones || []).filter(
        (item) => !entidadId || String(item.entidad_id || item.ENTIDAD_ID) === String(entidadId),
      );
      const direccionRow =
        direccionesFiltradas.find((item) => isEntregaYRecoleccion(item)) || direccionesFiltradas[0] || {};

      const contactos = contactosResp?.data || [];
      const contactoRow =
        contactos.find((item) => !entidadId || String(item.entidad_id) === String(entidadId)) || {};

      const identificaciones = identResp?.data || [];
      const nitRow =
        identificaciones.find((item) => {
          if (entidadId && String(item.entidad_id) !== String(entidadId)) return false;
          return String(item.nom_identificacion || '').toLowerCase() === 'nit';
        }) || {};

      return {
        nombre,
        direccion: getFirst(
          direccionRow,
          ['direccion', 'entidaddireccion_direccion', 'ENTIDADDIRECCION_DIRECCION'],
          '',
        ),
        contactoNombre: getFirst(
          contactoRow,
          ['entidadcontacto_nombre', 'ENTIDADCONTACTO_NOMBRE', 'nombre'],
          '',
        ),
        contactoTelefono: getFirst(
          contactoRow,
          ['entidadcontacto_telefono', 'ENTIDADCONTACTO_TELEFONO', 'telefono'],
          '',
        ),
        contactoEmail: getFirst(
          contactoRow,
          ['entidadcontacto_email', 'ENTIDADCONTACTO_EMAIL', 'email'],
          '',
        ),
        nit: getFirst(
          nitRow,
          [
            'entidadidentificacion_numero',
            'ENTIDADIDENTIFICACION_NUMERO',
            'ENTIDADIDENTIFICACIO_NUMERO',
            'entidadidentificacio_numero',
            'entidadidentificacio_num',
            'identificacion_numero',
          ],
          '',
        ),
      };
    };

    const shipperDetalle = buildEntidadDetalle({
      entidadId: shipperId,
      relacion: shipperRelacion,
      direcciones: shipperDirecciones,
      contactosResp: shipperContactosResp,
      identResp: shipperIdentResp,
      fallbackNombre: getFirst(source, ['entidad_shipper_nombre', 'ENTIDAD_SHIPPER_NOMBRE', 'shipperName'], ''),
    });

    const consignDetalle = buildEntidadDetalle({
      entidadId: consignId,
      relacion: consignRelacion,
      direcciones: consignDirecciones,
      contactosResp: consignContactosResp,
      identResp: consignIdentResp,
      fallbackNombre: getFirst(
        source,
        ['entidad_consignatario_nombre', 'ENTIDAD_CONSIGNATARIO_NOMBRE', 'consigneeName'],
        '',
      ),
    });

    // contacts are no longer provided; skip the filtering step entirely.
    const transportMode = detectTransportMode(source);

    const items = (Array.isArray(cargas) ? cargas : []).map((item) => {
      const pesoUnidad = String(
        getFirst(item, ['pesoUnidad', 'tipoUnidadMedida', 'tipoUnidadMedidaId', 'weightKgLb', 'unidadPeso', 'unidadMedida'], 'kg'),
      ).trim() || 'Kg';

      // nombre legible de la unidad de medida de la carga (largo/alto/ancho):
      // `listar-coordinacion-carga` (a diferencia del catálogo `lista-tipo`)
      // ya trae el nombre en `tipo_desc`; cuando la carga viene del formulario
      // en memoria (aún no persistida) el caller ya resuelve el id contra el
      // catálogo `coordinacion_carga` (cod_tipo_padre 296) y lo entrega en
      // `unidadMedidaLabel`.
      const unidadMedidaLabel = String(
        getFirst(
          item,
          ['unidadMedidaLabel', 'tipo_desc', 'TIPO_DESC', 'tipoDesc', 'tipoDescripcion', 'TIPO_DESCRIPCION'],
          '',
        ),
      ).trim();

      const largo = Number(getFirst(item, ['largo', 'LARGO', 'largo_m', 'largo_cm', 'LARGO_CM', 'LARGO_M'], 0)) || 0;
      const ancho = Number(getFirst(item, ['ancho', 'ANCHO', 'ancho_m', 'ancho_cm', 'ANCHO_CM', 'ANCHO_M'], 0)) || 0;
      const alto = Number(getFirst(item, ['alto', 'ALTO', 'alto_m', 'alto_cm', 'ALTO_CM', 'ALTO_M'], 0)) || 0;
      const dimensiones = largo > 0 && ancho > 0 && alto > 0
        ? `${largo} x ${ancho} x ${alto}`
        : '';

      const chargeableFromCw = Number(getFirst(item, ['cw', 'CW', 'chargeableWeight'], ''));
      const chargeableFallback = Number(getFirst(item, ['volumen', 'VOLUMEN'], 0));
      const chargeableValue = Number.isFinite(chargeableFromCw) && chargeableFromCw > 0 ? chargeableFromCw : (Number.isFinite(chargeableFallback) ? chargeableFallback : 0);

      return {
        pieces: getFirst(item, ['bultos', 'BULTOS', 'cantidad', 'pieces'], 0),
        volumen: Number(getFirst(item, ['volumen', 'VOLUMEN', 'metrosCubicos', 'METROS_CUBICOS', 'chargeableWeight'], 0)) || 0,
        grossWeight: Number(getFirst(item, ['peso', 'PESO', 'grossWeight', 'pesoTotal', 'PESO_TOTAL'], 0)) || 0,
        chargeableWeight: chargeableValue || 0,
        total: getFirst(item, ['valor', 'VALOR', 'total'], 0),
        descripcion: getFirst(
          item,
          ['descripcionCarga', 'DESCRIPCION_CARGA', 'descripcion', 'natureOfGoods'],
          '',
        ),
        pesoUnidad,
        unidadMedidaLabel,
        weightKgLb: 'Kg',
        tarimas: Number(getFirst(item, ['tarimas', 'TARIMAS'], 0)) || 0,
        cajas: Number(getFirst(item, ['cajas', 'CAJAS'], 0)) || 0,
        largo,
        ancho,
        alto,
        dimensiones,
      };
    });

    // si la coordinación trae país de origen explícito podemos usarlo como
    // respaldo o reemplazo del valor que llegue en `embarqueData`.
    const paisOrigenFromCargas =
      cargas && cargas.length > 0
        ? getFirst(cargas[0], [
          'nombre_pais_origen',
          'NOMBRE_PAIS_ORIGEN',
          'pais_origen',
          'PAIS_ORIGEN',
          'paisOrigen',
        ], '')
        : '';

    // valor definitivo de país de origen que utilizaremos en el PDF
    const resolvedPaisOrigen =
      getFirst(source, ['nombre_pais_origen', 'NOMBRE_PAIS_ORIGEN', 'pais_origen', 'PAIS_ORIGEN', 'paisOrigen'], '') ||
      paisOrigenFromCargas;

    // régimen aduanal y partida arancelaria se capturan por carga (item), no
    // en `embarqueData`, así que si no vienen en `source` se toman de la
    // primera carga registrada.
    const regimenAduanalFromCargas =
      cargas && cargas.length > 0
        ? getFirst(cargas[0], ['regimenAduanal', 'REGIMEN_ADUANAL', 'regimen_aduanal'], '')
        : '';
    const partidaArancelariaFromCargas =
      cargas && cargas.length > 0
        ? getFirst(cargas[0], ['partidaArancelaria', 'PARTIDA_ARANCELARIA', 'partida_arancelaria'], '')
        : '';
    // el tipo de embalaje se captura por carga; el backend ya persiste su
    // nombre legible en `tipo_embalaje` (ver payloadUtils.js), pero por si
    // sólo viniera el id (`cod_tipo_embalaje`) lo resolvemos con el catálogo.
    const tipoEmbalajeFromCargas = (() => {
      if (!cargas || cargas.length === 0) return '';
      const label = getFirst(cargas[0], ['tipo_embalaje', 'TIPO_EMBALAJE', 'tipoEmbalajeLabel', 'tipoEmbalaje', 'TipoEmbalaje'], '');
      if (label) return label;
      const raw = getFirst(cargas[0], ['cod_tipo_embalaje', 'COD_TIPO_EMBALAJE'], '');
      if (!raw) return '';
      const found = (tipoEmbalajeCatalogInternal || []).find(
        (t) => String(t.value ?? t.codTipo) === String(raw),
      );
      return found?.label || found?.nomTipo || raw;
    })();

    // rutas: preferir legs de la API (tabla coordinacion_legs) sobre json_datos_opcionales
    const rutasRaw = (() => {
      if (Array.isArray(legsData) && legsData.length > 0) return legsData;
      if (Array.isArray(source.rutas) && source.rutas.length > 0) return source.rutas;
      try {
        const rawJson =
          source.json_datos_opcionales ??
          source.jsonDatosOpcionales ??
          source.json_atributos_opcionales ??
          source.jsonAtributosOpcionales ??
          null;
        if (rawJson) {
          const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
          if (Array.isArray(parsed?.rutas)) return parsed.rutas;
        }
      } catch { /* ignore */ }
      return [];
    })();

    const resolvedRutas = rutasRaw.map((r) => {
      // Cubrir camelCase (mapLegsRecord), snake_case y UPPERCASE (old json format)
      const codOrigen = Number(
        r.puntoenlaceIdOrigen ??
        r.puntoenlace_id_origen ??
        r.PUNTOENLACE_ID_ORIGEN ??
        r.puertoIdOrigen ??
        r.puerto_id_origen ??
        r.PUERTO_ID_ORIGEN ??
        r.origen ??
        r.cod_origen ??
        ''
      );
      const codDestino = Number(
        r.puntoenlaceIdDestino ??
        r.puntoenlace_id_destino ??
        r.PUNTOENLACE_ID_DESTINO ??
        r.puertoIdDestino ??
        r.puerto_id_destino ??
        r.PUERTO_ID_DESTINO ??
        r.destino ??
        r.cod_destino ??
        ''
      );
      const peOrigen = puntoEnlaceMap.get(codOrigen);
      const peDestino = puntoEnlaceMap.get(codDestino);
      return {
        origenCodigo: peOrigen?.codigo || (codOrigen ? String(codOrigen) : ''),
        destinoCodigo: peDestino?.codigo || (codDestino ? String(codDestino) : ''),
        origenNombre: peOrigen?.nombre || r.puntoenlaceNombreOrigen || '',
        destinoNombre:
          peDestino?.nombre ||
          r.puntoenlaceNombreDestino ||
          r.puntoenlace_nombree_destino ||
          r.PUNTOENLACE_NOMBREE_DESTINO ||
          r.puntoenlace_nombre_destino ||
          r.PUNTOENLACE_NOMBRE_DESTINO ||
          '',
        entidadNombreProv: r.entidadNombreProv || '',
        flightNumber: r.FLIGHT_NUMBER ?? r.flight_number ?? r.flightNumber ?? '',
      };
    });

    // puntos de enlace (puerto/aduana/airport) vienen directamente en el embarque
    // Los valores de enlace origen/destino ya no se usan en el PDF, así que no los guardamos.

    // tipo de descripción de las cargas que aparecerá en la sección
    // "Producto y Cargas" del PDF.  Esta propiedad debe provenir siempre de
    // la coordinación a nivel de embarque (campo TIPO_DESCRIPCION de la
    // respuesta `lista-coordinacion`).  No usamos los registros individuales
    // porque suelen contener la unidad de medida ("KILOGRAMOS", etc.) y
    // no representan la descripción general esperada.
    const tipoDescripcionCarga = String(
      getFirst(source, ['TIPO_DESCRIPCION', 'tipo_descripcion', 'tipoCarga'], ''),
    );
    // DEBUG: asegurarse de que tomamos el valor correcto
    // console.debug('buildPdfPayload tipoDescripcionCarga (source):', tipoDescripcionCarga);

    const totalGross = items.reduce((s, it) => s + (Number(it.grossWeight) || 0), 0);
    const totalNet = items.reduce((s, it) => s + (Number(it.netWeight) || 0), 0);
    const totalPieces = items.reduce((s, it) => s + (Number(it.pieces) || 0), 0);
    const totalTarimas = items.reduce((s, it) => s + (Number(it.tarimas) || 0), 0);
    const totalCajas = items.reduce((s, it) => s + (Number(it.cajas) || 0), 0);

    const documentosCropa = (() => {
      const rawOpcionales =
        source.json_datos_opcionales ??
        source.jsonDatosOpcionales ??
        source.json_atributos_opcionales ??
        source.jsonAtributosOpcionales ??
        null;
      if (!rawOpcionales) return {};
      try {
        const parsed = typeof rawOpcionales === 'string' ? JSON.parse(rawOpcionales) : rawOpcionales;
        return parsed?.documentosCropa ?? {};
      } catch {
        return {};
      }
    })();

    const tipoSeleccionadoInfo = {
      label: String(
        getFirst(
          source,
          [
            'tipo_descripcion_transporte',
            'TIPO_DESCRIPCION_TRANSPORTE',
            'nom_tipo_transporte',
            'NOM_TIPO_TRANSPORTE',
            'tipo_transporte',
            'TRANSPORT_MODE',
          ],
          transportMode,
        ),
      ).toUpperCase(),
    };

    const servicioSeleccionadoInfo = {
      label: String(
        getFirst(
          source,
          [
            'tipoServicio',
            'tipo_servicio',
            'TIPO_SERVICIO',
            'servicio_nombre',
            'SERVICIO_NOMBRE',
            'servicio',
          ],
          'CONSOLIDADO',
        ),
      ).toUpperCase(),
    };

    const tipoCargaStr = String(
      getFirst(
        source,
        [
          'tipo_carga',
          'TIPO_CARGA',
          'clasificacionCarga',
          'CLASIFICACION_CARGA',
          'clasificacion',
        ],
        '',
      ),
    ).toLowerCase();
    const cargaGeneral = tipoCargaStr.includes('general') || tipoCargaStr === '';

    const peligrosidadRaw = String(
      getFirst(source, ['peligrosidad', 'PELIGROSIDAD', 'dangerous'], ''),
    ).toLowerCase();
    const peligrosidadSi = /^(s|si|true)$/i.test(peligrosidadRaw);
    const peligrosidadNo = /^(n|no|false)$/i.test(peligrosidadRaw);

    const coberturaSeguroRaw = String(
      getFirst(source, ['coberturaSeguro', 'cobertura_seguro', 'COBERTURA_SEGURO'], ''),
    ).toLowerCase();
    let coberturaSeguro = /^(s|si|true|1|y|yes)$/i.test(coberturaSeguroRaw);

    // el campo cod_file históricamente se ha transmitido en distintos
    // formatos según el origen de los datos.  El valor puede venir dentro de
    // la primera carga (estructura antigua) o directamente en el objeto de
    // embarque.  Los cargadores públicos a veces usan la propiedad
    // `cod_file` en vez de `codFile`, así que comprobamos ambas variantes.
    const codFileFromCargas =
      cargas && cargas.length > 0
        ? (cargas[0].codFile || cargas[0].cod_file || cargas[0].COD_FILE || "")
        : "";
    const codFile =
      codFileFromCargas ||
      (source?.cod_file || source?.COD_FILE || source?.codFile || "");

    const guiaHouse = getFirst(
      source,
      [
        'correlativoGuia',
        'correlativo_guia',
        'guiaHouse',
        'hawbNumber',
      ],
      '',
    );
    const guiaMaster = getFirst(
      source,
      [
        'correlativoGuiaMaster',
        'correlativo_guia_master',
        'guiaMaster',
        'mawbNumber',
      ],
      '',
    );

    // nit de facturación del cliente puede pre‐cargarse usando el hook BPM
    const nitFacturacionCliente = getFirst(
      nitFacturacionResp?.data?.[0],
      ['entidadidentificacion_numero', 'ENTIDADIDENTIFICACION_NUMERO'],
      '',
    );

    let cargaPeligrosa = null;
    if (peligrosidadSi) {
      cargaPeligrosa = true;
    } else if (peligrosidadNo) {
      cargaPeligrosa = false;
    }

    const formData = {
      isDraft,
      // Encabezado / exportador
      codFile,
      // exportador / shipper
      exportador: getFirst(
        source,
        [
          'entidad_shipper_nombre',
          'ENTIDAD_SHIPPER_NOMBRE',
          'shipperName',
          'exportador',
          // some legacy endpoints use a plain "shipper" field
          'shipper',
          // generic fallbacks that occasionally show up in API responses
          'ENTIDAD_NOMBRE',
          'entidad_nombre',
        ],
        'No especificado',
      ),
      telefonoExportador: getFirst(
        source,
        [
          'telefono_shipper',
          'TELEFONO_SHIPPER',
          'shipperPhone',
          'telefono',
        ],
        '',
      ),
      sitioRecoleccion: getFirst(
        source,
        [
          'direccion_recoleccion',
          'DIRECCION_RECOLECCION',
          'origen_nombre',
          'ORIGEN_NOMBRE',
          'sitioRecoleccion',
        ],
        '',
      ),
      contactoExportador: getFirst(
        source,
        [
          'contactoExportador',
          'contacto_exportador',
          'contacto_shipper',
          'contacto',
        ],
        // sometimes the contact field is stored as an email
        getFirst(source, ['shipperEmail', 'email_shipper', 'EMAIL_SHIPPER', 'email'], ''),
      ),
      emailExportador: getFirst(
        source,
        [
          'email_shipper',
          'EMAIL_SHIPPER',
          'shipperEmail',
          'email',
        ],
        '',
      ),
      telefonoEmergencia: getFirst(
        source,
        ['telefonoEmergencia', 'telefono_emergencia', 'TELEFONO_EMERGENCIA'],
        '',
      ),
      fechaRecoleccion: getFirst(
        source,
        ['fechaPosicionamiento', 'fecha_posicionamiento', 'FECHA_POSICIONAMIENTO', 'fechaRecoleccion', 'requestedFlightDate', 'fecha_salida'],
        '',
      ),
      horaRecoleccion: getFirst(source, ['horaPosicionamiento', 'hora_posicionamiento', 'HORA_POSICIONAMIENTO', 'horaRecoleccion'], ''),

      // Consignatario
      consignatario: getFirst(
        source,
        [
          'entidad_consignatario_nombre',
          'ENTIDAD_CONSIGNATARIO_NOMBRE',
          // older endpoints sometimes use a shorter field
          'ENTIDAD_CONSIG_NOMBRE',
          'entidad_consig_nombre',
          'consigneeName',
          'consignatario',
          'cons_entidad',
          // generic fallback if the API returns only a generic entity name
          'ENTIDAD_NOMBRE',
          'entidad_nombre',
        ],
        'No especificado',
      ),
      direccionConsignatario: getFirst(
        source,
        [
          'direccion_consignatario',
          'DIRECCION_CONSIGNATARIO',
          'consigneeAddress',
          'cons_direccion',
          'CONS_DIRECCION',
        ],
        '',
      ),
      contactoConsignatario: getFirst(
        source,
        [
          'contactoConsignatario',
          'contacto_consignatario',
          'cons_contacto',
          'CONS_CONTACTO',
          'contacto',
        ],
        getFirst(source, ['consigneeEmail', 'email_consignatario', 'cons_email', 'CONS_EMAIL'], ''),
      ),
      ciudadDestino: getFirst(
        source,
        [
          'destino_nombre',
          'DESTINO_NOMBRE',
          'puntoenlace_nombree_destino',
          'PUNTOENLACE_NOMBREE_DESTINO',
          'puntoenlace_nombre_destino',
          'PUNTOENLACE_NOMBRE_DESTINO',
          'ciudadDestino',
          'airportDestination',
          'destination',
        ],
        '',
      ),
      paisDestino: getFirst(
        source,
        [
          'nombre_pais_destino',
          'NOMBRE_PAIS_DESTINO',
          'pais_destino',
          'PAIS_DESTINO',
          'paisDestino',
        ],
        getFirst(source, ['destinationCountry', 'paisDestino'], ''),
      ),
      // rutas con códigos de punto enlace resueltos (para sección TO/BY del AWB)
      rutas: resolvedRutas,
      // acumulado de tipo de descripción proveniente de coordinación
      tipoDescripcionCarga,
      // alias con underscore por si algún código espera esta nomenclatura
      tipo_descripcionCarga: tipoDescripcionCarga,
      // valor elegido en la sección de facturación pública/privada.  de
      // esta forma la información que se muestra en el PDF coincide con lo
      // grabado por el usuario y no con la descripción de las cargas que
      // vienen de la coordinación (que contiene unidades de medida, etc.).
      // valor elegido en la sección de facturación pública/privada. se puede
      // recibir como identificador de catálogo, así que convertimos a etiqueta
      // si recibimos un catálogo válido.
      tipoCarga: (() => {
        // if the detalles object already carries a human-readable label we
        // prefer it (facturacion.jsx populates tipoCargaLabel when the user
        // selects an option).  otherwise fall back to the raw value and try to
        // translate it via the catalog.
        const raw = getFirst(
          facturacionValues?.detalles || {},
          ['tipoCargaLabel', 'tipoCarga'],
          getFirst(facturacionValues || {}, ['tipoCarga'], ''),
        );
        if (tiposCargaCatalog && tiposCargaCatalog.length) {
          const found = tiposCargaCatalog.find(
            (tc) => String(tc.value) === String(raw),
          );
          if (found && found.label) return found.label;
        }
        return raw;
      })(),
      telefonosConsignatario: getFirst(
        source,
        ['telefono_consignatario', 'TELEFONO_CONSIGNATARIO', 'consigneePhone', 'cons_telefono', 'CONS_TELEFONO'],
        ''
      ),
      nitCliente: getFirst(
        source,
        [
          'identificacion_numero_consignatario',
          'IDENTIFICACION_NUMERO_CONSIGNATARIO',
          'entidadidentificacion_numero_consignatario',
          'ENTIDADIDENTIFICACION_NUMERO_CONSIGNATARIO',
          'consigneeAccount',
          'nitCliente',
          'nit_consignatario',
          'NIT_CONSIGNATARIO',
          'cons_identificacion_numero',
          'CONS_IDENTIFICACION_NUMERO',
        ],
        ''
      ),
      emailConsignatario: getFirst(
        source,
        ['email_consignatario', 'EMAIL_CONSIGNATARIO', 'consigneeEmail', 'cons_email', 'CONS_EMAIL'],
        ''
      ),
      // invoice NIT (use exporter if present)
      // invoice NIT (fallback to nit_exp if entity identifier is missing)
      nitFactura: nitFacturacionCliente || getFirst(
        source,
        [
          'nit_exp',
          'nitExp',
          'NIT_EXP',
        ],
        '',
      ),
      // shipper entity NIT for display in SHIPPER section
      shipperNit: '',

      // Comerciales / administrativos
      // Incoterm: try to use description field if available, but fall back to raw value.
      incoterm: getFirst(source, ['incoterm_descripcion', 'INCOTERM_DESCRIPCION', 'incoterm', 'INCOTERM'], 'No especificado'),
      // legacy notification fields used by older APIs (mostly ignored)
      notificarNombre: getFirst(
        source,
        ['notificarNombre', 'notificar_nombre', 'NOTIFICAR_NOMBRE', 'notificar'],
        getFirst(source, ['notificar', 'NOTIFICAR'], ''),
      ),
      notificarEmail: getFirst(source, ['notificarEmail', 'notificar_email', 'NOTIFICAR_EMAIL'], ''),
      // new fields used specifically in PDF 'Notificaciones' section
      notificacionesNombre: getFirst(source, ['notificacionesNombre', 'notificaciones_nombre'], ''),
      notificacionesEmail: getFirst(source, ['notificacionesEmail', 'notificaciones_email'], ''),
      notificacionesTelefono: getFirst(source, ['notificacionesTelefono', 'notificaciones_telefono'], ''),
      notificacionesContacto: getFirst(source, ['notificacionesContacto', 'notificaciones_contacto'], ''),
      documentosCropa,

      pagadoGuatemala: Boolean(getFirst(source, ['pagadoGuatemala', 'pagado_guatemala', 'PAGADO_GUATEMALA'], getFirst(source, ['pagado_en_origen', 'prepaidIn'], false))),
      // default invoice name should be the shipper/exportador entity if available
      nombreFacturacion: getFirst(
        source,
        [
          'entidad_nombre',
          'ENTIDAD_NOMBRE',
          'nombreExp',
          'NOMBRE_EXP',
          'entidad_shipper_nombre',
          'ENTIDAD_SHIPPER_NOMBRE',
          'shipperName',
          'exportador',
        ],
        getFirst(source, ['nombreFacturacion', 'nombre_facturacion', 'nombreParaFacturacion'], getFirst(source, ['facturacion_nombre', 'nombre_factura'], ''))
      ),
      direccionFiscal: getFirst(source, ['direccionFiscal', 'direccion_fiscal', 'direccionEntregaFactura'], getFirst(source, ['direccion_factura', 'direccion_fiscal'], '')),
      contactoFacturacion: getFirst(source, ['contactoFacturacion', 'contacto_facturacion', 'facturacion_contacto', 'contacto_factura'], ''),
      telefonoFacturacion: getFirst(source, ['telefonoFacturacion', 'telefono_facturacion', 'facturacion_telefono', 'telefono_factura'], ''),
      emailFacturacion: getFirst(source, ['emailFacturacion', 'email_facturacion', 'facturacion_email', 'email_factura', 'correo_factura'], ''),
      pagadoDestino: Boolean(getFirst(source, ['pagadoDestino', 'pagado_destino', 'PAGADO_DESTINO'], false)),

      // Producto / cantidades
      descripcionProducto: getFirst(
        source,
        ['descripcionProducto', 'DESCRIPCION_PRODUCTO', 'descripcion', 'descripcion_mercancia'],
        items[0]?.descripcion || '',
      ),
      clasificacionCarga: (getFirst(source, ['clasificacionCarga', 'CLASIFICACION_CARGA', 'clasificacion'], '') || '').toUpperCase(),
      // determinar campo binario/nullable para PDF
      cargaPeligrosa,
      cargaGeneral,
      peligrosidadSi,
      peligrosidadNo,
      coberturaSeguro,
      coberturaSeguroLabel: coberturaSeguro ? 'Sí' : 'No',
      origenGuatemala: String(resolvedPaisOrigen).toLowerCase().includes('guatemala'),
      origenImportado: !String(resolvedPaisOrigen).toLowerCase().includes('guatemala') && Boolean(resolvedPaisOrigen),
      paisOrigen: resolvedPaisOrigen,

      pesoBruto: totalGross || 0,
      pesoNeto: totalNet || 0,
      cantidadBultos: totalPieces > 0 ? String(totalPieces) : 'No especificado',
      tarimas: totalTarimas || 0,
      cajas: totalCajas || 0,
      otros: getFirst(source, ['otros', 'otros_detalle'], 'No especificado'),
      otherCharges: otherChargesFromGastos || getFirst(source, ['otros', 'otros_detalle'], ''),
      tax: taxFromGastos?.venta || getFirst(source, ['tax', 'TAX', 'impuesto'], ''),
      taxTipoPago: taxFromGastos?.tipoPago || '',
      handlingInformation: getFirst(
        source,
        [
          'handlingInformation',
          'handling_information',
          'observaciones',
          'observacion',
          'instruccionesManejo',
        ],
        '',
      ),
      instruccionesManejo: getFirst(
        source,
        [
          'instruccionesManejo',
          'handlingInformation',
          'handling_information',
          'observaciones',
          'observacion',
        ],
        '',
      ),

      otrosDocumentos: Boolean(getFirst(source, ['otrosDocumentos', 'otros_documentos', 'OTROS_DOCUMENTOS'], false)),
      deprex: Boolean(getFirst(source, ['deprex', 'DEPREX'], false)),
      duaComplementaria: Boolean(getFirst(source, ['duaComplementaria', 'dua_complementaria'], false)),
      duaSimplificada: Boolean(getFirst(source, ['duaSimplificada', 'dua_simplificada'], false)),
      duaDefinitiva: Boolean(getFirst(source, ['duaDefinitiva', 'dua_definitiva'], false)),
      empaqueCotizadoSi: Boolean(getFirst(source, ['empaqueCotizadoSi', 'empaque_cotizado_si', 'empaqueCotizado'], false)),
      valorDeclaradoAduana: getFirst(source, ['valorDeclarado', 'valor_declarado', 'valorDeclaradoAduana'], 'No especificado'),
      partidaArancelaria: getFirst(source, ['partidaArancelaria', 'partida_arancelaria'], partidaArancelariaFromCargas || 'No especificado'),
      regimenAduanal: (() => {
        const raw = getFirst(source, ['regimenAduanal', 'regimen_aduanal'], regimenAduanalFromCargas || '');
        if (!raw) return 'No especificado';
        const found = (regimenAduanalCatalogInternal || []).find(
          (t) => String(t.value ?? t.codTipo) === String(raw),
        );
        return found?.label || found?.nomTipo || raw;
      })(),
      tipoEmbalaje: getFirst(source, ['tipoEmbalaje', 'tipo_embalaje'], tipoEmbalajeFromCargas || 'No especificado'),
      // país de origen de la carga/producto (por item), distinto de `paisOrigen`
      // (país de origen del trayecto general del embarque, más abajo lo pisa
      // `cartaPublicaData.paisOrigen` en modo público).
      origenCargaProducto: paisOrigenFromCargas || 'No especificado',
      definitivoGeneral: getFirst(source, ['definitivoGeneral', 'definitivo_general'], ''),

      // maintain compatibility for other generators
      shipperName: getFirst(source, ['entidad_shipper_nombre', 'ENTIDAD_SHIPPER_NOMBRE', 'shipperName'], ''),
      shipperAddress: getFirst(source, ['direccion_shipper', 'DIRECCION_SHIPPER', 'shipperAddress'], ''),
      shipperPhone: getFirst(source, ['telefono_shipper', 'TELEFONO_SHIPPER', 'shipperPhone'], ''),
      shipperEmergencyPhone: getFirst(source, ['telefonoEmergencia', 'telefono_emergencia', 'TELEFONO_EMERGENCIA', 'shipperEmergencyPhone'], ''),

      consigneeName: getFirst(source, ['entidad_consignatario_nombre', 'ENTIDAD_CONSIGNATARIO_NOMBRE', 'consigneeName'], ''),

      items,
      transportMode,
      horizontal: false,
      tamano: 'a4',
      lang: 'es',
      cencod_nombre: getFirst(source, ['cencod_nombre', 'CENCOD_NOMBRE', 'centroCosto'], ''),
      afRateCosto,
      afTipoPagoCodigo,
      gastosParaPdf: (() => {
        // Due Agent: entidad_id === 13624 (CROPA, S.A.)
        // Due Carrier: entidad_id presente y distinto de 13624
        const DUE_AGENT_ENTIDAD_ID = 13624;
        return Array.isArray(gastos) ? gastos
          .map((item) => {
            const codServicio = item?.cod_servicio ?? item?.COD_SERVICIO;
            const siglas = servicioSiglasMap.get(String(codServicio)) ?? item?.servicio_siglas ?? item?.SERVICIO_SIGLAS ?? item?.siglas ?? '';
            const normalSiglas = String(siglas).trim().toUpperCase();
            if (normalSiglas === 'A/F') return null;
            // Excluir items sin servicio/siglas (e.g. IVA que va en columna Tax)
            if (!normalSiglas) return null;
            const venta = item?.venta_rubro ?? item?.VENTA_RUBRO ?? item?.venta ?? item?.valor ?? 0;
            const rawEntidadId = item?.entidad_id ?? item?.ENTIDAD_ID ?? null;
            const entidadId = rawEntidadId !== null && rawEntidadId !== '' ? Number(rawEntidadId) : null;
            const codTipoPago = item?.cod_tipo_pago ?? item?.COD_TIPO_PAGO ?? null;
            const tipoPagoInfo = tiposPagoCatalog.find((t) => String(t.value) === String(codTipoPago));
            const tipoPago = String(tipoPagoInfo?.label ?? '').toUpperCase();
            return {
              siglas: String(siglas).trim(),
              venta: Number(venta) || 0,
              isDueAgent: entidadId === DUE_AGENT_ENTIDAD_ID,
              isDueCarrier: entidadId !== null && entidadId !== DUE_AGENT_ENTIDAD_ID,
              tipoPago,
            };
          })
          .filter(Boolean) : [];
      })(),
    };

    // Ensure shipper/consignee fields show even when the source object doesn't include them,
    // by falling back to the details we fetched from the BPM entity APIs.
    if (!formData.shipperName) formData.shipperName = shipperDetalle?.nombre || '';
    if (!formData.shipperAddress) formData.shipperAddress = shipperDetalle?.direccion || '';
    if (!formData.shipperPhone) formData.shipperPhone = shipperDetalle?.contactoTelefono || '';
    if (!formData.shipperEmergencyPhone) formData.shipperEmergencyPhone = formData.telefonoEmergencia || '';

    if (!formData.consigneeName) formData.consigneeName = consignDetalle?.nombre || '';
    if (!formData.consigneeAddress) formData.consigneeAddress = consignDetalle?.direccion || '';
    if (!formData.consigneePhone) formData.consigneePhone = consignDetalle?.contactoTelefono || '';

    if (shipperDetalle) {
      formData.exportador = shipperDetalle.nombre || formData.exportador;
      formData.sitioRecoleccion = formData.sitioRecoleccion || shipperDetalle.direccion || '';
      formData.contactoExportador = formData.contactoExportador || shipperDetalle.contactoNombre || '';
      formData.telefonoExportador = formData.telefonoExportador || shipperDetalle.contactoTelefono || '';
      formData.emailExportador = formData.emailExportador || shipperDetalle.contactoEmail || '';
      formData.shipperNit = shipperDetalle.nit || '';
    }

    if (consignDetalle) {
      formData.consignatario = consignDetalle.nombre || formData.consignatario;
      formData.direccionConsignatario = formData.direccionConsignatario || consignDetalle.direccion || '';
      formData.contactoConsignatario = formData.contactoConsignatario || consignDetalle.contactoNombre || '';
      formData.telefonosConsignatario = formData.telefonosConsignatario || consignDetalle.contactoTelefono || '';
      formData.emailConsignatario = formData.emailConsignatario || consignDetalle.contactoEmail || '';
      formData.nitCliente = formData.nitCliente || consignDetalle.nit || '';
    }


    if (entidadesValues?.shipper) {
      const shipperVal = entidadesValues.shipper;
      if (shipperVal.entidad_nombre) {
        formData.exportador = shipperVal.entidad_nombre;
        formData.shipperName = shipperVal.entidad_nombre;
      }
      if (shipperVal.direccion_recoleccion) {
        formData.sitioRecoleccion = shipperVal.direccion_recoleccion;
        formData.shipperAddress = shipperVal.direccion_recoleccion;
      }
      if (shipperVal.entidad_contacto_nombre) {
        formData.contactoExportador = shipperVal.entidad_contacto_nombre;
      }
      if (shipperVal.entidad_contacto_telefono) {
        formData.telefonoExportador = shipperVal.entidad_contacto_telefono;
        formData.shipperPhone = shipperVal.entidad_contacto_telefono;
      }
      if (shipperVal.entidad_contacto_email) {
        formData.emailExportador = shipperVal.entidad_contacto_email;
      }
      if (shipperVal.entidad_nit) {
        formData.shipperNit = shipperVal.entidad_nit;
      }
      if (shipperVal.fecha_recoleccion) {
        formData.fechaRecoleccion = shipperVal.fecha_recoleccion;
      }
      if (shipperVal.telefonoEmergencia || shipperVal.telefono_emergencia) {
        const val = shipperVal.telefonoEmergencia || shipperVal.telefono_emergencia;
        formData.telefonoEmergencia = val;
        formData.shipperEmergencyPhone = val;
      }
    }

    if (entidadesValues?.consignatario) {
      const consignVal = entidadesValues.consignatario;
      if (consignVal.entidad_nombre) {
        formData.consignatario = consignVal.entidad_nombre;
        formData.consigneeName = consignVal.entidad_nombre;
      }
      if (consignVal.direccion_recoleccion) {
        formData.direccionConsignatario = consignVal.direccion_recoleccion;
        formData.consigneeAddress = consignVal.direccion_recoleccion;
      }
      if (consignVal.entidad_contacto_nombre) {
        formData.contactoConsignatario = consignVal.entidad_contacto_nombre;
      }
      if (consignVal.entidad_contacto_telefono) {
        formData.telefonosConsignatario = consignVal.entidad_contacto_telefono;
        formData.consigneePhone = consignVal.entidad_contacto_telefono;
      }
      if (consignVal.entidad_contacto_email) {
        formData.emailConsignatario = consignVal.entidad_contacto_email;
      }
      if (consignVal.entidad_nit) {
        formData.nitCliente = consignVal.entidad_nit;
        formData.consigneeAccount = consignVal.entidad_nit;
      }
    }

    formData.contactoFacturacion =
      formData.contactoFacturacion || shipperDetalle?.contactoNombre || consignDetalle?.contactoNombre || '';
    formData.telefonoFacturacion =
      formData.telefonoFacturacion || shipperDetalle?.contactoTelefono || consignDetalle?.contactoTelefono || '';
    formData.emailFacturacion =
      formData.emailFacturacion || shipperDetalle?.contactoEmail || consignDetalle?.contactoEmail || '';

    // "Teléfono emergencia" del shipper: si la carta/embarque no traen un valor
    // propio (campo aún no capturado en el formulario), se cae al teléfono de
    // contacto del shipper para que el campo del PDF quede informado.
    if (!formData.telefonoEmergencia) {
      formData.telefonoEmergencia = formData.telefonoExportador || '';
    }

    // datos provenientes de la carta de instrucciones pública (useFilaCartaInstruccionesPublico).
    // tienen mayor prioridad que los datos de APIs de entidades, pero menor que facturacionValues.
    if (cartaPublicaData && typeof cartaPublicaData === 'object') {
      const aplicar = (campo, valor) => {
        if (valor !== undefined && valor !== null && valor !== '') {
          formData[campo] = valor;
        }
      };
      // si la carta pública incluye el código file lo aplicamos primero ya que
      // puede ser necesario para referencias posteriores (por ejemplo,
      // `referenceNumber` al final de la función).
      aplicar('codFile', cartaPublicaData.codFile);
      // Shipper / exportador
      aplicar('exportador', cartaPublicaData.exportador);
      aplicar('contactoExportador', cartaPublicaData.contactoExportador);
      aplicar('telefonoExportador', cartaPublicaData.telefonoExportador);
      aplicar('emailExportador', cartaPublicaData.emailExportador);
      aplicar('telefonoEmergencia', cartaPublicaData.telefonoEmergencia);
      aplicar('sitioRecoleccion', cartaPublicaData.sitioRecoleccion);
      aplicar('shipperNit', cartaPublicaData.shipperNit);
      aplicar('fechaRecoleccion', cartaPublicaData.fechaRecoleccion);
      aplicar('horaRecoleccion', cartaPublicaData.horaRecoleccion);
      aplicar('documentosCropa', cartaPublicaData.documentosCropa);
      // Consignatario
      aplicar('consignatario', cartaPublicaData.consignatario);
      aplicar('direccionConsignatario', cartaPublicaData.direccionConsignatario);
      aplicar('contactoConsignatario', cartaPublicaData.contactoConsignatario);
      aplicar('telefonosConsignatario', cartaPublicaData.telefonosConsignatario);
      aplicar('emailConsignatario', cartaPublicaData.emailConsignatario);
      aplicar('nitCliente', cartaPublicaData.nitCliente);
      // Facturación
      aplicar('nombreFacturacion', cartaPublicaData.nombreFacturacion);
      aplicar('nitFactura', cartaPublicaData.nitFactura);
      aplicar('direccionFiscal', cartaPublicaData.direccionFiscal);
      aplicar('contactoFacturacion', cartaPublicaData.contactoFacturacion);
      aplicar('telefonoFacturacion', cartaPublicaData.telefonoFacturacion);
      aplicar('emailFacturacion', cartaPublicaData.emailFacturacion);
      aplicar('incoterm', cartaPublicaData.incoterm);
      // Coordinación / trayecto
      aplicar('paisOrigen', cartaPublicaData.paisOrigen);
      aplicar('paisDestino', cartaPublicaData.paisDestino);
      aplicar('enlaceOrigen', cartaPublicaData.enlaceOrigen);
      aplicar('enlaceDestino', cartaPublicaData.enlaceDestino);
      aplicar('observaciones', cartaPublicaData.observaciones);
      aplicar('instruccionesManejo', cartaPublicaData.instruccionesManejo);
      aplicar('handlingInformation', cartaPublicaData.instruccionesManejo);
      // Notificaciones
      aplicar('notificacionesNombre', cartaPublicaData.notificacionesNombre);
      aplicar('notificacionesEmail', cartaPublicaData.notificacionesEmail);
      aplicar('notificacionesTelefono', cartaPublicaData.notificacionesTelefono);
      aplicar('notificacionesContacto', cartaPublicaData.notificacionesContacto);
      // Detalles (tipoPago/tipoCarga/servicio/peligrosidad) guardados en el paso
      // "Detalles" de la carta de instrucciones. Sin esto, aunque el cliente los
      // hubiera llenado y guardado, el PDF los mostraba en blanco/"No especificado"
      // porque sólo se leían desde `source` (embarque crudo) o `facturacionValues`
      // (estado del formulario en memoria, vacío en modo `useFreshData`).
      aplicar('tipoPago', cartaPublicaData.tipoPago);
      aplicar('tipoCarga', cartaPublicaData.tipoCarga);
      aplicar('clasificacionCarga', cartaPublicaData.clasificacionCarga);
      if (cartaPublicaData.servicio) {
        servicioSeleccionadoInfo.label = String(cartaPublicaData.servicio).toUpperCase();
      }
      // `peligrosidad` en `carta_facturacion.detalles` es un array multi-select
      // de códigos (ver DetallesPublica: "S"=Carga Peligrosa, "V"=Carga Valiosa,
      // "C"=Cobertura de Seguro), no un simple flag S/N — sin este chequeo por
      // `Array.isArray` primero, `String(["C"])` daba "c" y no matcheaba ni
      // si/no, dejando "Carga peligrosa" en "No especificado" aunque el cliente
      // sí hubiera guardado la selección (con "S" ausente = explícitamente No).
      if (Array.isArray(cartaPublicaData.peligrosidad)) {
        formData.coberturaSeguro = cartaPublicaData.peligrosidad.includes('C');
        formData.coberturaSeguroLabel = formData.coberturaSeguro ? 'Sí' : 'No';
        // En la vista pública DetallesPublica no expone el checkbox 'S' de
        // Carga Peligrosa (solo V/C), así que la peligrosidad que obliga la
        // Hoja de Seguridad (MSDS) se deriva de la clasificación de carga y
        // viaja como flag explícito `cartaPublicaData.cargaPeligrosa` (construido
        // en page.jsx a partir de clasificacionCarga === 122). Sin esto, el PDF
        // sólo listaba "Factura Cobertura Seguro" bajo "Cliente" aunque la Hoja
        // de Seguridad también estuviera subida — `formData.peligrosidad` y
        // `peligrosidadLabel` quedaban vacíos y buildDocumentGroups los descartaba.
        formData.cargaPeligrosa = cartaPublicaData.cargaPeligrosa === true ||
          cartaPublicaData.peligrosidad.includes('S');
        formData.peligrosidadSi = formData.cargaPeligrosa;
        formData.peligrosidadNo = !formData.cargaPeligrosa;
        formData.peligrosidad = formData.cargaPeligrosa;
        formData.peligrosidadLabel = formData.cargaPeligrosa ? 'Sí' : 'No';
      } else if (cartaPublicaData.peligrosidad !== undefined && cartaPublicaData.peligrosidad !== null && cartaPublicaData.peligrosidad !== '') {
        const peligrosidadCartaRaw = String(cartaPublicaData.peligrosidad).toLowerCase();
        if (/^(s|si|true)$/i.test(peligrosidadCartaRaw)) {
          formData.cargaPeligrosa = true;
          formData.peligrosidadSi = true;
          formData.peligrosidadNo = false;
        } else if (/^(n|no|false)$/i.test(peligrosidadCartaRaw)) {
          formData.cargaPeligrosa = false;
          formData.peligrosidadSi = false;
          formData.peligrosidadNo = true;
        }
      }
      // `cartaPublicaData.cargaPeligrosa` es el flag autoritativo construido en
      // page.jsx a partir de clasificacionCarga === 122 (ver comentario arriba).
      // Cuando `detallesData.peligrosidad` llega undefined/'' (el cliente aún no
      // guardó nada en el paso "Detalles", o `listaCoordinacion.peligrosidad`
      // tampoco trae valor), ninguna de las dos ramas anteriores se ejecuta y
      // `cargaPeligrosa` nunca se aplicaba a `formData` — el PDF omitía "Hoja de
      // Seguridad" bajo "Cliente" aunque el documento ya estuviera subido. Este
      // override incondicional garantiza que el flag explícito siempre gane.
      if (cartaPublicaData.cargaPeligrosa === true) {
        formData.cargaPeligrosa = true;
        formData.peligrosidadSi = true;
        formData.peligrosidadNo = false;
        formData.peligrosidad = true;
        formData.peligrosidadLabel = 'Sí';
      }
    }

    // si el usuario ha rellenado el formulario de facturación en el wizard,
    // preferimos esos valores para que el PDF coincida con lo que ve en pantalla.
    if (facturacionValues && typeof facturacionValues === 'object') {
      // support both new nested shape and legacy flat object
      const clienteObj = facturacionValues.cliente || facturacionValues;
      if (clienteObj.cliente) {
        formData.nombreFacturacion = clienteObj.cliente;
      }
      if (clienteObj.numero) {
        formData.nitFactura = clienteObj.numero;
      }
      if (clienteObj.direccionFiscal) {
        formData.direccionFiscal = clienteObj.direccionFiscal;
      }
      if (clienteObj.clienteContacto) {
        formData.contactoFacturacion = clienteObj.clienteContacto;
      }
      if (clienteObj.clienteContactoEmail) {
        formData.emailFacturacion = clienteObj.clienteContactoEmail;
      }
      if (clienteObj.clienteContactoTelefono) {
        formData.telefonoFacturacion = clienteObj.clienteContactoTelefono;
      }
      // los "Detalles" (instrucciones de manejo, etc.) se guardan aparte, bajo
      // facturacionValues.detalles; sin este bloque el PDF solo veía la versión
      // ya persistida en cartaPublicaData y mostraba "N/A" mientras el usuario
      // la estaba llenando en el wizard.
      const detallesObj = facturacionValues.detalles || {};
      if (detallesObj.instruccionesManejo) {
        formData.instruccionesManejo = detallesObj.instruccionesManejo;
        formData.handlingInformation = detallesObj.instruccionesManejo;
      }
    }

    // si el caller pasó datos de notificaciones directamente (página CTS/gestion),
    // aplicarlos con mayor prioridad que lo extraído de la fuente.
    if (notificacionesValues && typeof notificacionesValues === 'object') {
      if (notificacionesValues.nombre) {
        formData.notificacionesNombre = notificacionesValues.nombre;
      }
      if (notificacionesValues.email) {
        formData.notificacionesEmail = notificacionesValues.email;
      }
      if (notificacionesValues.telefono) {
        formData.notificacionesTelefono = notificacionesValues.telefono;
      }
      if (notificacionesValues.contacto) {
        formData.notificacionesContacto = notificacionesValues.contacto;
      }
    }

    // si aun no hay fecha de recolección, buscarla en las fechas de
    // coordinacion_fecha_mov (FechasSection).  Se prioriza un tipo que
    // contenga "RECOLECCIÓN" o "RECOJO" en la descripción; si no hay,
    // se toma la primera fecha registrada.
    if (!formData.fechaRecoleccion && Array.isArray(fechasValues) && fechasValues.length > 0) {
      const recoleccion = fechasValues.find((f) => {
        const desc = String(f.TIPO_DESCRIPCION || f.tipo_descripcion || f.nomenclatura || '').toUpperCase();
        return desc.includes('RECOLEC') || desc.includes('RECOJO') || desc.includes('PICKUP');
      });
      formData.fechaRecoleccion = recoleccion?.FECHA || recoleccion?.fecha || fechasValues[0]?.FECHA || fechasValues[0]?.fecha || '';
    }

    formData.consigneeAddress = formData.direccionConsignatario || '';
    formData.consigneePhone = formData.telefonosConsignatario || '';
    formData.consigneeAccount = formData.nitCliente || '';
    formData.shipperAccount = formData.shipperNit || '';
    formData.agentNameCity =
      getFirst(source, ['agentNameCity', 'AGENT_NAME_CITY', 'agente_nombre_ciudad'], '') || '';
    formData.agentIATACode = getFirst(source, ['agentIATACode', 'AGENT_IATA_CODE', 'agente_iata'], '');
    formData.agentAccount = getFirst(source, ['agentAccount', 'AGENT_ACCOUNT'], '');
    formData.airportDepartureRouting = getFirst(
      source,
      [
        'airportDepartureRouting',
        'requestedRouting',
        'requested_routing',
        'routing',
        'ruta',
        'rutaSolicitada',
        'ruta_solicitada',
      ],
      formData.sitioRecoleccion || '',
    );
    formData.currency = getFirst(source, ['currency', 'CURRENCY'], '');
    formData.optionalShippingInfo = getFirst(source, ['optionalShippingInfo', 'OPTIONAL_SHIPPING_INFO'], '');
    formData.referenceNumber = formData.codFile || '';
    formData.hawbNumber = formData.hawbNumber || guiaHouse || '';
    formData.mawbNumber = formData.mawbNumber || guiaMaster || '';
    formData.guiaHouse = formData.guiaHouse || guiaHouse || '';
    formData.guiaMaster = formData.guiaMaster || guiaMaster || '';
    const masterGuideNumber = String(formData.mawbNumber || formData.guiaMaster || '').trim();
    if (!isPublicMode && !masterGuideNumber) {
      formData.isDraft = true;
    }
    formData.guiaAsignada = getFirst(
      source,
      [
        'guiaAsignada',
        'correlativoGuia',
        'correlativo_guia',
        'correlativoGuiaMaster',
        'correlativo_guia_master',
        'numeroGuia',
        'NUM_GUIA',
        'num_guia',
        'guia_asignada',
      ],
      '',
    );

    // Prefer the value chosen in the Facturación > Detalles form when available.
    // Sección de facturación en el wizard puede proporcionar un valor de tipo de pago
    // tanto en `tipoPago` (id) como en `tipoPagoLabel` (texto legible).
    const tipoIdPago = getFirst(
      facturacionValues?.detalles || {},
      ['tipoPago'],
      getFirst(source, ['tipo_id_pago', 'TIPO_ID_PAGO', 'tipoPago'], null),
    );

    const tipoPagoInfo = tiposPagoCatalog.find((t) => String(t.value) === String(tipoIdPago));

    const tipoPagoLabelFromForm = getFirst(
      facturacionValues?.detalles || {},
      ['tipoPagoLabel'],
      null,
    );

    const tipoPagoLabel = tipoPagoLabelFromForm || tipoPagoInfo?.label || '';
    // No pisar con '' el valor que ya haya aplicado el bloque de `cartaPublicaData`
    // (dato guardado) cuando ni el formulario en memoria ni `source` traen un
    // tipo de pago resoluble — esto ocurre siempre en modo `useFreshData`/público,
    // donde `facturacionValues` llega vacío intencionalmente.
    if (tipoPagoLabel) {
      formData.tipoPago = tipoPagoLabel;
    }

    // Igual que tipoPago: el Incoterm seleccionado en Facturación > Detalles se
    // guarda como el ID del catálogo (ver DetallesPublica), no como la
    // descripción. El valor crudo de `source` (cabecera de la coordinación) casi
    // nunca se mantiene sincronizado con ese paso del wizard, así que sin esta
    // traducción el PDF mostraba "No especificado"/"-" aunque el usuario ya
    // hubiera elegido un incoterm.
    const incotermIdFromForm = getFirst(facturacionValues?.detalles || {}, ['incoterm'], null);
    if (incotermIdFromForm !== null && incotermIdFromForm !== undefined && incotermIdFromForm !== '') {
      const incotermInfo = incotermsCatalog.find((t) => String(t.value) === String(incotermIdFromForm));
      formData.incoterm = incotermInfo?.label || String(incotermIdFromForm);
    }

    // Marcar x en el PDF (WT/VAL) según el tipo de pago
    const tipoPagoNormalized = String(tipoPagoLabel || '').toLowerCase();
    if (tipoPagoNormalized.includes('prepaid')) {
      formData.chgsPPD = true;
      formData.wtValPPD = true;
    }
    if (tipoPagoNormalized.includes('collect')) {
      formData.chgsCOLL = true;
      formData.wtValCOLL = true;
    }

    return { formData, tipoSeleccionadoInfo, servicioSeleccionadoInfo };
  };


  // el callback ahora puede recibir un objeto con overrideIsDraft y otras opciones:
  // Cuando `useFreshData === true`, antes de armar el PDF se hace un fetch
  // directo a cada endpoint relevante (`lista-coordinacion`, `listar-coordinacion-carga`,
  // `listar-coordinacion-legs`, `listar-coordinacion-fecha-mov`,
  // `lista-entidad-relacion`/`-direccion`/`-contacto`/`-identificacion`,
  // `obtener-ultima-version-coordinacion-gastos`, `listar-coordinacion-gastos` y
  // `fila-carta-instrucciones`). Esto evita servir datos desactualizados desde
  // el cache de React Query y limita el PDF a la información persistida
  // (ignorando valores del formulario que aún no se hayan guardado).
  const fetchAllDataForPdf = useCallback(async ({
    embarqueId: idEmbarque,
    codEmpresa: codEmpresaArg,
    codCc: codCcArg,
    embarqueDataRaw,
    cotizacionCabeceraId: cotizacionCabeceraIdArg,
    incotermsCatalog: incotermsCatalogArg,
    tiposPagoCatalog: tiposPagoCatalogArg,
    tiposCargaCatalog: tiposCargaCatalogArg,
    tiposServicioCatalog: tiposServicioCatalogArg,
    codTipoClienteFacturacion: codTipoClienteFacturacionArg,
  }) => {
    const source = embarqueDataRaw || {};
    const clienteId = getFirst(source, ['ENTIDAD_ID_CLI', 'entidad_id_cli', 'entidadIdCli'], null);
    const shipperIdFromCoordinacion = getFirst(source, ['entidad_id_shipper', 'ENTIDAD_ID_SHIPPER', 'entidadIdShipper'], null);
    const consignIdFromCoordinacion = getFirst(source, ['entidad_id_consignatario', 'ENTIDAD_ID_CONSIGNATARIO', 'entidadIdConsignatario'], null);
    const embarqueClienteId = Number(getFirst(source, ['entidad_id_cli', 'ENTIDAD_ID_CLI', 'entidadIdCli', 'embarque_cliente', 'EMBARQUE_CLIENTE', 'cliente_bpartner_id'], 0));

    const safeFetch = async (promise) => {
      try {
        return await promise;
      } catch (err) {
        console.warn('[useInformacionPdf] fetch directo falló, se usará fallback:', err);
        return null;
      }
    };

    const noop = () => Promise.resolve({ data: { data: [] } });

    // Antes de pedir dirección/contacto/NIT del shipper y consignatario hay
    // que saber CUÁL entidad usar: la fila de coordinación (`lista-coordinacion`)
    // puede no reflejar todavía la entidad que el cliente seleccionó en la
    // carta de instrucciones (eso solo se sincroniza al "Crear Coordinación").
    // Se adelanta el fetch de `lista-coordinacion` y de la carta guardada
    // (`fila-carta-instrucciones`) para resolver el entidad_id correcto con
    // la misma prioridad que usa la vista pública (`resolveEntidadId`); sin
    // esto las llamadas de abajo pedían los datos de la entidad equivocada
    // (o de ninguna) y el PDF mostraba "N/A" pese a que el formulario tuviera
    // la entidad correcta seleccionada y guardada.
    const [embarqueResEarly, cartaResEarly] = await Promise.all([
      safeFetch(api.get('/api/appweb/lista-coordinacion', { params: { cod_empresa: codEmpresaArg, cod_cc: codCcArg, embarque_id: idEmbarque } })),
      cotizacionCabeceraIdArg
        ? safeFetch(recuperarFilaCartaInstruccionesPrivado({
            cod_cotizacion_cabecera: Number(cotizacionCabeceraIdArg),
            cod_modulo: 12,
            cod_cc: 16,
            cod_empresa: 1,
          }))
        : Promise.resolve(null),
    ]);
    const embarqueArrayEarly = embarqueResEarly ? extractFromData(embarqueResEarly.data) : [];
    const embarqueFreshEarly = Array.isArray(embarqueArrayEarly) && embarqueArrayEarly.length > 0
      ? embarqueArrayEarly[0]
      : source;
    const jsonCartaEarly = cartaResEarly ? extraerJsonCartaInstrucciones(cartaResEarly) : null;

    const shipperId = jsonCartaEarly
      ? (resolveEntidadId(jsonCartaEarly, embarqueFreshEarly, 'shipper') ?? shipperIdFromCoordinacion)
      : shipperIdFromCoordinacion;
    const consignId = jsonCartaEarly
      ? (resolveEntidadId(jsonCartaEarly, embarqueFreshEarly, 'consignatario') ?? consignIdFromCoordinacion)
      : consignIdFromCoordinacion;

    // Resolver cod_tipo de shipper y consignee ANTES de pedir sus direcciones/
    // contactos/identificaciones: la cabecera de coordinación (`lista-coordinacion`)
    // no trae esos campos (cod_tipo_shipper/cod_tipo_consignatario no existen en esa
    // respuesta), así que sin esto `cod_tipo` viajaba `null` y el backend rechazaba
    // las tres llamadas con "Debe enviar el atributo cod_tipo", dejando NIT/dirección/
    // contacto/teléfono/email de Shipper y Consignatario siempre en blanco. El único
    // lugar donde vive ese dato es `lista-entidad-relacion` del cliente (mismo camino
    // que usa la ruta cacheada más arriba en este hook), así que hay que esperarlo
    // antes de disparar esas tres llamadas.
    const relacionesRes = clienteId
      ? await safeFetch(api.get('/api/appweb/lista-entidad-relacion', { params: { entidad_id: clienteId } }))
      : null;
    const relacionesFreshForCodTipo = relacionesRes ? extractResponseData(relacionesRes) : [];
    const shipperRelacionForCodTipo = (relacionesFreshForCodTipo || []).find((row) => {
      const id2 = row.entidad_id_2 || row.ENTIDAD_ID_2;
      const tipoDesc = String(row.tipo_descripcion_e2 || row.TIPO_DESCRIPCION_E2 || '').toLowerCase().trim();
      return (
        String(id2) === String(shipperId) &&
        (tipoDesc === 'shipper' || tipoDesc === 'consignor' || tipoDesc === 'remitente')
      );
    });
    const consignRelacionForCodTipo = (relacionesFreshForCodTipo || []).find((row) => {
      const id2 = row.entidad_id_2 || row.ENTIDAD_ID_2;
      const tipoDesc = String(row.tipo_descripcion_e2 || row.TIPO_DESCRIPCION_E2 || '').toLowerCase().trim();
      return (
        String(id2) === String(consignId) &&
        (tipoDesc === 'consignatario' || tipoDesc === 'consignee' || tipoDesc === 'destinatario')
      );
    });
    const fallbackCodTipoShipper = Number(
      getFirst(
        shipperRelacionForCodTipo || {},
        ['cod_tipo_e2', 'COD_TIPO_E2'],
        getFirst(source, ['cod_tipo_shipper', 'COD_TIPO_SHIPPER', 'shipper_cod_tipo'], null),
      ),
    ) || null;
    const fallbackCodTipoConsign = Number(
      getFirst(
        consignRelacionForCodTipo || {},
        ['cod_tipo_e2', 'COD_TIPO_E2'],
        getFirst(source, ['cod_tipo_consignatario', 'COD_TIPO_CONSIGNATARIO', 'consign_cod_tipo'], null),
      ),
    ) || null;

    const [
      cargasRes,
      legsRes,
      fechasRes,
      serviciosRes,
      puntosEnlaceRes,
      shipperDirRes,
      consignDirRes,
      shipperContactRes,
      consignContactRes,
      shipperIdentRes,
      consignIdentRes,
      nitFactRes,
      clienteEntidadRes,
    ] = await Promise.all([
      safeFetch(api.get('/api/appweb/listar-coordinacion-carga', { params: { embarque_id: idEmbarque } })),
      idEmbarque > 0
        ? safeFetch(api.get('/api/appweb/listar-coordinacion-legs', { params: { embarque_id: idEmbarque, cod_cc: codCcArg, cod_empresa: codEmpresaArg } }))
        : noop(),
      idEmbarque > 0
        ? safeFetch(api.get('/api/appweb/listar-coordinacion-fecha-mov', { params: { embarque_id: idEmbarque } }))
        : noop(),
      safeFetch(api.get('/api/appweb/lista-servicios')),
      safeFetch(api.get('/api/appweb/lista-punto_enlace')),
      shipperId
        ? safeFetch(api.get('/api/appweb/lista-entidad-direccion', { params: { cod_tipo: fallbackCodTipoShipper, entidad_id: shipperId } }))
        : noop(),
      consignId
        ? safeFetch(api.get('/api/appweb/lista-entidad-direccion', { params: { cod_tipo: fallbackCodTipoConsign, entidad_id: consignId } }))
        : noop(),
      shipperId
        ? safeFetch(api.get('/api/appweb/lista-entidad-contacto', { params: { cod_tipo: fallbackCodTipoShipper, entidad_id: shipperId } }))
        : noop(),
      consignId
        ? safeFetch(api.get('/api/appweb/lista-entidad-contacto', { params: { cod_tipo: fallbackCodTipoConsign, entidad_id: consignId } }))
        : noop(),
      shipperId
        ? safeFetch(api.get('/api/appweb/lista-entidad-identificacion', { params: { cod_tipo: fallbackCodTipoShipper, entidad_id: shipperId } }))
        : noop(),
      consignId
        ? safeFetch(api.get('/api/appweb/lista-entidad-identificacion', { params: { cod_tipo: fallbackCodTipoConsign, entidad_id: consignId } }))
        : noop(),
      embarqueClienteId > 0
        ? safeFetch(api.get('/api/appweb/lista-entidad-identificacion', { params: { cod_tipo: 3, entidad_id: embarqueClienteId, cod_identificacion: 3, cod_estado: 1 } }))
        : noop(),
      // Maestro completo del cliente (incluye data_contactos) para que el PDF
      // pueda usar su email/teléfono/nombre como fallback de Facturación cuando
      // la carta de instrucciones no trae esos campos guardados.
      // OJO: `recuperar-datos-entidad-relacionada` busca entidades RELACIONADAS
      // a `embarqueClienteId` del `cod_tipo` dado — no los datos propios de esa
      // entidad. El cliente de facturación no tiene una relación "cliente"
      // consigo mismo, así que esa consulta siempre volvía vacía y el PDF
      // mostraba NIT/Teléfono/Nombre de Facturación en "N/A" aunque la entidad
      // sí tuviera esos datos guardados. `recuperar-datos-entidad` (singular)
      // sí trae los datos propios de la entidad — mismo endpoint que ya usa con
      // éxito en pantalla FacturacionPublica.jsx (apiMode="private").
      embarqueClienteId > 0
        ? safeFetch(api.post('/api/appweb/recuperar-datos-entidad', {
            entidad_id: embarqueClienteId,
            cod_tipo: codTipoClienteFacturacionArg ?? 3,
          }))
        : noop(),
    ]);
    // `lista-coordinacion` y `fila-carta-instrucciones` ya se pidieron arriba
    // (necesarios para resolver `shipperId`/`consignId` antes de esta tanda).
    const embarqueRes = embarqueResEarly;
    const cartaRes = cartaResEarly;

    // Re-fetch de la versión y gastos usando los helpers ya existentes
    // (mantiene la misma ruta crítica que ya usaba la lógica de gastos).
    const freshVersionData = idEmbarque > 0
      ? await safeFetch(fetchUltimaVersionCoordinacionGastos(idEmbarque))
      : null;
    const freshVersion = freshVersionData?.embarque_version ?? null;
    const freshGastos = idEmbarque > 0
      ? (await safeFetch(fetchCoordinacionGastos(idEmbarque, freshVersion))) || []
      : [];

    const embarqueArray = embarqueRes ? extractFromData(embarqueRes.data) : [];
    const embarqueFresh = Array.isArray(embarqueArray) && embarqueArray.length > 0 ? embarqueArray[0] : source;
    const cargasPersistidas = cargasRes ? extractFromData(cargasRes.data) : [];
    // `listar-coordinacion-carga` sólo devuelve filas ya persistidas en la tabla
    // `coordinacion_carga`; antes de "Crear Coordinación" las cargas que el
    // cliente llenó en el formulario público sólo existen dentro de la carta de
    // instrucciones (`lista-coordinacion-carga` del JSON guardado). Sin este
    // fallback la sección "Producto" del PDF salía vacía aunque la pestaña
    // Producto en pantalla (que sí prioriza el draft de la carta, ver
    // `cargasCarta` en CTS/[id]/page.jsx) mostrara filas.
    const cargasDraft = jsonCartaEarly?.['lista-coordinacion-carga'];
    const cargasFresh = cargasPersistidas.length > 0
      ? cargasPersistidas
      : (Array.isArray(cargasDraft) ? cargasDraft.map((f) => ({
          descripcionCarga: f.descripcionCarga ?? f.Descripcion ?? f.descripcion ?? '',
          valor: f.valor ?? f.Valor ?? '',
          bultos: f.cantidad ?? f.Cantidad ?? f.Bultos ?? f.bultos ?? 0,
          cantidad: f.cantidad ?? f.Cantidad ?? 0,
          peso: f.pesoTotal ?? f.PesoTotal ?? f.peso ?? 0,
          volumen: f.volumenTotal ?? f.VolumenTotal ?? f.volumen ?? 0,
          partidaArancelaria: f.partidaArancelaria ?? f.PartidaArancelaria ?? '',
          regimenAduanal: f.regimenAduanal ?? f.RegimenAduanal ?? '',
          definitivoGeneral: f.definitivoGeneral ?? f.DefinitivoGeneral ?? 'N',
          paisOrigen: f.paisOrigenId ?? f.PaisOrigen ?? f.paisOrigen ?? '',
          tarimas: f.tarimas ?? f.Tarimas ?? 0,
          cajas: f.cajas ?? f.Cajas ?? 0,
          largo: f.largo ?? f.Largo ?? 0,
          alto: f.alto ?? f.Alto ?? 0,
          ancho: f.ancho ?? f.Ancho ?? 0,
          cw: f.cw ?? f.CW ?? '',
        })) : []);
    const legsFresh = legsRes ? extractFromData(legsRes.data) : [];
    const fechasFresh = fechasRes ? extractResponseData(fechasRes) : [];
    const relacionesFresh = relacionesRes ? extractResponseData(relacionesRes) : [];
    const serviciosFresh = serviciosRes ? extractResponseData(serviciosRes).map((servicio) => ({
      value: servicio.COD_SERVICIO ?? servicio.cod_servicio,
      label: servicio.NOMBRE ?? servicio.nombre ?? servicio.DESCRIPCION ?? servicio.descripcion,
      cod_servicio: servicio.COD_SERVICIO ?? servicio.cod_servicio,
      nombre: servicio.NOMBRE ?? servicio.nombre,
      siglas: servicio.SIGLAS ?? servicio.siglas,
    })) : [];
    const puntosEnlaceFresh = puntosEnlaceRes ? extractResponseData(puntosEnlaceRes) : [];
    const shipperDirFresh = shipperDirRes ? extractResponseData(shipperDirRes) : [];
    const consignDirFresh = consignDirRes ? extractResponseData(consignDirRes) : [];
    const shipperContactFresh = shipperContactRes?.data?.data || {};
    const consignContactFresh = consignContactRes?.data?.data || {};
    const shipperIdentFresh = shipperIdentRes?.data?.data || {};
    const consignIdentFresh = consignIdentRes?.data?.data || {};
    const nitFactFresh = nitFactRes?.data?.data || {};

    // Primer contacto activo del cliente (data_contactos[0]). Sirve como
    // fallback de Email/Teléfono/Nombre de Facturación para el PDF cuando la
    // carta de instrucciones no trae esos campos guardados (caso típico: el
    // cliente nunca los editó y sólo se autogeneraron en pantalla desde el
    // maestro de la entidad).
    // Forma de la respuesta: { data: { data: { DATA_CONTACTOS: [...], ... } } }
    //   - response.data = wrapper axios
    //   - response.data.data = "responseData" de `recuperar-datos-entidad`
    //     (claves en MAYÚSCULAS, ver `normalizeKeys` en useFetchDatosEntidad.js)
    const clienteEntidad = clienteEntidadRes?.data?.data || null;
    const clienteContactosFresh = getFirst(clienteEntidad || {}, ['data_contactos', 'DATA_CONTACTOS'], []).filter(
      (c) => c.cod_estado == null || Number(c.cod_estado) === 1,
    );
    const clienteContactoFresh = clienteContactosFresh[0] || null;
    // NIT del cliente de facturación desde el mismo maestro de entidad (no
    // depende de `cod_tipo`, a diferencia de `nitFactRes` más arriba, que
    // asume `cod_tipo: 3` y puede fallar/venir vacío si esa suposición no
    // aplica a esta entidad — mismo patrón que ya usa la vista pública
    // (`resolverNitEntidadPorId` en public/page.jsx).
    const clienteIdentificacionesFresh = getFirst(clienteEntidad || {}, ['data_identificaciones', 'DATA_IDENTIFICACIONES'], []).filter(
      (i) => (i.cod_estado ?? i.COD_ESTADO) == null || Number(i.cod_estado ?? i.COD_ESTADO) === 1,
    );
    const clienteNitFresh = clienteIdentificacionesFresh.find(
      (i) => String(i.nom_identificacion || i.NOM_IDENTIFICACION || '').toLowerCase() === 'nit',
    );
    const clienteContactoParaPdf = {
      nombre: clienteContactoFresh?.entidadcontacto_nombre || clienteContactoFresh?.ENTIDADCONTACTO_NOMBRE || '',
      email: clienteContactoFresh?.entidadcontacto_email || clienteContactoFresh?.ENTIDADCONTACTO_EMAIL || '',
      telefono: clienteContactoFresh?.entidadcontacto_telefono || clienteContactoFresh?.ENTIDADCONTACTO_TELEFONO || '',
      nit: clienteNitFresh?.entidadidentificacio_numero || clienteNitFresh?.ENTIDADIDENTIFICACIO_NUMERO || '',
    };

    // Carta de instrucciones: misma rutina de extracción que
    // useCartaInstruccionesData (json_data fusionado con json_data_usuario).
    let cartaFresh = null;
    if (cartaRes) {
      const jsonCarta = extraerJsonCartaInstrucciones(cartaRes) ?? null;
      const filaCarta = extraerFilaCartaInstrucciones(cartaRes) ?? null;
      if (jsonCarta) {
        cartaFresh = { jsonCarta, filaCarta };
      }
    }

    // Aplanar la carta cruda a la estructura que `useInformacionPdf` espera
    // (campos a nivel raíz: `exportador`, `consignatario`, `nitCliente`, etc.).
    // Sin este aplanado, "Descargar PDF" aplicaba la carta con su estructura
    // anidada original (`lista-coordinacion.carta_shipper.entidad_nombre`, etc.)
    // y el PDF mostraba N/A o "-" aunque los datos estuvieran guardados.
    const cartaPlanaFresh = cartaFresh?.jsonCarta
      ? construirCartaPlanaParaPdf(
          cartaFresh.jsonCarta,
          embarqueFresh,
          {
            incoterms: incotermsCatalogArg || [],
            tiposPago: tiposPagoCatalogArg || [],
            tiposCarga: tiposCargaCatalogArg || [],
            tiposServicio: tiposServicioCatalogArg || [],
          },
          clienteContactoParaPdf,
        )
      : null;

    return {
      embarqueData: embarqueFresh,
      cargas: cargasFresh,
      legsData: legsFresh,
      fechasValues: fechasFresh,
      relaciones: relacionesFresh,
      servicios: serviciosFresh,
      puntosEnlace: puntosEnlaceFresh,
      shipperDirecciones: shipperDirFresh,
      consignDirecciones: consignDirFresh,
      shipperContactosResp: { data: shipperContactFresh.data || [] },
      consignContactosResp: { data: consignContactFresh.data || [] },
      shipperIdentResp: { data: shipperIdentFresh.data || [] },
      consignIdentResp: { data: consignIdentFresh.data || [] },
      nitFacturacionResp: { data: nitFactFresh.data || [] },
      gastos: freshGastos,
      cartaJsonCarta: cartaFresh?.jsonCarta ?? null,
      cartaFila: cartaFresh?.filaCarta ?? null,
      cartaPlana: cartaPlanaFresh,
    };
  }, []);

  const handleDownloadPdf = useCallback(async (options = {}) => {
    if (!embarqueData) {
      alert('No hay datos del embarque para generar el PDF.');
      return;
    }

    const forceDownload = Boolean(options.forceDownload);

    // En modo `forceDownload` no abrimos pestaña de vista previa: el archivo
    // se guarda directamente con `<a download>`, que es la única forma de
    // garantizar el mismo nombre de archivo sugerido en Chrome y en Edge. El
    // botón "Descargar Formulario" (vista previa) depende en cambio del
    // nombre que cada visor de PDF nativo infiere por su cuenta a partir de
    // los metadatos del blob/PDF, y esa inferencia no es consistente entre
    // navegadores (Edge no siempre respeta el nombre que Chrome sí muestra).
    const previewTab = forceDownload ? null : window.open('about:blank', '_blank');
    if (previewTab) {
      previewTab.document.title = 'Generando PDF...';
      previewTab.document.body.innerHTML = "<p style='font-family: Arial, sans-serif; padding: 16px;'>Generando PDF...</p>";
    }
    setIsGeneratingPdf(true);

    try {
      let dataOverride = null;
      let cartaPublicaFresh = cartaPublicaData;

      if (useFreshData) {
        // Traer toda la data directo de los endpoints (sin pasar por cache de
        // React Query) y armar el PDF sólo con la información persistida.
        const freshData = await fetchAllDataForPdf({
          embarqueId: Number(embarqueId) || 0,
          codEmpresa: Number(codEmpresa) || 1,
          codCc: Number(codCc) || 16,
          embarqueDataRaw: embarqueData,
          cotizacionCabeceraId,
          incotermsCatalog,
          tiposPagoCatalog,
          tiposCargaCatalog,
          tiposServicioCatalog,
          codTipoClienteFacturacion,
        });

        // Preferir la versión aplanada de la carta fresca (estructura con
        // campos a nivel raíz que `useInformacionPdf` aplica directamente).
        // Si por alguna razón no se pudo aplanar, caer a la carta cruda
        // anidada (en ese caso `aplicar()` no encontrará los campos y el
        // PDF mostrará N/A — mismo síntoma que se estaba corrigiendo).
        if (freshData.cartaPlana) {
          cartaPublicaFresh = freshData.cartaPlana;
        } else if (freshData.cartaJsonCarta) {
          cartaPublicaFresh = freshData.cartaJsonCarta;
        }

        dataOverride = {
          ...freshData,
          cartaPublicaData: cartaPublicaFresh,
          ignoreFormState: true,
        };
      }

      // Invalidar caché y obtener la versión + gastos más recientes antes de
      // generar el PDF (modo legacy / cacheado: ya viene en `dataOverride`).
      // Estos dos endpoints son privados (`/api/appweb/...`, requieren sesión
      // autenticada) y usan `embarqueId`, que en modo público siempre es 0 (no
      // existe coordinación todavía) — sin este guard, "Descargar PDF" en la
      // vista pública disparaba ambas peticiones sin token igualmente.
      let freshGastos = [];
      if (!isPublicMode && embarqueId > 0) {
        const freshVersionData = await queryClient.fetchQuery({
          queryKey: ['ultima-version-coordinacion-gastos', embarqueId],
          queryFn: () => fetchUltimaVersionCoordinacionGastos(embarqueId),
          staleTime: 0,
        });
        const freshVersion = freshVersionData?.embarque_version ?? null;
        freshGastos = await queryClient.fetchQuery({
          queryKey: ['listar-coordinacion-gastos', embarqueId, freshVersion],
          queryFn: () => fetchCoordinacionGastos(embarqueId, freshVersion),
          staleTime: 0,
        });
      }

      const { formData, tipoSeleccionadoInfo, servicioSeleccionadoInfo } = await buildPdfPayload(dataOverride || undefined);

      // En modo `useFreshData` ya tenemos los gastos frescos dentro del
      // `dataOverride` que `buildPdfPayload` consumió; sólo sobreescribimos en
      // el modo legacy para no duplicar el trabajo.
      if (!useFreshData) {
        // Sobrescribir los campos derivados de gastos con los datos frescos
        const freshOtherCharges = (() => {
          if (!Array.isArray(freshGastos) || freshGastos.length === 0) return '';
          const lines = freshGastos.map((item) => {
            const codServicio = item?.cod_servicio ?? item?.COD_SERVICIO;
            const siglas = servicioSiglasMap.get(String(codServicio)) ?? item?.servicio_siglas ?? item?.siglas ?? '';
            if (String(siglas).trim().toUpperCase() === 'A/F') return null;
            const venta = item?.venta_rubro ?? item?.VENTA_RUBRO ?? item?.venta ?? item?.valor ?? '';
            const ventaString = venta !== undefined && venta !== null ? String(venta).trim() : '';
            const parts = [];
            if (siglas) parts.push(siglas);
            if (ventaString) parts.push(ventaString);
            return parts.join(' ').trim();
          }).filter(Boolean);
          return lines.join('\n');
        })();
        formData.otherCharges = freshOtherCharges || formData.otherCharges;

        const freshTax = (() => {
          if (!Array.isArray(freshGastos) || freshGastos.length === 0) return null;
          const ivaGasto = freshGastos.find((item) => Number(item?.cod_rubro ?? item?.COD_RUBRO) === 133);
          if (!ivaGasto) return null;
          const venta = ivaGasto?.venta_rubro ?? ivaGasto?.VENTA_RUBRO ?? 0;
          const codTipoPago = ivaGasto?.cod_tipo_pago ?? ivaGasto?.COD_TIPO_PAGO ?? null;
          const tipoPagoInfo = tiposPagoCatalog.find((t) => String(t.value) === String(codTipoPago));
          return { venta: Number(venta) || 0, tipoPago: String(tipoPagoInfo?.label ?? '').toUpperCase() };
        })();
        if (freshTax) {
          formData.tax = freshTax.venta;
          formData.taxTipoPago = freshTax.tipoPago;
        }

        formData.afRateCosto = (() => {
          if (!Array.isArray(freshGastos) || freshGastos.length === 0) return null;
          const afGasto = freshGastos.find((item) => {
            const codServicio = item?.cod_servicio ?? item?.COD_SERVICIO;
            const siglas = servicioSiglasMap.get(String(codServicio)) ?? item?.servicio_siglas ?? item?.siglas ?? '';
            return String(siglas).trim().toUpperCase() === 'A/F';
          });
          if (!afGasto) return null;
          const val = afGasto?.rate_venta ?? afGasto?.RATE_VENTA ?? null;
          return val !== null && val !== '' ? Number(val) : null;
        })();

        formData.afTipoPagoCodigo = (() => {
          if (!Array.isArray(freshGastos) || freshGastos.length === 0) return null;
          const afGasto = freshGastos.find((item) => Number(item?.cod_rubro ?? item?.COD_RUBRO) === 11);
          if (!afGasto) return null;
          const val = afGasto?.cod_tipo_pago ?? afGasto?.COD_TIPO_PAGO ?? null;
          return val !== null && val !== '' ? Number(val) : null;
        })();

        const DUE_AGENT_ENTIDAD_ID = 13624;
        formData.gastosParaPdf = Array.isArray(freshGastos) ? freshGastos.map((item) => {
          const codServicio = item?.cod_servicio ?? item?.COD_SERVICIO;
          const siglas = servicioSiglasMap.get(String(codServicio)) ?? item?.servicio_siglas ?? item?.SERVICIO_SIGLAS ?? item?.siglas ?? '';
          const normalSiglas = String(siglas).trim().toUpperCase();
          if (normalSiglas === 'A/F') return null;
          if (!normalSiglas) return null;
          const venta = item?.venta_rubro ?? item?.VENTA_RUBRO ?? item?.venta ?? item?.valor ?? 0;
          const rawEntidadId = item?.entidad_id ?? item?.ENTIDAD_ID ?? null;
          const entidadId = rawEntidadId !== null && rawEntidadId !== '' ? Number(rawEntidadId) : null;
          const codTipoPago = item?.cod_tipo_pago ?? item?.COD_TIPO_PAGO ?? null;
          const tipoPagoInfo = tiposPagoCatalog.find((t) => String(t.value) === String(codTipoPago));
          const tipoPago = String(tipoPagoInfo?.label ?? '').toUpperCase();
          return {
            siglas: String(siglas).trim(),
            venta: Number(venta) || 0,
            isDueAgent: entidadId === DUE_AGENT_ENTIDAD_ID,
            isDueCarrier: entidadId !== null && entidadId !== DUE_AGENT_ENTIDAD_ID,
            tipoPago,
          };
        }).filter(Boolean) : [];
      }

      // permitir que el llamador anule el flag de borrador usando la opción
      if (options.overrideIsDraft !== undefined) {
        formData.isDraft = options.overrideIsDraft;
      }
      if (Array.isArray(options.copias) && options.copias.length > 0) {
        formData.copias = options.copias;
      }

      const draftFlag = options.overrideIsDraft ?? formData.isDraft;

      // Use a Blob + object URL to avoid browser limitations with very long
      // data URIs (some browsers may refuse to open them or truncate them).
      let pdfBlob;
      if (usePdfInformacionEmbarque) {
        const catalogos = {
          incoterms: incotermsCatalog,
          tiposCarga: tiposCargaCatalog,
          contactosShipper: shipperContactosResp?.data || [],
          contactosConsignatario: consignContactosResp?.data || [],
        };

        const result = generarPDFInformacionEmbarque(
          formData,
          tipoSeleccionadoInfo,
          servicioSeleccionadoInfo,
          true,
          '',
          catalogos,
        );

        if (!result?.success) {
          throw new Error(result?.error || 'No se pudo generar el PDF');
        }

        pdfBlob = result.blob;
      } else {
        pdfBlob = pdfGeneratorEmbarques(formData, draftFlag, 'blob');
      }

      // Envolver el blob en un `File` con nombre: el visor de PDF nativo del
      // navegador (Chrome/Edge) usa `File.name` como nombre propuesto al
      // presionar "Descargar" dentro del visor; un `Blob` plano no tiene
      // nombre y el navegador propone algo genérico (p. ej. "download").
      const codFilePdf = cartaPublicaData?.codFile || '';
      const pdfFileName = codFilePdf
        ? `Instructivo embarque ${codFilePdf}.pdf`
        : (() => {
            const fechaPdf = new Date().toLocaleDateString('es-GT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }).replace(/\//g, '-');
            return `Instructivo embarque ${fechaPdf}.pdf`;
          })();
      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfFile);

      if (forceDownload) {
        // `<a download>` fuerza el diálogo nativo "Guardar como" con el
        // nombre exacto que le dimos al `File`, sin pasar por la lógica de
        // inferencia de nombre del visor de PDF del navegador.
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = pdfFileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (previewTab) {
        // Open the generated PDF in a new tab so users can view it and decide whether to download.
        // This avoids forcing an automatic download (which happened when `fileName` was supplied).
        previewTab.location.replace(pdfUrl);
      } else {
        window.open(pdfUrl, '_blank');
      }

      // Revoke the object URL after a short delay to avoid memory leaks.
      setTimeout(() => {
        try {
          URL.revokeObjectURL(pdfUrl);
        } catch (e) {
          // no-op
        }
      }, 10000);
    } catch (error) {
      if (previewTab) previewTab.close();
      console.error('Error al generar PDF de embarque:', error);
      alert('Ocurrió un error al generar el PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [
    buildPdfPayload,
    embarqueData,
    embarqueId,
    codEmpresa,
    codCc,
    useFreshData,
    cotizacionCabeceraId,
    codTipoClienteFacturacion,
    fetchAllDataForPdf,
    incotermsCatalog,
    tiposCargaCatalog,
    tiposPagoCatalog,
    tiposServicioCatalog,
    cartaPublicaData,
    shipperContactosResp,
    consignContactosResp,
    usePdfInformacionEmbarque,
    queryClient,
    servicioSiglasMap,
  ]);

  return { isGeneratingPdf, handleDownloadPdf, isLoadingPdfGastos: isLoadingVersion || isLoadingGastos };
}
