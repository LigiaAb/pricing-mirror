/**
 * BACKEND (no es código del espejo; no sale en los diff/).
 *
 * report_icc: detalle (una fila por actividad) para el Índice de Cumplimiento Comercial
 * (ICC) en los reportes del CRM. Cada actividad sale YA CLASIFICADA (banderas 0/1 de abajo): el
 * front solo suma las banderas por persona (o por lo que se agrupe) y saca los porcentajes.
 *
 * Cómo instalarlo:
 *  1. Copiar desde "INICIO" hasta "FIN" al final del mismo archivo donde está
 *     `module.exports.report_kpi_cotizaciones` (usa el mismo `azureSqlClient`).
 *  2. Registrar la ruta `/api/appweb/report-icc` igual que `report_kpi_cotizaciones`
 *     (GET, parámetros por query string).
 *  3. Índices en la base (sin ellos la consulta recorre las tablas completas y tarda):
 *       CREATE INDEX IX_ACTIVIDAD_RESULTADO_ACTIVIDAD_ID ON ACTIVIDAD_RESULTADO (ACTIVIDAD_ID);
 *       CREATE INDEX IX_ACTIVIDAD_FECHA_PROGRAMACION ON ACTIVIDAD (ACTIVIDAD_FECHA_PROGRAMACION);
 *
 * Filas: actividades cuyo tipo (TIPO.TIPO_DESCRIPCION de ACTIVIDAD.TIPO_ID) está en
 * TIPOS_ICC —por nombre, no por código— y cuya fecha programada cae en el rango.
 *
 * La fecha programada es la que ubica la actividad en el rango.
 *
 * Banderas por actividad (definiciones del usuario, #194; los días se cuentan con DATEDIFF(DAY)
 * sobre las fechas como están en la base; las anuladas, ESTADO_DESCRIPCION = 'ANULADO', valen 0
 * en todas menos FINALIZADA y CON_RESULTADO):
 *  - CON_RESULTADO           = 1 si tiene al menos una fila en ACTIVIDAD_RESULTADO. Se une con
 *                              DISTINCT ACTIVIDAD_ID (R): una actividad puede tener varios
 *                              resultados y un JOIN directo la duplicaría.
 *  - FINALIZADA              = 1 si ACTIVIDAD.ESTADO_ID es el estado finalizado (24) = realizada.
 *  - EN_TOTAL                = 1 si no está anulada (divisor del ICCc).
 *  - PROGRAMADA              = programada después del día en que se creó.
 *  - PROGRAMADA_REALIZADA    = PROGRAMADA y FINALIZADA.
 *  - NO_PROGRAMADA           = programada el mismo día de creación o hasta 15 días antes (más de
 *                              15 días antes no es ni una ni otra).
 *  - NO_PROGRAMADA_REALIZADA = NO_PROGRAMADA y FINALIZADA.
 *  - SIN_RESULTADO           = FINALIZADA y sin resultado.
 *  - VENCIDA                 = no finalizada, sin resultado y con más de 7 días desde el día
 *                              programado hasta hoy (si es sábado, tiene hasta el sábado
 *                              siguiente; el domingo ya está vencida).
 *
 * Fechas: ACTIVIDAD_FECHA y ACTIVIDAD_FECHA_PROGRAMACION son datetime. El rango se filtra igual
 * que report_kpi_cotizaciones (Hit Rate): desde CONVERT(date, fecha_inicio, 23) hasta antes del
 * día siguiente a fecha_fin. Las dos fechas se toman como hora de Guatemala (sin restar horas);
 * pendiente revisar en el CRM y en la API cómo se guarda cada una. "Hoy" (VENCIDA) sí se pasa a
 * hora de Guatemala: GETDATE() en Azure SQL da la hora UTC.
 */

// ── INICIO ───────────────────────────────────────────────────────────────────

/** Tipos de actividad que entran al ICC, por TIPO_DESCRIPCION. */
const TIPOS_ICC = ["LLAMADA", "VISITA"];

/** ESTADO_ID de actividad finalizada (el mismo que usa el front al crear actividades). */
const ESTADO_ACTIVIDAD_FINALIZADA = 24;

