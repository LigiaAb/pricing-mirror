const dayjs = require("dayjs");

/**
 * EMB-EFCLTGT-01 Embarques FCL en tránsito GT.
 * SQL entregado tal cual (no se modifica). Solo se le quita el `;` final al ejecutarlo:
 * el driver de Oracle no acepta el punto y coma.
 */
const SQL_EMB_FCL_TRANSITO_GT = `
SELECT
  CO.COORD_CODIGO COORDINACION,
  TRIM(cc.coordcont_numcont) AS NUMERO_CONTENEDOR,
  TRIM(CO.BOOKING) AS BOOKING,
  TRIM(CO.COORD_OCOMPRA) AS ORDEN_COMPRA,
  --TRIM(CO.PAISFIL_CODIGO_COORD) AS POD,
  PF.PAISFIL_NOMBRE AS POD,
  TRIM(CO.NAVE) AS TRANSBORDO_NAVE,
  CO.COORD_ETD AS ETD,
  CO.COORD_ATD AS ATD,
  CO.COORD_ETA AS ETA
FROM COORDINACION CO
/*
LEFT JOIN COORDINACION_SEGUIMIENTO CS
    ON CO.EMP_CODIGO = CS.EMP_CODIGO
    AND CO.DEPORG_CODIGO = CS.DEPORG_CODIGO
    AND CO.COORD_CODIGO = CS.COORD_CODIGO
    AND CO.SEGUIMIENTO = CS.SEGUIMIENTO
*/
LEFT JOIN COORDINACION_CONTENEDOR CC
    ON cc.emp_codigo = CO.EMP_CODIGO AND
       cc.deporg_codigo = CO.DEPORG_CODIGO AND
       cc.seguimiento = CO.SEGUIMIENTO AND
       cc.coord_codigo = CO.COORD_CODIGO
LEFT JOIN PAIS_FILE PF
    ON CO.PAISFIL_CODIGO_COORD = PF.PAISFIL_CODIGO
LEFT JOIN COORDINACION_TRASBORDO CT
    ON CO.EMP_CODIGO = CT.EMP_CODIGO
    AND CO.DEPORG_CODIGO = CT.DEPORG_CODIGO
    AND CO.COORD_CODIGO = CT.COORD_CODIGO
    AND CO.SEGUIMIENTO = CT.SEGUIMIENTO
LEFT JOIN MASTER MA
    ON MA.EMP_CODIGO = CO.EMP_CODIGO
    AND MA.DEPORG_CODIGO = CO.DEPORG_CODIGO
    AND MA.MAST_ESTADO <> 99
    AND TRIM(MA.MASTMAN) = TRIM(CO.COORD_MAWORI)
LEFT JOIN GUIA GU
    ON GU.EMP_CODIGO = MA.EMP_CODIGO
    AND GU.DEPORG_CODIGO = MA.DEPORG_CODIGO
    AND GU.TIPDOC_CODIGO = MA.TIPDOC_CODIGO
    AND GU.MASTANIO = MA.MASTANIO
    AND GU.MASTCORR = MA.MASTCORR
LEFT JOIN MASTREGCONT MT
    ON MT.EMP_CODIGO = GU.EMP_CODIGO
    AND MT.DEPORG_CODIGO = GU.DEPORG_CODIGO
    AND MT.TIPDOC_CODIGO = GU.TIPDOC_CODIGO
    AND MT.MASTANIO = GU.MASTANIO
    AND MT.MASTCORR = GU.MASTCORR
    AND MT.GUIACORR = GU.GUIACORR
WHERE CO.EMP_CODIGO = 2
  AND CO.DEPORG_CODIGO = 'IMP'
  AND CO.VICLI_CODIGO = '1843'
  AND CO.COORD_ESTADO NOT IN (9,5,3,70)
  AND co.prodpan_codigo = 7
  AND CO.COORD_ATA IS NULL
ORDER BY
   -- CS.CORRELATIVO,
    CT.COORD_TRAS_CORR,
    GU.GUIACORR,
    MT.MASTRECONUM
`;

/** Columnas fecha del SQL. */
const FECHAS = ["ETD", "ATD", "ETA"];

/**
 * DATE de Oracle → texto `YYYY-MM-DDTHH:mm:ss` con la misma hora que leyó el driver, sin pasarla
 * a UTC (con `Date` el JSON la mandaría con "Z" y el navegador la correría).
 */
const textoFecha = (valor) =>
  valor instanceof Date ? dayjs(valor).format("YYYY-MM-DDTHH:mm:ss") : (valor ?? null);

/** Ejecuta un SQL fijo en Oracle y devuelve sus filas, con las fechas como texto local. */
const consultarSqlOracle = async (sql, fechas = []) => {
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
    for (const campo of fechas) copia[campo] = textoFecha(copia[campo]);
    return copia;
  });
};

module.exports.reporte_emb_fcl_transito_gt = async () => {
  try {
    return await consultarSqlOracle(SQL_EMB_FCL_TRANSITO_GT, FECHAS);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};
