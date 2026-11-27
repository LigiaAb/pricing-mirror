const dayjs = require("dayjs");

/**
 * Reportes de embarques con consulta fija en Oracle. Parámetros opcionales: `cod_cliente`
 * (ENTIDAD_ID de Azure; sin él, el cliente 1843) y `fecha_inicio` / `fecha_fin` (ETD):
 * - EMB-EFCLTGT-01 Embarques FCL en tránsito GT: coordinaciones FCL de importación sin ATA, con
 *   contenedor, booking, orden de compra, POD, nave y fechas ETD / ATD / ETA.
 * - EMB-ENAHK-02 Embarques no asignados a HK: coordinaciones de importación (producto 13) sin
 *   coordinación relacionada, con documento de embarque, proveedor, orden de compra y fechas.
 * - EMB-DE-03 Detalle de embarque: solo `coord_codigo` (al final del archivo).
 */

/** Columnas fecha de la consulta. */
const FECHAS = ["ETD", "ATD", "ETA"];

/** Columnas fecha de EMB-ENAHK-02. */
const FECHAS_NO_ASIGNADOS_HK = ["ETD", "ATD", "ETA", "ATA"];

/** VICLI_CODIGO cuando no viene cliente en el filtro. */
const CLIENTE_POR_DEFECTO = "1843";

/**
 * ENTIDAD_ID de Azure (`cod_cliente` del filtro) → código del cliente en Oracle (COD_CROPA,
 * identificación 12 de ENTIDAD_IDENTIFICACION); sin cliente, `CLIENTE_POR_DEFECTO`.
 */
const codigoClienteOracle = async (codCliente) => {
  if (!codCliente) return CLIENTE_POR_DEFECTO;
  const fila = await azureSqlClient('ENTIDAD_IDENTIFICACION')
    .where('ENTIDAD_ID', codCliente)
    .where('IDENTIFICACION_ID', 12) // COD_CROPA
    .first('ENTIDADIDENTIFICACIO_NUMERO as COD_CROPA');
  const codigo = String(fila?.COD_CROPA ?? '').trim();
  if (!codigo) throw new Error('No se ha podido localizar el cliente');
  return codigo;
};

/** Fecha del filtro: `YYYY-MM-DD` o vacía; otra cosa → error. */
const fechaFiltro = (valor) => {
  if (!valor) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) throw new Error(`Fecha inválida: ${valor}`);
  return valor;
};

/**
 * Período del filtro sobre la ETD (`.modify(filtrarPorEtd, campos)`): desde el día inicial y
 * antes del día siguiente al final (incluye todo el último día); cada una es opcional.
 */
function filtrarPorEtd(consulta, campos) {
  const inicio = fechaFiltro(campos?.fecha_inicio);
  const fin = fechaFiltro(campos?.fecha_fin);
  if (inicio) consulta.where('CO.COORD_ETD', '>=', oracleClient.raw("TO_DATE(?, 'YYYY-MM-DD')", [inicio]));
  if (fin) consulta.where('CO.COORD_ETD', '<', oracleClient.raw("TO_DATE(?, 'YYYY-MM-DD') + 1", [fin]));
}

/**
 * DATE de Oracle → texto `YYYY-MM-DDTHH:mm:ss` con la misma hora que leyó el driver, sin pasarla
 * a UTC (con `Date` el JSON la mandaría con "Z" y el navegador la correría).
 */
const textoFecha = (valor) =>
  valor instanceof Date ? dayjs(valor).format("YYYY-MM-DDTHH:mm:ss") : (valor ?? null);