/** Horas que la hora de Guatemala (UTC-6) va detrás de UTC: para sacar "hoy" en VENCIDA. */
const HORAS_UTC_LOCAL = 6;

/** Días que puede estar programada antes de crearse para contar como no programada. */
const MAX_DIAS_ATRAS_NO_PROGRAMADA = 15;

/** Días que tiene una actividad abierta para registrar su resultado. */
const DIAS_PARA_VENCER = 7;

/** Condiciones de las banderas (sin parámetros del usuario: solo constantes de este archivo). */
const NO_ANULADA = "UPPER(LTRIM(RTRIM(ISNULL(E.ESTADO_DESCRIPCION, '')))) <> 'ANULADO'";
const FINALIZADA = `A.ESTADO_ID = ${ESTADO_ACTIVIDAD_FINALIZADA}`;
/** R = actividades con resultado (leftJoin en consultaIcc): ACTIVIDAD_RESULTADO se lee una vez. */
const SIN_RESULTADO = "R.ACTIVIDAD_ID IS NULL";
/** Días de la creación a la programación (NULL si falta una fecha: la bandera queda en 0). */
const DIAS_CREACION_A_PROGRAMACION =
  "DATEDIFF(DAY, A.ACTIVIDAD_FECHA, A.ACTIVIDAD_FECHA_PROGRAMACION)";
const PROGRAMADA = `${DIAS_CREACION_A_PROGRAMACION} >= 1`;
const NO_PROGRAMADA = `${DIAS_CREACION_A_PROGRAMACION} BETWEEN -${MAX_DIAS_ATRAS_NO_PROGRAMADA} AND 0`;
const VENCIDA = `ISNULL(A.ESTADO_ID, 0) <> ${ESTADO_ACTIVIDAD_FINALIZADA} AND ${SIN_RESULTADO} AND DATEDIFF(DAY, A.ACTIVIDAD_FECHA_PROGRAMACION, DATEADD(HOUR, -${HORAS_UTC_LOCAL}, GETUTCDATE())) > ${DIAS_PARA_VENCER}`;

/** `CASE WHEN <condiciones> THEN 1 ELSE 0 END AS <nombre>`. */
const bandera = (nombre, ...condiciones) =>
  azureSqlClient.raw(`CASE WHEN ${condiciones.join(" AND ")} THEN 1 ELSE 0 END AS ${nombre}`);

