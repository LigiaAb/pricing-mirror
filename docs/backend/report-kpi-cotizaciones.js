/**
 * BACKEND (no es código del espejo; no sale en los diff/).
 *
 * report_kpi_cotizaciones: detalle (una fila por cotización) para la tabla dinámica de
 * Hit Rate y Realización de Precio en pricing/reportes. Una sola API para los dos
 * reportes: `reporte` = "hit_rate" | "realizacion_de_precio".
 *
 * Cómo instalarlo:
 *  1. Copiar desde "INICIO" hasta "FIN" al final del mismo archivo donde está
 *     `module.exports.report_hit_rate` (usa el mismo `azureSqlClient`).
 *  2. Registrar la ruta `/api/appweb/report_kpi_cotizaciones` igual que está registrada
 *     `report_hit_rate` (mismo método GET, mismos parámetros por query string + `reporte`).
 *  3. NO borrar ni cambiar `report_hit_rate` ni `report_realizacion_de_precio`: las
 *     gráficas, tablas y PDF actuales los siguen usando.
 *
 * Cálculo (igual que report_hit_rate):
 *  - REALIZADA = 1 si la cabecera se creó en el rango (fecha de la primera versión).
 *  - CERRADA   = 1 si la cabecera está CONFIRMADO y su fecha de aprobación está en el rango
 *                (sin importar quién confirmó ni cuándo se creó).
 *  - Dueño = usuario que creó la primera versión.
 *  Vienen las filas que cumplen REALIZADA o CERRADA. HR = Σ CERRADA ÷ Σ REALIZADA, igual
 *  que global_by_user / confirmadas_by_user.
 *
 * Realización de Precio agrega TIPO_PRECIO a las filas con CERRADA = 1, comparando la suma
 * de la venta Spot contra la suma de la venta original de la versión activa (el Spot solo
 * se registra en fletes): mayor → SOBRE_TARIFA; menor → SPOT; igual o sin Spot →
 * TARIFA_PUBLICADA. Así cada cerrada cae en un solo grupo y los tres suman las cerradas.
 *
 * Origen y destino (los dos reportes), de la cabecera: nombre = punto de enlace o, si no
 * hay (terrestre), ciudad; código = identificación del punto (TIPO_ID 78 o 79) o siglas de
 * la ciudad; país = el del punto de enlace o, si no hay, el de la ciudad.
 * Carrier: proveedores (ENTIDAD_ID) de los rubros de flete (RUBRO.ES_FLETE) de la versión
 * activa, sin repetir y separados por " / ".
 */

// ── INICIO ───────────────────────────────────────────────────────────────────

const REPORTES_KPI_COTIZACIONES = ["hit_rate", "realizacion_de_precio"];

/** Tipos de PUNTO_ENLACE_IDENTIFICACION que son el código del punto de enlace. */
const TIPOS_CODIGO_PUNTO = [78, 79];

/**
 * Un código por punto de enlace. El filtro de tipo va aquí y no en el WHERE para no perder
 * cotizaciones sin identificación; si un punto tiene los dos tipos, se toma el menor.
 */
const codigoPorPunto = (alias) =>
  azureSqlClient("PUNTO_ENLACE_IDENTIFICACION")
    .whereIn("TIPO_ID", TIPOS_CODIGO_PUNTO)
    .select("PUNTOENLACE_ID")
    .min({ CODIGO: "PEIDENTFICACION_CODIGO" })
    .groupBy("PUNTOENLACE_ID")
    .as(alias);

/** Joins de un extremo (origen o destino): punto de enlace + su código y país, ciudad + su país. */
const unirLugar = (consulta, extremo, prefijo) => {
  const pe = `${prefijo}PE`;
  const pi = `${prefijo}PI`;
  const ci = `${prefijo}CI`;
  const pp = `${prefijo}PP`;
  const pc = `${prefijo}PC`;
  return consulta
    .leftJoin({ [pe]: "PUNTO_ENLACE" }, `${pe}.PUNTOENLACE_ID`, `CC.PUNTOENLACE_${extremo}_ID`)
    .leftJoin(codigoPorPunto(pi), `${pi}.PUNTOENLACE_ID`, `${pe}.PUNTOENLACE_ID`)
    .leftJoin({ [pp]: "PAIS" }, `${pp}.PAIS_ID`, `${pe}.PAIS_ID`)
    .leftJoin({ [ci]: "CIUDAD" }, `${ci}.CIUDAD_ID`, `CC.CIUDAD_${extremo}_ID`)
    .leftJoin({ [pc]: "PAIS" }, `${pc}.PAIS_ID`, `${ci}.PAIS_ID`)
    .select(
      azureSqlClient.raw("COALESCE(??, ??) AS ??", [
        `${pp}.PAIS_NOMBRE`,
        `${pc}.PAIS_NOMBRE`,
        `${extremo}_PAIS`,
      ]),
      azureSqlClient.raw("COALESCE(??, ??) AS ??", [
        `${pe}.PUNTOENLACE_NOMBRE`,
        `${ci}.CIUDAD_NOMBRE`,
        extremo,
      ]),
      azureSqlClient.raw("COALESCE(??, ??) AS ??", [
        `${pi}.CODIGO`,
        `${ci}.CIUDAD_SIGLAS`,
        `${extremo}_CODIGO`,
      ]),
    );
};

