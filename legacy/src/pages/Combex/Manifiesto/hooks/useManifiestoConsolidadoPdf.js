import { useState, useCallback, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  CACHE_DYNAMIC,
  CACHE_SEMI_STATIC,
  fetchCoordinacionCargas,
  fetchCoordinacionGastos,
  fetchUltimaVersionCoordinacionGastos,
  useFetchPuntoEnlace,
  useFetchEntidades,
  useFetchEntidadesDireccion,
  useFetchTipos,
  extractFromData,
} from '../../../../hooks/Bpm';
import { api } from '../../../../api/api';
import generarPdf from '../../../Embarques/lib/pdfGeneratorEmbarques';
import generarManifiestoPDF from '../../lib/generarManifiesto';

// cod_tipo_pago: 128 = PREPAID, 127 = COLLECT
const resolveTipoPagoLabel = (cod) => {
  const n = Number(cod);
  if (n === 128) return 'PREPAID';
  if (n === 127) return 'COLLECT';
  return '';
};

// PP / CC / PP/CC abbreviation for manifiesto rows
const resolvePagoAbrev = (cod) => {
  const n = Number(cod);
  if (n === 128) return 'PP';
  if (n === 127) return 'CC';
  const s = String(cod ?? '').toUpperCase();
  if (s.includes('PREPAID') && s.includes('COLLECT')) return 'PP/CC';
  if (s.includes('PREPAID')) return 'PP';
  if (s.includes('COLLECT')) return 'CC';
  return '';
};

// Fetch first address for an entity (tries cod_tipo 145, fallback 4)
const fetchPrimeraDireccionEntidad = async (entidadId) => {
  if (!entidadId) return '';
  const { data: data145 } = await api.get('/api/appweb/lista-entidad-direccion', {
    params: { cod_tipo: 145, entidad_id: Number(entidadId) },
  });
  const list145 = extractFromData(data145);
  if (list145.length > 0) {
    return list145[0].ENTIDADDIRECCION_DIRECCION ?? list145[0].entidaddireccion_direccion ?? '';
  }
  const { data: data4 } = await api.get('/api/appweb/lista-entidad-direccion', {
    params: { cod_tipo: 4, entidad_id: Number(entidadId) },
  });
  const list4 = extractFromData(data4);
  return list4[0]?.ENTIDADDIRECCION_DIRECCION ?? list4[0]?.entidaddireccion_direccion ?? '';
};

const DUE_AGENT_ENTIDAD_ID = 13624;

/**
 * Hook para construir y generar el PDF del manifiesto consolidado.
 *
 * Obtiene las cargas de cada coordinación seleccionada y las consolida en
 * UNA SOLA FILA sumando pieces, grossWeight, chargeableWeight y total.
 * Las descripciones (que ya incluyen DIMS si aplica) se concatenan en la
 * columna "Nature and Quantity of Goods".
 *
 * @param {Array}  coordinacionesSeleccionadas - coordinaciones incluidas en el manifiesto
 * @param {string} mawb - número de guía máster
 * @param {Array}  legs - legs de la coordinación
 * @param {object} [options]
 * @param {boolean} [options.consolidar=true] - true: una sola fila con totales sumados;
 *   false: una fila por cada carga (para variante Directo con única coordinación).
 */