const validarCamposIcc = (campos) => {
  if (!campos?.fecha_inicio || !campos?.fecha_fin)
    return { success: false, cod_mensaje: 1043, mensaje: "faltan parametros requeridos, verifique" };

  const fechasValidas = [campos.fecha_inicio, campos.fecha_fin].every((fecha) => {
    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
    const date = new Date(`${fecha}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === fecha;
  });

  if (!fechasValidas || campos.fecha_inicio > campos.fecha_fin)
    return {
      success: false,
      cod_mensaje: 1043,
      mensaje:
        "verifique las fechas: formato YYYY-MM-DD y fecha inicio menor o igual a fecha fin",
    };

  return null;
};

const consultaIcc = (campos) => {
  // Un nombre por usuario: USUARIO_EMPLEADO_PUESTO puede tener varios registros por usuario
  const empleado = azureSqlClient({ UEP: "USUARIO_EMPLEADO_PUESTO" })
    .join({ EM: "EMPLEADO" }, "EM.EMPLEADO_ID", "UEP.EMPLEADO_ID")
    .select("UEP.USUARIO_ID")
    .max({ NOMBRES: "EM.EMPLEADO_NOMBRES" })
    .max({ APELLIDOS: "EM.EMPLEADO_APELLIDOS" })
    .groupBy("UEP.USUARIO_ID")
    .as("EMP");

  // Actividades con al menos un resultado (una fila por actividad)
  const conResultado = azureSqlClient("ACTIVIDAD_RESULTADO").distinct("ACTIVIDAD_ID").as("R");

  const consulta = azureSqlClient({ A: "ACTIVIDAD" })
    .join({ T: "TIPO" }, "T.TIPO_ID", "A.TIPO_ID")
    .leftJoin(empleado, "EMP.USUARIO_ID", "A.USUARIO_ID")
    .leftJoin(conResultado, "R.ACTIVIDAD_ID", "A.ACTIVIDAD_ID")
    .leftJoin({ CEN: "CENTRO_COSTO" }, "CEN.CENCOS_ID", "A.CENCOS_ID")
    .leftJoin({ C: "ENTIDAD" }, "C.ENTIDAD_ID", "A.ENTIDAD_ID")
    .leftJoin({ E: "ESTADO" }, "A.ESTADO_ID", "E.ESTADO_ID")
    .whereIn("T.TIPO_DESCRIPCION", TIPOS_ICC)
    .whereNotNull("A.USUARIO_ID")
    .whereRaw(
      "(A.ACTIVIDAD_FECHA_PROGRAMACION >= CONVERT(date, ?, 23) AND A.ACTIVIDAD_FECHA_PROGRAMACION < DATEADD(DAY, 1, CONVERT(date, ?, 23)))",
      [campos.fecha_inicio, campos.fecha_fin],
    )
    .select(
      "A.ACTIVIDAD_ID AS ACTIVIDAD",
      "A.ACTIVIDAD_ASUNTO AS ASUNTO",
      "A.ACTIVIDAD_FECHA AS FECHA_CREACION",
      "A.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMACION",
      "T.TIPO_DESCRIPCION AS TIPO",
      "A.USUARIO_ID AS USUARIO",
      "EMP.NOMBRES AS NOMBRES",
      "EMP.APELLIDOS AS APELLIDOS",
      "A.EMPRESA_ID AS COD_EMPRESA",
      "A.CENCOS_ID AS CC",
      "CEN.CENCOD_NOMBRE AS CC_NOMBRE",
      "A.ENTIDAD_ID AS COD_CLIENTE",
      "C.ENTIDAD_NOMBRE AS CLIENTE",
      "A.ESTADO_ID AS COD_ESTADO",
      "E.ESTADO_DESCRIPCION AS ESTADO",
    )
    .select(
      azureSqlClient.raw("CONCAT(EMP.NOMBRES, ' ', EMP.APELLIDOS) AS NOMBRE"),
      azureSqlClient.raw(
        "CASE WHEN R.ACTIVIDAD_ID IS NOT NULL THEN 1 ELSE 0 END AS CON_RESULTADO",
      ),
      azureSqlClient.raw("CASE WHEN A.ESTADO_ID = ? THEN 1 ELSE 0 END AS FINALIZADA", [
        ESTADO_ACTIVIDAD_FINALIZADA,
      ]),
      bandera("EN_TOTAL", NO_ANULADA),
      bandera("PROGRAMADA", NO_ANULADA, PROGRAMADA),
      bandera("PROGRAMADA_REALIZADA", NO_ANULADA, PROGRAMADA, FINALIZADA),
      bandera("NO_PROGRAMADA", NO_ANULADA, NO_PROGRAMADA),
      bandera("NO_PROGRAMADA_REALIZADA", NO_ANULADA, NO_PROGRAMADA, FINALIZADA),
      bandera("SIN_RESULTADO", NO_ANULADA, FINALIZADA, SIN_RESULTADO),
      bandera("VENCIDA", NO_ANULADA, VENCIDA),
    );

  const tiene = (campo) => campos[campo] != null && campos[campo] !== "";
  if (tiene("cod_empresa")) consulta.where("A.EMPRESA_ID", `${campos.cod_empresa}`);
  if (tiene("cod_cc")) consulta.where("A.CENCOS_ID", `${campos.cod_cc}`);
  if (tiene("cod_usuario")) consulta.where("A.USUARIO_ID", `${campos.cod_usuario}`);

  return consulta;
};

module.exports.report_icc = async (campos) => {
  const error = validarCamposIcc(campos);
  if (error) return error;

  try {
    // Arreglo directo (sin `filas`): el sobre queda { status, message, length, data: [...] }
    return await consultaIcc(campos);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// ── FIN ──────────────────────────────────────────────────────────────────────