/** Carrier por cotización: proveedores de los rubros de flete de la versión activa. */
const carrierPorCotizacion = () => {
  const proveedores = azureSqlClient({ CDR: "COTIZACION_DETALLE_RUBRO" })
    .join({ CD: "COTIZACION_DETALLE" }, "CD.COTIZACIONDETALLE_ID", "CDR.COTIZACIONDETALLE_ID")
    .join({ R: "RUBRO" }, "R.RUBRO_ID", "CDR.RUBRO_ID")
    .join({ EN: "ENTIDAD" }, "EN.ENTIDAD_ID", "CDR.ENTIDAD_ID")
    .where("CD.ESTADO_ID", 1)
    .where("R.ES_FLETE", 1)
    .distinct("CD.COTIZACIONCABECERA_ID", "EN.ENTIDAD_NOMBRE")
    .as("PRV");

  return azureSqlClient
    .from(proveedores)
    .select("PRV.COTIZACIONCABECERA_ID")
    .select(
      azureSqlClient.raw(
        "STRING_AGG(PRV.ENTIDAD_NOMBRE, ' / ') WITHIN GROUP (ORDER BY PRV.ENTIDAD_NOMBRE) AS CARRIER",
      ),
    )
    .groupBy("PRV.COTIZACIONCABECERA_ID")
    .as("CAR");
};

