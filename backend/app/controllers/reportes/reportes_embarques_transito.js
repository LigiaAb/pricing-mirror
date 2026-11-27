const dayjs = require("dayjs");

/**
 * EMB-EFCLTGT-01 Embarques FCL en tránsito GT.
 * Consulta fija en Oracle (sin parámetros): coordinaciones FCL de importación del cliente 1843
 * sin ATA, con contenedor, booking, orden de compra, POD, nave y fechas ETD / ATD / ETA.
 */

/** Columnas fecha de la consulta. */
const FECHAS = ["ETD", "ATD", "ETA"];

/**
 * DATE de Oracle → texto `YYYY-MM-DDTHH:mm:ss` con la misma hora que leyó el driver, sin pasarla
 * a UTC (con `Date` el JSON la mandaría con "Z" y el navegador la correría).
 */
const textoFecha = (valor) =>
  valor instanceof Date ? dayjs(valor).format("YYYY-MM-DDTHH:mm:ss") : (valor ?? null);

/** Consulta el reporte en Oracle y devuelve sus filas, con las fechas como texto local. */
const consultarEmbFclTransitoGt = async () => {
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
    'CO.VICLI_CODIGO': '1843',
    'CO.PRODPAN_CODIGO': 7,
  })
  .whereNotIn('CO.COORD_ESTADO', [9, 5, 3, 70])
  .whereNull('CO.COORD_ATA')
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

module.exports.reporte_emb_fcl_transito_gt = async () => {
  try {
    return await consultarEmbFclTransitoGt();
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};