/** Consulta el reporte en Oracle y devuelve sus filas, con las fechas como texto local. */
const consultarEmbFclTransitoGt = async (campos) => {
  const cliente = await codigoClienteOracle(campos?.cod_cliente);
  const resultado = await oracleClient('COORDINACION as CO')
  // .withSchema('CROPA')
  .select([
    'CO.COORD_CODIGO as COORDINACION',
    oracleClient.raw('TRIM(CC.coordcont_numcont) AS NUMERO_CONTENEDOR'),
    oracleClient.raw('TRIM(CO.BOOKING) AS BOOKING'),
    oracleClient.raw('TRIM(CO.COORD_OCOMPRA) AS ORDEN_COMPRA'),
    // oracleClient.raw('TRIM(CO.PAISFIL_CODIGO_COORD) AS POD'),
    'PF.PAISFIL_NOMBRE as POD',
    oracleClient.raw('TRIM(CO.NAVE) AS TRANSBORDO_NAVE'),
    'CO.COORD_ETD as ETD',
    'CO.COORD_ATD as ATD',
    'CO.COORD_ETA as ETA',
  ])
  /*
  .leftJoin('COORDINACION_SEGUIMIENTO as CS', function () {
    this.on('CO.EMP_CODIGO', '=', 'CS.EMP_CODIGO')
      .andOn('CO.DEPORG_CODIGO', '=', 'CS.DEPORG_CODIGO')
      .andOn('CO.COORD_CODIGO', '=', 'CS.COORD_CODIGO')
      .andOn('CO.SEGUIMIENTO', '=', 'CS.SEGUIMIENTO');
  })
  */
  .leftJoin('COORDINACION_CONTENEDOR as CC', function () {
    this.on('CC.EMP_CODIGO', '=', 'CO.EMP_CODIGO')
      .andOn('CC.DEPORG_CODIGO', '=', 'CO.DEPORG_CODIGO')
      .andOn('CC.SEGUIMIENTO', '=', 'CO.SEGUIMIENTO')
      .andOn('CC.COORD_CODIGO', '=', 'CO.COORD_CODIGO');
  })
  .leftJoin('PAIS_FILE as PF', 'CO.PAISFIL_CODIGO_COORD', 'PF.PAISFIL_CODIGO')
  .leftJoin('COORDINACION_TRASBORDO as CT', function () {
    this.on('CO.EMP_CODIGO', '=', 'CT.EMP_CODIGO')
      .andOn('CO.DEPORG_CODIGO', '=', 'CT.DEPORG_CODIGO')
      .andOn('CO.COORD_CODIGO', '=', 'CT.COORD_CODIGO')
      .andOn('CO.SEGUIMIENTO', '=', 'CT.SEGUIMIENTO');
  })
  .leftJoin('MASTER as MA', function () {
    this.on('MA.EMP_CODIGO', '=', 'CO.EMP_CODIGO')
      .andOn('MA.DEPORG_CODIGO', '=', 'CO.DEPORG_CODIGO')
      .andOnVal('MA.MAST_ESTADO', '<>', 99)
      .andOn(oracleClient.raw('TRIM(MA.MASTMAN) = TRIM(CO.COORD_MAWORI)'));
  })
  .leftJoin('GUIA as GU', function () {
    this.on('GU.EMP_CODIGO', '=', 'MA.EMP_CODIGO')
      .andOn('GU.DEPORG_CODIGO', '=', 'MA.DEPORG_CODIGO')
      .andOn('GU.TIPDOC_CODIGO', '=', 'MA.TIPDOC_CODIGO')
      .andOn('GU.MASTANIO', '=', 'MA.MASTANIO')
      .andOn('GU.MASTCORR', '=', 'MA.MASTCORR');
  })
  .leftJoin('MASTREGCONT as MT', function () {
    this.on('MT.EMP_CODIGO', '=', 'GU.EMP_CODIGO')
      .andOn('MT.DEPORG_CODIGO', '=', 'GU.DEPORG_CODIGO')
      .andOn('MT.TIPDOC_CODIGO', '=', 'GU.TIPDOC_CODIGO')
      .andOn('MT.MASTANIO', '=', 'GU.MASTANIO')
      .andOn('MT.MASTCORR', '=', 'GU.MASTCORR')
      .andOn('MT.GUIACORR', '=', 'GU.GUIACORR');
  })
  .where({
    'CO.EMP_CODIGO': 2,
    'CO.DEPORG_CODIGO': 'IMP',
    'CO.VICLI_CODIGO': cliente,
    'CO.PRODPAN_CODIGO': 7,
  })
  .whereNotIn('CO.COORD_ESTADO', [9, 5, 3, 70])
  .whereNull('CO.COORD_ATA')
  .modify(filtrarPorEtd, campos)
  .orderBy([
    // 'CS.CORRELATIVO',
    'CT.COORD_TRAS_CORR',
    'GU.GUIACORR',
    'MT.MASTRECONUM',
  ]);

  const filas = Array.isArray(resultado) ? resultado : (resultado?.rows ?? []);
  return filas.map((fila) => {
    const copia = { ...fila };
    for (const campo of FECHAS) copia[campo] = textoFecha(copia[campo]);
    return copia;
  });
};