const validarCamposKpiCotizaciones = (campos) => {
  if (!campos?.fecha_inicio || !campos?.fecha_fin || !campos?.reporte)
    return { success: false, cod_mensaje: 1043, mensaje: "faltan parametros requeridos, verifique" };

  if (!REPORTES_KPI_COTIZACIONES.includes(campos.reporte))
    return {
      success: false,
      cod_mensaje: 1043,
      mensaje: `reporte invalido: use ${REPORTES_KPI_COTIZACIONES.join(" o ")}`,
    };

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

/** Condición "columna dentro del rango" (la misma que usa report_hit_rate). */
const enRangoKpi = (columna, campos) =>
  azureSqlClient.raw(
    "(?? >= CONVERT(date, ?, 23) AND ?? < DATEADD(DAY, 1, CONVERT(date, ?, 23)))",
    [columna, campos.fecha_inicio, columna, campos.fecha_fin],
  );

/** Hit Rate: una fila por cabecera realizada o confirmada en el rango. */
const consultaKpiHitRate = (campos) => {
  // Primera versión de cada cotización: su usuario es el dueño (igual que report_hit_rate)
  const primeraVersion = azureSqlClient
    .select(
      "COTIZACIONCABECERA_ID",
      "COTIZACIONDETALLE_ID",
      "USUARIO_ID",
      "COTIZACIONDETALLE_FECHA_CREACION",
    )
    .select(
      azureSqlClient.raw("ROW_NUMBER() OVER (PARTITION BY ?? ORDER BY ?? ASC, ?? ASC) AS RN", [
        "COTIZACIONCABECERA_ID",
        "COTIZACIONDETALLE_FECHA_CREACION",
        "COTIZACIONDETALLE_ID",
      ]),
    )
    .from("COTIZACION_DETALLE")
    .as("PV");

  // Un nombre por usuario: USUARIO_EMPLEADO_PUESTO puede tener varios registros por usuario
  const empleado = azureSqlClient({ UEP: "USUARIO_EMPLEADO_PUESTO" })
    .join({ EM: "EMPLEADO" }, "EM.EMPLEADO_ID", "UEP.EMPLEADO_ID")
    .select("UEP.USUARIO_ID")
    .max({ NOMBRES: "EM.EMPLEADO_NOMBRES" })
    .max({ APELLIDOS: "EM.EMPLEADO_APELLIDOS" })
    .groupBy("UEP.USUARIO_ID")
    .as("EMP");

  const creada = enRangoKpi("PV.COTIZACIONDETALLE_FECHA_CREACION", campos);
  const aprobada = enRangoKpi("CC.COTCAB_FECHA_APROBACION", campos);

  const consulta = azureSqlClient({ CC: "COTIZACION_CABECERA" })
    .join(primeraVersion, function () {
      this.on("PV.COTIZACIONCABECERA_ID", "=", "CC.COTIZACIONCABECERA_ID").andOnVal(
        "PV.RN",
        "=",
        1,
      );
    })
    .leftJoin(empleado, "EMP.USUARIO_ID", "PV.USUARIO_ID")
    .leftJoin({ U: "USUARIO" }, "U.USUARIO_ID", "PV.USUARIO_ID")
    .leftJoin({ E: "ESTADO" }, "E.ESTADO_ID", "CC.ESTADO_ID")
    .leftJoin({ CEN: "CENTRO_COSTO" }, "CEN.CENCOS_ID", "CC.CENCO_ID")
    .leftJoin({ TT: "TIPO" }, "TT.TIPO_ID", "CC.TIPO_TRANSPORTE_ID")
    .leftJoin({ TP: "TIPO" }, "TP.TIPO_ID", "CC.TIPO_PAGO_ID")
    .leftJoin({ C: "ENTIDAD" }, "C.ENTIDAD_ID", "CC.ENTIDAD_ID")
    .leftJoin(carrierPorCotizacion(), "CAR.COTIZACIONCABECERA_ID", "CC.COTIZACIONCABECERA_ID")
    .whereNotNull("PV.USUARIO_ID")
    .where(function () {
      this.whereRaw(creada).orWhere(function () {
        this.where("E.ESTADO_DESCRIPCION", "CONFIRMADO").whereRaw(aprobada);
      });
    })
    .select(
      "CC.COTIZACIONCABECERA_ID AS COTIZACION",
      "PV.COTIZACIONDETALLE_FECHA_CREACION AS FECHA_CREACION",
      "CC.COTCAB_FECHA_APROBACION AS FECHA_APROBACION",
      "PV.USUARIO_ID AS USUARIO",
      "EMP.NOMBRES AS NOMBRES",
      "EMP.APELLIDOS AS APELLIDOS",
      "CC.CENCO_ID AS CC",
      "CEN.CENCOD_NOMBRE AS CC_NOMBRE",
      "TT.TIPO_DESCRIPCION AS TRANSPORTE",
      "TP.TIPO_DESCRIPCION AS TIPO_PAGO",
      "C.ENTIDAD_NOMBRE AS CLIENTE",
      "E.ESTADO_DESCRIPCION AS ESTADO",
      "CAR.CARRIER AS CARRIER",
    )
    .select(azureSqlClient.raw("CASE WHEN ? THEN 1 ELSE 0 END AS REALIZADA", [creada]))
    .select(
      azureSqlClient.raw(
        "CASE WHEN E.ESTADO_DESCRIPCION = 'CONFIRMADO' AND ? THEN 1 ELSE 0 END AS CERRADA",
        [aprobada],
      ),
    );

  unirLugar(consulta, "ORIGEN", "O");
  unirLugar(consulta, "DESTINO", "D");

  // Mismos filtros que report_hit_rate (el de usuario aplica al creador de la primera versión)
  const tiene = (campo) => campos[campo] != null && campos[campo] !== "";
  if (tiene("cod_empresa")) consulta.where("CC.EMPRESA_ID", `${campos.cod_empresa}`);
  if (tiene("cod_cc")) consulta.where("CC.CENCO_ID", `${campos.cod_cc}`);
  if (tiene("cod_cliente")) consulta.where("CC.ENTIDAD_ID", `${campos.cod_cliente}`);
  if (tiene("cod_usuario")) consulta.where("PV.USUARIO_ID", `${campos.cod_usuario}`);
  if (tiene("cod_tipo_pago")) consulta.where("CC.TIPO_PAGO_ID", `${campos.cod_tipo_pago}`);

  return consulta;
};

/** Realización de Precio: las mismas filas de Hit Rate + el grupo de precio de las cerradas. */
const consultaKpiRealizacionDePrecio = (campos) => {
  // Spot activo de la versión activa, sumado por cotización
  const spot = azureSqlClient({ TS: "TARIFA_SPOT" })
    .join({ CD: "COTIZACION_DETALLE" }, "CD.COTIZACIONDETALLE_ID", "TS.COTIZACIONDETALLE_ID")
    .where("CD.ESTADO_ID", 1)
    .where("TS.ESTADO_ID", 81)
    .select("CD.COTIZACIONCABECERA_ID")
    .sum({ VENTA: "TS.TARIFASPOT_VENTA" })
    .sum({ VENTA_ORIGINAL: "TS.TARIFASPOT_VENTA_ORIGINAL" })
    .groupBy("CD.COTIZACIONCABECERA_ID")
    .as("SP");

  const aprobada = enRangoKpi("CC.COTCAB_FECHA_APROBACION", campos);

  return consultaKpiHitRate(campos)
    .leftJoin(spot, "SP.COTIZACIONCABECERA_ID", "CC.COTIZACIONCABECERA_ID")
    .select(
      azureSqlClient.raw(
        `CASE
          WHEN NOT (E.ESTADO_DESCRIPCION = 'CONFIRMADO' AND ?) THEN NULL
          WHEN SP.VENTA > SP.VENTA_ORIGINAL THEN 'SOBRE_TARIFA'
          WHEN SP.VENTA < SP.VENTA_ORIGINAL THEN 'SPOT'
          ELSE 'TARIFA_PUBLICADA'
        END AS TIPO_PRECIO`,
        [aprobada],
      ),
    );
};

const CONSULTAS_KPI_COTIZACIONES = {
  hit_rate: consultaKpiHitRate,
  realizacion_de_precio: consultaKpiRealizacionDePrecio,
};

module.exports.report_kpi_cotizaciones = async (campos) => {
  const error = validarCamposKpiCotizaciones(campos);
  if (error) return error;

  try {
    const filas = await CONSULTAS_KPI_COTIZACIONES[campos.reporte](campos);
    return { reporte: campos.reporte, filas };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// ── FIN ──────────────────────────────────────────────────────────────────────
