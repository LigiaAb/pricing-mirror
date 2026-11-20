/**
 * BACKEND (no es código del espejo; no sale en los diff/).
 *
 * report_icc: detalle (una fila por actividad) para el Índice de Cumplimiento Comercial
 * (ICC) en los reportes del CRM. El front agrupa por persona y calcula ICCa / ICCp / ICCc.
 *
 * Cómo instalarlo:
 *  1. Copiar desde "INICIO" hasta "FIN" al final del mismo archivo donde está
 *     `module.exports.report_kpi_cotizaciones` (usa el mismo `azureSqlClient`).
 *  2. Registrar la ruta `/api/appweb/report_icc` igual que `report_kpi_cotizaciones`
 *     (GET, parámetros por query string).
 *
 * Filas: actividades cuyo tipo (TIPO.TIPO_DESCRIPCION de ACTIVIDAD.TIPO_ID) está en
 * TIPOS_ICC —por nombre, no por código— y cuya fecha programada cae en el rango.
 *
 * Banderas por actividad (el front decide cuáles usa; cambiar una definición no toca
 * el backend):
 *  - PROGRAMADA    = 1 si se agendó con anticipación: fecha programada (día) posterior al
 *                    día de creación (ACTIVIDAD_FECHA). 0 = registrada el mismo día o después.
 *  - CON_RESULTADO = 1 si tiene al menos una fila en ACTIVIDAD_RESULTADO. Se usa EXISTS:
 *                    una actividad puede tener varios resultados y un JOIN la duplicaría.
 *  - FINALIZADA    = 1 si ACTIVIDAD.ESTADO_ID es el estado finalizado (24).
 */

// ── INICIO ───────────────────────────────────────────────────────────────────

/** Tipos de actividad que entran al ICC, por TIPO_DESCRIPCION. */
const TIPOS_ICC = ["LLAMADA", "VISITA"];

/** ESTADO_ID de actividad finalizada (el mismo que usa el front al crear actividades). */
const ESTADO_ACTIVIDAD_FINALIZADA = 24;

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

  const consulta = azureSqlClient({ A: "ACTIVIDAD" })
    .join({ T: "TIPO" }, "T.TIPO_ID", "A.TIPO_ID")
    .leftJoin(empleado, "EMP.USUARIO_ID", "A.USUARIO_ID")
    .leftJoin({ CEN: "CENTRO_COSTO" }, "CEN.CENCOS_ID", "A.CENCOS_ID")
    .leftJoin({ C: "ENTIDAD" }, "C.ENTIDAD_ID", "A.ENTIDAD_ID")
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
    )
    .select(
      azureSqlClient.raw(
        "CASE WHEN CONVERT(date, A.ACTIVIDAD_FECHA_PROGRAMACION) > CONVERT(date, A.ACTIVIDAD_FECHA) THEN 1 ELSE 0 END AS PROGRAMADA",
      ),
      azureSqlClient.raw(
        "CASE WHEN EXISTS (SELECT 1 FROM ACTIVIDAD_RESULTADO AR WHERE AR.ACTIVIDAD_ID = A.ACTIVIDAD_ID) THEN 1 ELSE 0 END AS CON_RESULTADO",
      ),
      azureSqlClient.raw("CASE WHEN A.ESTADO_ID = ? THEN 1 ELSE 0 END AS FINALIZADA", [
        ESTADO_ACTIVIDAD_FINALIZADA,
      ]),
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
    const filas = await consultaIcc(campos);
    return { filas };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// ── FIN ──────────────────────────────────────────────────────────────────────
