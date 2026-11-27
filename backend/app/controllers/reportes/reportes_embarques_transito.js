const dayjs = require("dayjs");

/**
 * Reportes de embarques con consulta fija en Oracle. Parámetros opcionales: `cod_cliente`
 * (ENTIDAD_ID de Azure; sin él, el cliente 1843) y `fecha_inicio` / `fecha_fin` (ETD):
 * - EMB-EFCLTGT-01 Embarques FCL en tránsito GT: coordinaciones FCL de importación sin ATA, con
 *   contenedor, booking, orden de compra, POD, nave y fechas ETD / ATD / ETA.
 * - EMB-ENAHK-02 Embarques no asignados a HK: coordinaciones de importación (producto 13) sin
 *   coordinación relacionada, con documento de embarque, proveedor, orden de compra y fechas.
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
  const resultado = await oracleClient('CROPA.COORDINACION as CO')
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
  .leftJoin('CROPA.COORDINACION_SEGUIMIENTO as CS', function () {
    this.on('CO.EMP_CODIGO', '=', 'CS.EMP_CODIGO')
      .andOn('CO.DEPORG_CODIGO', '=', 'CS.DEPORG_CODIGO')
      .andOn('CO.COORD_CODIGO', '=', 'CS.COORD_CODIGO')
      .andOn('CO.SEGUIMIENTO', '=', 'CS.SEGUIMIENTO');
  })
  */
  .leftJoin('CROPA.COORDINACION_CONTENEDOR as CC', function () {
    this.on('CC.EMP_CODIGO', '=', 'CO.EMP_CODIGO')
      .andOn('CC.DEPORG_CODIGO', '=', 'CO.DEPORG_CODIGO')
      .andOn('CC.SEGUIMIENTO', '=', 'CO.SEGUIMIENTO')
      .andOn('CC.COORD_CODIGO', '=', 'CO.COORD_CODIGO');
  })
  .leftJoin('CROPA.PAIS_FILE as PF', 'CO.PAISFIL_CODIGO_COORD', 'PF.PAISFIL_CODIGO')
  .leftJoin('CROPA.COORDINACION_TRASBORDO as CT', function () {
    this.on('CO.EMP_CODIGO', '=', 'CT.EMP_CODIGO')
      .andOn('CO.DEPORG_CODIGO', '=', 'CT.DEPORG_CODIGO')
      .andOn('CO.COORD_CODIGO', '=', 'CT.COORD_CODIGO')
      .andOn('CO.SEGUIMIENTO', '=', 'CT.SEGUIMIENTO');
  })
  .leftJoin('CROPA.MASTER as MA', function () {
    this.on('MA.EMP_CODIGO', '=', 'CO.EMP_CODIGO')
      .andOn('MA.DEPORG_CODIGO', '=', 'CO.DEPORG_CODIGO')
      .andOnVal('MA.MAST_ESTADO', '<>', 99)
      .andOn(oracleClient.raw('TRIM(MA.MASTMAN) = TRIM(CO.COORD_MAWORI)'));
  })
  .leftJoin('CROPA.GUIA as GU', function () {
    this.on('GU.EMP_CODIGO', '=', 'MA.EMP_CODIGO')
      .andOn('GU.DEPORG_CODIGO', '=', 'MA.DEPORG_CODIGO')
      .andOn('GU.TIPDOC_CODIGO', '=', 'MA.TIPDOC_CODIGO')
      .andOn('GU.MASTANIO', '=', 'MA.MASTANIO')
      .andOn('GU.MASTCORR', '=', 'MA.MASTCORR');
  })
  .leftJoin('CROPA.MASTREGCONT as MT', function () {
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
  const filas = await oracleClient('CROPA.COORDINACION as CO')
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