/** EMB-ENAHK-02: consulta en Oracle y devuelve sus filas, con las fechas como texto local. */
const consultarEmbNoAsignadosHk = async (campos) => {
  const cliente = await codigoClienteOracle(campos?.cod_cliente);
  const filas = await oracleClient('COORDINACION as CO')
    .select([
      'CO.COORD_CODIGO as COORDINACION',
      oracleClient.raw('TRIM(CO.COORD_HAWBBLCP) AS DOC_EMBARQUE'),
      'SH.SHIPPER_NOMBRE as PROVEEDOR_ORIGEN',
      oracleClient.raw('TRIM(CO.COORD_OCOMPRA) AS ORDEN_COMPRA'),
      'CO.COORD_ETD as ETD',
      'CO.COORD_ATD as ATD',
      'CO.COORD_ETA as ETA',
      'CO.COORD_ATA as ATA',
    ])
    .leftJoin('SHIPPER as SH', 'CO.COORD_SHIPPER', 'SH.SHIPPER_CODIGO')
    .where({
      'CO.EMP_CODIGO': 2,
      'CO.DEPORG_CODIGO': 'IMP',
      'CO.VICLI_CODIGO': cliente,
      'CO.PRODPAN_CODIGO': 13,
    })
    .whereNull('CO.COORD_REL_CODIGO') // no asignados
    .modify(filtrarPorEtd, campos);

  return filas.map((fila) => {
    const copia = { ...fila };
    for (const campo of FECHAS_NO_ASIGNADOS_HK) copia[campo] = textoFecha(copia[campo]);
    return copia;
  });
};