export function useManifiestoConsolidadoPdf(coordinacionesSeleccionadas = [], mawb = '', legs = [], { consolidar = true, includeDueAgent = true, includeDueCarrier = true } = {}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: puntosEnlace = [] } = useFetchPuntoEnlace();

  // ── Consignee: entity + address from entidad_id_estacion ─────────────────────
  const estacionId = coordinacionesSeleccionadas[0]?.entidadIdEstacion
    ?? coordinacionesSeleccionadas[0]?.entidad_id_estacion
    ?? null;

  const { data: estacionEntidades = [] } = useFetchEntidades(
    { entidad_id: estacionId, tipo_entidad: 'DSV' },
    { enabled: Boolean(estacionId) },
  );

  // DSV entities: try cod_tipo 145 first, fall back to cod_tipo 4
  const { data: estacionDirecciones145 = [] } = useFetchEntidadesDireccion(
    { cod_tipo: 145, entidad_id: estacionId },
    { enabled: Boolean(estacionId) },
  );
  const { data: estacionDirecciones4 = [] } = useFetchEntidadesDireccion(
    { cod_tipo: 4, entidad_id: estacionId },
    { enabled: Boolean(estacionId) && estacionDirecciones145.length === 0 },
  );
  const estacionDirecciones = estacionDirecciones145.length > 0 ? estacionDirecciones145 : estacionDirecciones4;

  const { data: tiposPago = [] } = useFetchTipos({ tipo_tabla: 'PAGO' });

  const tiposPagoMap = useMemo(() => {
    const map = new Map();
    tiposPago.forEach((t) => {
      if (t.codTipo != null) map.set(Number(t.codTipo), t.nomTipo);
    });
    return map;
  }, [tiposPago]);

  const puntoEnlaceMap = useMemo(() => {
    const map = new Map();
    puntosEnlace.forEach((pe) => {
      if (pe.cod_puntoenlace != null) map.set(Number(pe.cod_puntoenlace), pe);
    });
    return map;
  }, [puntosEnlace]);

  // ── Fetch cargas para cada coordinación ────────────────────────────────────
  const cargasQueries = useQueries({
    queries: coordinacionesSeleccionadas.map((coord) => {
      const embarqueId = coord.embarqueId ?? coord.embarque_id;
      return {
        queryKey: ['coordinacion-cargas', String(embarqueId)],
        queryFn: () => fetchCoordinacionCargas(embarqueId),
        enabled: !!embarqueId,
        ...CACHE_DYNAMIC,
      };
    }),
  });

  const allCargasLoaded = cargasQueries.every((q) => !q.isLoading && !q.isFetching);

  // ── Fetch shipper/consignee addresses per coordinación ────────────────────
  const shipperDirQueries = useQueries({
    queries: coordinacionesSeleccionadas.map((coord) => {
      const id = coord.entidadIdShipper ?? coord.entidad_id_shipper ?? null;
      return {
        queryKey: ['entidad-direccion-principal', id],
        queryFn: () => fetchPrimeraDireccionEntidad(id),
        enabled: !!id,
        ...CACHE_SEMI_STATIC,
      };
    }),
  });

  const consignDirQueries = useQueries({
    queries: coordinacionesSeleccionadas.map((coord) => {
      const id = coord.entidadIdConsignatario ?? coord.entidad_id_consignatario ?? null;
      return {
        queryKey: ['entidad-direccion-principal', id],
        queryFn: () => fetchPrimeraDireccionEntidad(id),
        enabled: !!id,
        ...CACHE_SEMI_STATIC,
      };
    }),
  });

  // ── Fetch última versión por coordinación ──────────────────────────────────
  const versionQueries = useQueries({
    queries: coordinacionesSeleccionadas.map((coord) => {
      const embarqueId = coord.embarqueId ?? coord.embarque_id;
      return {
        queryKey: ['ultima-version-coordinacion-gastos', embarqueId],
        queryFn: () => fetchUltimaVersionCoordinacionGastos(embarqueId),
        enabled: !!embarqueId,
        ...CACHE_DYNAMIC,
      };
    }),
  });

  // ── Fetch gastos para cada coordinación (usando última versión) ────────────
  const gastosQueries = useQueries({
    queries: coordinacionesSeleccionadas.map((coord, i) => {
      const embarqueId = coord.embarqueId ?? coord.embarque_id;
      const version = versionQueries[i]?.data?.embarque_version ?? null;
      const versionLoaded = !versionQueries[i]?.isLoading && !versionQueries[i]?.isFetching;
      return {
        queryKey: ['listar-coordinacion-gastos', embarqueId, version],
        queryFn: () => fetchCoordinacionGastos(embarqueId, version),
        enabled: !!embarqueId && versionLoaded,
        ...CACHE_DYNAMIC,
      };
    }),
  });

  // ── Construcción del payload ─────────────────────────────────────────────────
  const buildPdfPayload = useCallback(() => {
    const firstCoord = coordinacionesSeleccionadas[0] ?? {};

    const estacionEntidad = estacionEntidades[0];
    const estacionDireccion = estacionDirecciones[0];

    // Todas las cargas de todas las coordinaciones en una lista plana.
    // Se usa cargasQueries directamente (índice == orden de coordinaciones)
    // para evitar colisiones al agrupar por embarqueId.
    const todasLasCargas = cargasQueries.flatMap((q) => q.data ?? []);

    // ── Totales sumados ────────────────────────────────────────────────────────
    const totalPieces = todasLasCargas.reduce((s, c) => s + (Number(c.bultos) || 0), 0);
    const totalGross = todasLasCargas.reduce((s, c) => s + (Number(c.peso) || 0), 0);
    const totalCw = todasLasCargas.reduce((s, c) => s + (Number(c.cw) || 0), 0);
    const totalVolumen = todasLasCargas.reduce((s, c) => s + (Number(c.volumen) || 0), 0);
    const totalValor = todasLasCargas.reduce((s, c) => s + (Number(c.valor) || 0), 0);

    // ── Descripción consolidada ────────────────────────────────────────────────
    const descripcionConsolidada = todasLasCargas
      .map((c) => {
        const desc = c.descripcionCarga;
        if (!desc) return null;
        const bultos = Number(c.bultos) || '';
        const largo = Number(c.largo) || '';
        const ancho = Number(c.ancho) || '';
        const alto = Number(c.alto) || '';
        const hasDims = largo || ancho || alto;
        const dimsLine = hasDims
          ? `DIMS ${bultos} ${largo} x ${ancho} x ${alto} CM`.trim()
          : null;
        return dimsLine ? `${desc}\n${dimsLine}` : desc;
      })
      .filter(Boolean)
      .join('\n\n');

    const handlingNotas = coordinacionesSeleccionadas
      .map((coord) => {
        const observaciones = String(coord.observaciones ?? coord.observacion ?? "").trim();
        if (!observaciones) return null;
        const house = coord.correlativoGuia;
        const file = coord.cod_file ?? coord.codFile;
        const embarque = coord.embarqueId ?? coord.embarque_id;
        let etiqueta = "";

        if (house) {
          etiqueta = `${house}`;
        } else if (file) {
          etiqueta = `File ${file}`;
        } else if (embarque) {
          etiqueta = `Embarque ${embarque}`;
        }

        return etiqueta ? `${etiqueta}: ${observaciones}` : observaciones;
      })
      .filter(Boolean)
      .join("\n");

    // ── Filas de la tabla del PDF ─────────────────────────────────────────────
    // consolidar=true  → una sola fila con todos los totales sumados
    // consolidar=false → una fila por cada carga (variante Directo)
    const items = consolidar
      ? [
          {
            pieces: totalPieces,
            grossWeight: totalGross,
            chargeableWeight: totalCw,
            volumen: totalVolumen,
            total: totalValor,
            descripcion: descripcionConsolidada || firstCoord.tipoCarga || '',
            pesoUnidad: 'Kg',
            weightKgLb: 'Kg',
            tarimas: 0,
            cajas: 0,
            dimensiones: '',
          },
        ]
      : todasLasCargas.map((c) => {
          const desc = c.descripcionCarga || '';
          const bultos = Number(c.bultos) || '';
          const largo = Number(c.largo) || '';
          const ancho = Number(c.ancho) || '';
          const alto = Number(c.alto) || '';
          const hasDims = largo || ancho || alto;
          const dimsLine = hasDims
            ? `DIMS ${bultos} ${largo} x ${ancho} x ${alto} CM`.trim()
            : null;
          const fullDesc = dimsLine ? `${desc}\n${dimsLine}` : desc;
          return {
            pieces: Number(c.bultos) || 0,
            grossWeight: Number(c.peso) || 0,
            chargeableWeight: Number(c.cw) || 0,
            volumen: Number(c.volumen) || 0,
            total: Number(c.valor) || 0,
            descripcion: fullDesc,
            pesoUnidad: 'Kg',
            weightKgLb: 'Kg',
            tarimas: 0,
            cajas: 0,
            dimensiones: '',
          };
        });

    return {
      isDraft: false,
      codFile: firstCoord.cod_file ?? firstCoord.codFile ?? '',
      referenceNumber: firstCoord.cod_file ?? firstCoord.codFile ?? '',

      // Guías
      guiaHouse: firstCoord.correlativoGuia ?? '',
      hawbNumber: firstCoord.correlativoGuia ?? '',
      guiaMaster: mawb,
      mawbNumber: mawb,
      correlativoGuiaMaster: mawb,
      guiaAsignada: firstCoord.correlativoGuia ?? '',

      // Shipper / exportador
      exportador: 'CROPA S.A.',
      shipperName: 'CROPA S.A.',
      shipperAddress: firstCoord.shipperAddress ?? '3a CALLE 6-70 ZONA 13, ZIP CODE: 01013\nGUATEMALA, C.A.',
      shipperPhone: firstCoord.shipperPhone ?? '(502) 22590600',
      shipperEmail: firstCoord.shipperEmail ?? 'aeropuerto@cropa.com.gt',
      shipperNit: '',
      shipperAccount: '',

      // Consignatario — nombre y dirección desde entidad_id_estacion (DSV)
      consignatario: estacionEntidad?.entidad_nombre ?? firstCoord.entidadConsignatarioNombre ?? '',
      consigneeName: estacionEntidad?.entidad_nombre ?? firstCoord.entidadConsignatarioNombre ?? '',
      consigneeAddress: estacionDireccion?.direccion ?? '',
      consigneePhone: '',
      consigneeAccount: '',
      nitCliente: '',
      nitFactura: '',

      // Origen / destino
      paisOrigen: firstCoord.paisOrigen ?? '',
      paisDestino: firstCoord.paisDestino ?? '',
      origenGuatemala: String(firstCoord.paisOrigen ?? '').toLowerCase().includes('guatemala'),
      origenImportado: String(firstCoord.paisOrigen ?? '').toLowerCase().includes('guatemala') === false,

      // Carga
      incoterm: firstCoord.incoterm ?? '',
      tipoCarga: firstCoord.tipoCarga ?? '',
      tipoDescripcionCarga: firstCoord.tipoCarga ?? '',
      clasificacionCarga: '',
      cargaGeneral: true,
      cargaPeligrosa: false,
      peligrosidadSi: false,
      peligrosidadNo: true,

      // Totales de cabecera
      cantidadBultos: totalPieces > 0 ? String(totalPieces) : '',
      pesoBruto: totalGross,
      pesoNeto: 0,
      tarimas: 0,
      cajas: 0,

      // Descripción consolidada (campos de texto simple fuera de la tabla)
      descripcionProducto: descripcionConsolidada || firstCoord.tipoCarga || '',

      // Observaciones / handling: todas las coordinaciones con observaciones, una por fila.
      handlingInformation: handlingNotas || firstCoord.observaciones || '',
      instruccionesManejo: handlingNotas || firstCoord.observaciones || '',

      // ── Cargos — agregados de todas las coordinaciones ────────────────────
      ...(() => {
        const todasLasGastos = gastosQueries.flatMap((q) => q.data ?? []);

        // A/F de la primera coordinación: define la tasa y el tipo de pago del flete
        const primerasGastos = gastosQueries[0]?.data ?? [];
        const afGasto = primerasGastos.find(
          (g) => Number(g.cod_rubro ?? g.COD_RUBRO) === 11,
        );
        const afTipoPagoCodigo = afGasto
          ? (Number(afGasto.cod_tipo_pago ?? afGasto.COD_TIPO_PAGO ?? null) || null)
          : null;

        // Tipo de pago general: desde A/F gasto o desde el campo tipoPago de la coord
        const tipoPagoLabel = (() => {
          if (afTipoPagoCodigo) return resolveTipoPagoLabel(afTipoPagoCodigo);
          const rawId =
            firstCoord.tipoPago ??
            firstCoord.tipo_id_pago ??
            firstCoord.TIPO_ID_PAGO;
          return resolveTipoPagoLabel(rawId);
        })();

        // IVA (cod_rubro=133): sumar venta de todas las coordinaciones
        const ivaGastos = todasLasGastos.filter(
          (g) => Number(g.cod_rubro ?? g.COD_RUBRO) === 133,
        );
        const taxTotal = ivaGastos.reduce(
          (s, g) => s + (Number(g.venta_rubro ?? g.VENTA_RUBRO ?? 0) || 0),
          0,
        );
        const firstIva = ivaGastos[0];
        const taxTipoPago = firstIva
          ? resolveTipoPagoLabel(firstIva.cod_tipo_pago ?? firstIva.COD_TIPO_PAGO)
          : '';

        // Other charges: todos los gastos que no son A/F ni IVA, de todas las coords
        // Agregados por (siglas, isDueAgent, isDueCarrier, tipoPago)
        const gastosMap = new Map();
        for (const item of todasLasGastos) {
          const siglas = String(
            item.servicio_siglas ?? item.SERVICIO_SIGLAS ?? item.siglas ?? '',
          ).trim();
          const siglasUp = siglas.toUpperCase();
          const codRubro = Number(item.cod_rubro ?? item.COD_RUBRO);
          // Excluir A/F y IVA; excluir sin siglas
          if (siglasUp === 'A/F' || codRubro === 11 || codRubro === 133 || siglas === '') continue;
          const venta = Number(item.venta_rubro ?? item.VENTA_RUBRO ?? item.venta ?? item.valor ?? 0) || 0;
          const rawEnt = item.entidad_id ?? item.ENTIDAD_ID ?? null;
          const entidadId = rawEnt !== null && rawEnt !== '' ? Number(rawEnt) : null;
          const codTP = item.cod_tipo_pago ?? item.COD_TIPO_PAGO ?? null;
          const tp = resolveTipoPagoLabel(codTP);
          const isDueAgent = entidadId === DUE_AGENT_ENTIDAD_ID;
          const isDueCarrier = entidadId !== null && entidadId !== DUE_AGENT_ENTIDAD_ID;
          const key = `${codRubro}|${isDueAgent}|${isDueCarrier}|${tp}`;
          if (gastosMap.has(key)) {
            gastosMap.get(key).venta += venta;
          } else {
            gastosMap.set(key, { siglas, venta, isDueAgent, isDueCarrier, tipoPago: tp });
          }
        }

        const afRateCosto = afGasto
          ? (Number(afGasto.rate_costo ?? afGasto.RATE_COSTO) || null)
          : null;

        return {
          chgsPPD: tipoPagoLabel.includes('PREPAID') || undefined,
          chgsCOLL: tipoPagoLabel.includes('COLLECT') || undefined,
          wtValPPD: tipoPagoLabel.includes('PREPAID') || undefined,
          wtValCOLL: tipoPagoLabel.includes('COLLECT') || undefined,
          afTipoPagoCodigo: afTipoPagoCodigo ?? undefined,
          afRateCosto: afRateCosto ?? undefined,
          tax: taxTotal > 0 ? taxTotal : undefined,
          taxTipoPago: taxTipoPago || undefined,
          gastosParaPdf: [...gastosMap.values()].filter(
            (g) => (includeDueAgent || !g.isDueAgent) && (includeDueCarrier || !g.isDueCarrier),
          ),
        };
      })(),

      // Tabla: una sola fila
      items,

      // Formato — rutas construidas desde los legs de la primera coordinación
      rutas: legs.map((r) => {
        const codOrigen = Number(r.puertoIdOrigen ?? '');
        const codDestino = Number(r.puertoIdDestino ?? '');
        const peOrigen = puntoEnlaceMap.get(codOrigen);
        const peDestino = puntoEnlaceMap.get(codDestino);
        return {
          origenCodigo: peOrigen?.codigo || (codOrigen ? String(codOrigen) : ''),
          destinoCodigo: peDestino?.codigo || (codDestino ? String(codDestino) : ''),
          origenNombre: peOrigen?.nombre || r.puntoenlaceNombreOrigen || '',
          destinoNombre: peDestino?.nombre || r.puntoenlaceNombreDestino || r.puntoenlace_nombree_destino || '',
          entidadNombreProv: r.entidadNombreProv || '',
          flightNumber: r.flightNumber || '',
        };
      }),
      transportMode: 'aereo',
      horizontal: false,
      tamano: 'a4',
      lang: 'es',
      cencod_nombre: '',
      hideAirwayBillGuias: true,
    };
  }, [coordinacionesSeleccionadas, cargasQueries, gastosQueries, mawb, legs, puntoEnlaceMap, estacionEntidades, estacionDirecciones, consolidar, includeDueAgent, includeDueCarrier]);

  // ── Generación del PDF ───────────────────────────────────────────────────────
  const handleDownloadPdf = useCallback(async (options = {}) => {
    setIsGeneratingPdf(true);

    const previewTab = window.open('about:blank', '_blank');
    if (previewTab) {
      previewTab.document.title = 'Generando Manifiesto...';
      previewTab.document.body.innerHTML =
        "<p style='font-family: Arial, sans-serif; padding: 16px;'>Generando PDF...</p>";
    }

    try {
      const payload = buildPdfPayload();
      if (Array.isArray(options.copias) && options.copias.length > 0) {
        payload.copias = options.copias;
      }
      const pdfBlob = generarPdf(payload, false, 'blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (previewTab) {
        previewTab.location.replace(pdfUrl);
      } else {
        window.open(pdfUrl, '_blank');
      }

      setTimeout(() => {
        try { URL.revokeObjectURL(pdfUrl); } catch (e) { console.error(e) }
      }, 10_000);
    } catch (err) {
      if (previewTab) previewTab.close();
      console.error('Error al generar manifiesto consolidado:', err);
      alert('Ocurrió un error al generar el manifiesto.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [buildPdfPayload]);

  // ── Build args for generarManifiesto.js (one row per coordinación) ──────────
  const buildManifiestoArgs = useCallback(() => {
    const firstCoord = coordinacionesSeleccionadas[0] ?? {};
    const estacionEntidad = estacionEntidades[0];
    const estacionDireccion = estacionDirecciones[0];

    const handlingNotas = coordinacionesSeleccionadas
      .map((coord) => {
        const obs = String(coord.observaciones ?? coord.observacion ?? '').trim();
        if (!obs) return null;
        const label = coord.correlativoGuia ?? coord.cod_file ?? coord.codFile ?? '';
        return label ? `${label}: ${obs}` : obs;
      })
      .filter(Boolean)
      .join('\n');

    const registros = coordinacionesSeleccionadas.map((coord, i) => {
      const cargas = cargasQueries[i]?.data ?? [];
      const totalBultos = cargas.reduce((s, c) => s + (Number(c.bultos) || 0), 0);
      const totalRepeso = cargas.reduce((s, c) => s + (Number(c.repeso) || 0), 0);

      const shipperName = coord.entidadShipperNombre ?? coord.entidad_shipper_nombre ?? '';
      const consignName = coord.entidadConsignatarioNombre ?? coord.entidad_consig_nombre ?? '';
      const shipperDir = shipperDirQueries[i]?.data ?? '';
      const consignDir = consignDirQueries[i]?.data ?? '';

      const descripcion = cargas
        .map((c) => {
          const desc = c.descripcionCarga;
          if (!desc) return null;
          const bultosCarga = Number(c.bultos) || '';
          const largo = Number(c.largo) || '';
          const ancho = Number(c.ancho) || '';
          const alto = Number(c.alto) || '';
          const hasDims = largo || ancho || alto;
          const dimsLine = hasDims ? `DIMS ${bultosCarga} ${largo} x ${ancho} x ${alto} CM`.trim() : null;
          return dimsLine ? `${desc}\n${dimsLine}` : desc;
        })
        .filter(Boolean)
        .join('\n\n');

      const tipoPagoCod = Number(coord.tipo_id_pago ?? coord.tipoPago ?? 0);
      const tipoPagoNom = tiposPagoMap.get(tipoPagoCod) ?? resolvePagoAbrev(coord.tipo_id_pago ?? coord.tipoPago);

      return {
        cartaPorte: coord.correlativoGuia ?? coord.correlativo_guia ?? '',
        bultos: totalBultos || '',
        descripcion,
        peso: totalRepeso || '',
        tipoPago: tipoPagoNom,
        shipper: shipperName,
        shipperDireccion: shipperDir,
        consignee: consignName,
        consigneeDireccion: consignDir,
      };
    });

    const primerLeg = legs[0] ?? {};
    const encabezado = {
      paisOrigen: firstCoord.paisOrigen ?? '',
      paisDestino: firstCoord.paisDestino ?? '',
      nomTipo: '',
      shipper: firstCoord.entidadShipperNombre ?? firstCoord.entidad_shipper_nombre ?? 'CROPA S.A.',
      shipperDireccion: shipperDirQueries[0]?.data ?? '',
      consignatario: estacionEntidad?.entidad_nombre ?? firstCoord.entidadConsignatarioNombre ?? '',
      consignatarioDireccion: estacionDireccion?.direccion ?? '',
      observaciones: handlingNotas || firstCoord.observaciones || '',
      horizontal: false,
      tamano: 'a4',
      transportista: primerLeg.entidadNombreProv ?? '',
      viajeNo: primerLeg.flightNumber ?? '',
      manifiestoNo: mawb,
      fechaSalida: primerLeg.fecha_salida ?? primerLeg.fechaSalida ?? '',
    };

    return { encabezado, registros };
  }, [coordinacionesSeleccionadas, cargasQueries, shipperDirQueries, consignDirQueries, estacionEntidades, estacionDirecciones, tiposPagoMap, legs, mawb]);

  // ── Generación del Manifiesto con generarManifiesto.js ───────────────────────
  const handleDownloadManifestoPdf = useCallback(async () => {
    setIsGeneratingPdf(true);

    const previewTab = window.open('about:blank', '_blank');
    if (previewTab) {
      previewTab.document.title = 'Generando Manifiesto...';
      previewTab.document.body.innerHTML =
        "<p style='font-family: Arial, sans-serif; padding: 16px;'>Generando PDF...</p>";
    }

    try {
      const { encabezado, registros } = buildManifiestoArgs();
      const pdfBlob = await generarManifiestoPDF(encabezado, registros);
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (previewTab) {
        previewTab.location.replace(pdfUrl);
      } else {
        window.open(pdfUrl, '_blank');
      }

      setTimeout(() => {
        try { URL.revokeObjectURL(pdfUrl); } catch (e) { console.error(e); }
      }, 10_000);
    } catch (err) {
      if (previewTab) previewTab.close();
      console.error('Error al generar manifiesto:', err);
      alert('Ocurrió un error al generar el manifiesto.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [buildManifiestoArgs]);

  return { isGeneratingPdf, handleDownloadPdf, handleDownloadManifestoPdf, allCargasLoaded };
}