module.exports.reporte_emb_no_asignados_hk = async (campos) => {
  try {
    return await consultarEmbNoAsignadosHk(campos);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

module.exports.reporte_emb_fcl_transito_gt = async (campos) => {
  try {
    return await consultarEmbFclTransitoGt(campos);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

/**
 * EMB-DE-03: consulta en Oracle la coordinación del filtro (`coord_codigo`, solo dígitos) con
 * sus seguimientos, transbordos, contenedores y subcoordinaciones, y devuelve sus filas con todas
 * las fechas como texto local. Misma consulta que el SQL entregado, con el query builder.
 */
const consultarDetalleEmbarque = async (campos) => {
  const coordinacion = String(campos?.coord_codigo ?? '').trim();
  if (!/^\d+$/.test(coordinacion)) throw new Error('Ingrese un número de coordinación válido');

  const filas = await oracleClient('COORDINACION as CO')
    .select([
      // COORDINACION - EMBARQUE
      'CO.COORD_CODIGO', // CODIGO INTERNO
      oracleClient.raw('TRIM(CO.COORD_CONSIGNATARIO) AS CONSIGNATARIO'),
      oracleClient.raw('TRIM(CO.COORD_HAWBBLCP) AS HOUSE_BL'),
      oracleClient.raw('TRIM(CO.COORD_MAWORI) AS MASTER_BL'),
      oracleClient.raw('TRIM(CO.BOOKING) AS BOOKING'),
      oracleClient.raw('TRIM(CO.COORD_OCOMPRA) AS ORDEN_COMPRA'),
      oracleClient.raw('TRIM(CO.COORD_CARRIER) AS CARRIER'),
      oracleClient.raw('TRIM(CO.NAVE) AS MASTER_BUQUE'),
      oracleClient.raw('TRIM(CO.PAISFIL_CODIGO_COORD) AS PAIS_COORDINACION'), // PAIS DE ORIGEN CODIGO
      oracleClient.raw('TRIM(CO.CIUDFIL_CODIGO_ORI) AS CIUDAD_ORIGEN'),
      oracleClient.raw('TRIM(CO.PUERTO_CODIGO_ORI) AS PUERTO_ORIGEN'),
      oracleClient.raw('TRIM(CO.PAISFIL_CODIGO_DES) AS PAIS_DESTINO'), // PAIS DESTINO CODIGO
      oracleClient.raw('TRIM(CO.CIUDFIL_CODIGO_DES) AS CIUDAD_DESTINO'),
      oracleClient.raw('TRIM(CO.COORD_DESTINO_FINAL) AS PUERTO_DESTINO'),
      'CO.COORD_ETD as ETD', // FECHA ESTIMADA DE SALIDA
      'CO.COORD_ATD as ATD', // FECHA DE SALIDA
      'CO.COORD_ETA as ETA', // FECHA ESTIMADA DE LLEGADA
      'CO.COORD_ATA as ATA', // FECHA DE LLEGADA
      // SEGUIMIENTOS
      'CS.CORRELATIVO as SEGUIMIENTO_CORRELATIVO',
      oracleClient.raw('TRIM(CS.COORD_COMENTARIOS) AS SEGUIMIENTO_COMENTARIO'),
      'CS.COORD_FECCREACION as SEGUIMIENTO_FECHA',
      oracleClient.raw('TRIM(CS.AUSRID) AS SEGUIMIENTO_USUARIO'),
      oracleClient.raw('TRIM(CS.COORD_INSTCONT_TIPO) AS SEGUIMIENTO_TIPO'),
      // TRANSBORDOS
      'CT.COORD_TRAS_CORR as TRANSBORDO_CORRELATIVO',
      'CT.COORD_TRAS_FECHA as TRANSBORDO_FECHA',
      oracleClient.raw('TRIM(CT.NAVE) AS TRANSBORDO_VESSEL'),
      oracleClient.raw('TRIM(CT.CIUDAD_SALIDA) AS TRANSBORDO_CIUDAD_SALIDA'),
      oracleClient.raw('TRIM(CT.VIAJE) AS TRANSBORDO_VIAJE'),
      'CT.COORD_TRAS_ETA as TRANSBORDO_ETA',
      'CT.COORD_TRAS_ATA as TRANSBORDO_ATA',
      'CT.COORD_TRAS_ETD as TRANSBORDO_ETD',
      'CT.COORD_TRAS_ATD as TRANSBORDO_ATD',
      'CT.COORD_ETA', // NUEVA ETA
      'CT.COORD_TRAS_TIPO as TRANSBORDO_ITINERARIO', // ITINERARIO O TRANSBORDO
      // CONTENEDORES
      oracleClient.raw('TRIM(CC.coordcont_numcont) AS NUMERO_CONTENEDOR'),
      // SUBCOORDINACIONES
      'CO2.COORD_CODIGO as COORDINACION',
      oracleClient.raw('TRIM(CO2.COORD_HAWBBLCP) AS DOC_EMBARQUE'),
      'SH.SHIPPER_NOMBRE as PROVEEDOR_ORIGEN',
      oracleClient.raw('TRIM(CO2.COORD_OCOMPRA) AS ORDEN_COMPRA'),
      'CO2.COORD_ETD as ETD',
      'CO2.COORD_ATD as ATD',
      'CO2.COORD_ETA as ETA',
      'CO2.COORD_ATA as ATA',
      'CO2.COORD_REL_CODIGO',
    ])
    .leftJoin('PAIS_FILE as PF', 'CO.COORD_DESTINO_FINAL', 'PF.PAISFIL_CODIGO')
    .leftJoin('PAIS_FILE as PD', 'CO.PAISFIL_CODIGO_DES', 'PF.PAISFIL_CODIGO')
    .leftJoin('COORDINACION_SEGUIMIENTO as CS', function () {
      this.on('CO.EMP_CODIGO', '=', 'CS.EMP_CODIGO')
        .andOn('CO.DEPORG_CODIGO', '=', 'CS.DEPORG_CODIGO')
        .andOn('CO.COORD_CODIGO', '=', 'CS.COORD_CODIGO')
        .andOn('CO.SEGUIMIENTO', '=', 'CS.SEGUIMIENTO');
    })
    .leftJoin('COORDINACION_TRASBORDO as CT', function () {
      this.on('CO.EMP_CODIGO', '=', 'CT.EMP_CODIGO')
        .andOn('CO.DEPORG_CODIGO', '=', 'CT.DEPORG_CODIGO')
        .andOn('CO.COORD_CODIGO', '=', 'CT.COORD_CODIGO')
        .andOn('CO.SEGUIMIENTO', '=', 'CT.SEGUIMIENTO');
    })
    .leftJoin('COORDINACION_CONTENEDOR as CC', function () {
      this.on('CC.EMP_CODIGO', '=', 'CO.EMP_CODIGO')
        .andOn('CC.DEPORG_CODIGO', '=', 'CO.DEPORG_CODIGO')
        .andOn('CC.SEGUIMIENTO', '=', 'CO.SEGUIMIENTO')
        .andOn('CC.COORD_CODIGO', '=', 'CO.COORD_CODIGO');
    })
    .leftJoin('COORDINACION as CO2', 'CO2.COORD_CODIGO', 'CO.COORD_CODIGO')
    .leftJoin('SHIPPER as SH', 'CO.COORD_SHIPPER', 'SH.SHIPPER_CODIGO')
    .where({
      'CO.EMP_CODIGO': 2,
      'CO.DEPORG_CODIGO': 'IMP',
      'CO.COORD_CODIGO': Number(coordinacion),
    })
    .orderBy(['CS.CORRELATIVO', 'CT.COORD_TRAS_CORR']);

  return filas.map((fila) =>
    Object.fromEntries(Object.entries(fila).map(([campo, valor]) => [campo, textoFecha(valor)])),
  );
};

module.exports.reporte_emb_detalle_embarque = async (campos) => {
  try {
    return await consultarDetalleEmbarque(campos);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};
