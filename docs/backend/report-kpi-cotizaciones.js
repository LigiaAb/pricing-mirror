module.exports.report_hit_rate = async (campos) => {
  // parametros
  if (!campos?.fecha_inicio || !campos?.fecha_fin)
    return {
      success: false,
      cod_mensaje: 1043,
      mensaje: "faltan parametros requeridos, verifique",
    };

  try {
    // Validar fechas en formato YYYY-MM-DD
    const fechasValidas = [campos.fecha_inicio, campos.fecha_fin].every(
      (fecha) => {
        if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha))
          return false;

        const date = new Date(`${fecha}T00:00:00.000Z`);
        return (
          !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === fecha
        );
      },
    );

    if (!fechasValidas || campos.fecha_inicio > campos.fecha_fin) {
      return {
        success: false,
        cod_mensaje: 1043,
        mensaje:
          "verifique las fechas: formato YYYY-MM-DD y fecha inicio menor o igual a fecha fin",
      };
    }

    // Primera version de cada cotizacion (sin importar su estado: vencida, inactiva, etc.)
    // El usuario de esta version es el "dueño" de la cotizacion.
    const primeraVersion = azureSqlClient
      .select(
        "COTIZACIONCABECERA_ID",
        "COTIZACIONDETALLE_ID",
        "USUARIO_ID",
        "COTIZACIONDETALLE_FECHA_CREACION",
      )
      .select(
        azureSqlClient.raw(
          "ROW_NUMBER() OVER (PARTITION BY ?? ORDER BY ?? ASC, ?? ASC) AS RN",
          [
            "COTIZACIONCABECERA_ID",
            "COTIZACIONDETALLE_FECHA_CREACION",
            "COTIZACIONDETALLE_ID",
          ],
        ),
      )
      .from("COTIZACION_DETALLE")
      .as("PV");

    // Generar query base: una fila por cotizacion (cabecera + su primera version)
    const estructuraConsulta = azureSqlClient({ CC: "COTIZACION_CABECERA" })
      .join(primeraVersion, function () {
        this.on("PV.COTIZACIONCABECERA_ID", "=", "CC.COTIZACIONCABECERA_ID")
          .andOnVal("PV.RN", "=", 1);
      })
      .leftJoin({ E: "ESTADO" }, function () {
        this.on("CC.ESTADO_ID", "=", "E.ESTADO_ID");
      })
      .leftJoin({ UEP: "USUARIO_EMPLEADO_PUESTO" }, function () {
        this.on("PV.USUARIO_ID", "=", "UEP.USUARIO_ID");
      })
      .leftJoin({ U: "USUARIO" }, function () {
        this.on("PV.USUARIO_ID", "=", "U.USUARIO_ID");
      })
      .leftJoin({ EM: "EMPLEADO" }, function () {
        this.on("EM.EMPLEADO_ID", "=", "UEP.EMPLEADO_ID");
      });

    // Aplicar filtros
    if ("cod_empresa" in campos) estructuraConsulta.where("CC.EMPRESA_ID", `${campos.cod_empresa}`);
    if ("cod_cc" in campos) estructuraConsulta.where("CC.CENCO_ID", `${campos.cod_cc}`);
    if ("cod_cliente" in campos) estructuraConsulta
        .leftJoin({ C: "ENTIDAD" }, function () {
            this.on("CC.ENTIDAD_ID", "=", "C.ENTIDAD_ID");
        })
        .where("CC.ENTIDAD_ID", `${campos.cod_cliente}`);
    // El filtro de usuario aplica al creador de la primera version
    if ("cod_usuario" in campos) estructuraConsulta.where("PV.USUARIO_ID", `${campos.cod_usuario}`);
    if ("cod_tipo_pago" in campos) estructuraConsulta
        .leftJoin({ TP: "TIPO" }, function () {
            this.on("CC.TIPO_PAGO_ID", "=", "TP.TIPO_ID");
        })
        .where("TP.TIPO_ID", `${campos.cod_tipo_pago}`);

    estructuraConsulta.whereNotNull("PV.USUARIO_ID");

    // Total de cotizaciones creadas en el rango (fecha de la primera version)
    const total_query = estructuraConsulta
      .clone()
      .whereRaw("?? >= CONVERT(date, ?, 23)", [
        "PV.COTIZACIONDETALLE_FECHA_CREACION",
        campos.fecha_inicio,
      ])
      .whereRaw("?? < DATEADD(DAY, 1, CONVERT(date, ?, 23))", [
        "PV.COTIZACIONDETALLE_FECHA_CREACION",
        campos.fecha_fin,
      ]);

    // Cotizaciones confirmadas en el rango (estado de la cabecera,
    // sin importar quien confirmo ni el estado de las versiones)
    const confirmadas_query = estructuraConsulta
      .clone()
      .where("E.ESTADO_DESCRIPCION", "CONFIRMADO")
      .whereRaw("?? >= CONVERT(date, ?, 23)", [
        "CC.COTCAB_FECHA_APROBACION",
        campos.fecha_inicio,
      ])
      .whereRaw("?? < DATEADD(DAY, 1, CONVERT(date, ?, 23))", [
        "CC.COTCAB_FECHA_APROBACION",
        campos.fecha_fin,
      ]);

    // Consultas por usuario (usuario de la primera version)
    const select_by_user = [ "PV.USUARIO_ID as USUARIO", "EM.EMPLEADO_NOMBRES AS NOMBRES", "EM.EMPLEADO_APELLIDOS AS APELLIDOS", "U.ORACLE_ID AS AUSRID" ];
    const group_by_user = [ "PV.USUARIO_ID", "EM.EMPLEADO_NOMBRES", "EM.EMPLEADO_APELLIDOS", "U.ORACLE_ID" ];

    if ("cod_cliente" in campos) select_by_user.push("C.ENTIDAD_NOMBRE AS CLIENTE");
    if ("cod_cliente" in campos) group_by_user.push("C.ENTIDAD_NOMBRE");
    if ("cod_tipo_pago" in campos) select_by_user.push("TP.TIPO_DESCRIPCION AS TIPO_PAGO");
    if ("cod_tipo_pago" in campos) group_by_user.push("TP.TIPO_DESCRIPCION");

    // Ids de cotizaciones y de su primera version
    const select_ids = [
      azureSqlClient.raw(
        "STRING_AGG(CONVERT(varchar(max), ??), ',') AS COTIZACIONES",
        ["CC.COTIZACIONCABECERA_ID"],
      ),
      azureSqlClient.raw(
        "STRING_AGG(CONVERT(varchar(max), ??), ',') AS VERSIONES",
        ["PV.COTIZACIONDETALLE_ID"],
      ),
    ];

    const global_by_user_query = total_query
      .clone()
      .countDistinct("CC.COTIZACIONCABECERA_ID AS TOTAL")
      .select(...select_ids)
      .select(...select_by_user)
      .groupBy(...group_by_user);

    const confirmadas_by_user_query = confirmadas_query
      .clone()
      .countDistinct("CC.COTIZACIONCABECERA_ID AS TOTAL")
      .select(...select_ids)
      .select(...select_by_user)
      .groupBy(...group_by_user);

    // Consultas por tipo de transporte
    const select_by_tipo_transporte = [...select_by_user, "TT.TIPO_DESCRIPCION AS TIPO"];
    const group_by_tipo_transporte = [...group_by_user, "TT.TIPO_DESCRIPCION"];

    const transportes = ["TERRESTRE", "AEREO", "MARITIMO"];

    const tipo_transporte_query = total_query
      .clone()
      .leftJoin({ TT: "TIPO" }, function () {
        this.on("TT.TIPO_ID", "=", "CC.TIPO_TRANSPORTE_ID");
      })
      .whereIn("TT.TIPO_DESCRIPCION", transportes)
      .countDistinct("CC.COTIZACIONCABECERA_ID AS TOTAL")
      .select(...select_ids)
      .select(...select_by_tipo_transporte)
      .groupBy(...group_by_tipo_transporte);

    const tipo_transporte_confirmadas_query = confirmadas_query
      .clone()
      .leftJoin({ TT: "TIPO" }, function () {
        this.on("TT.TIPO_ID", "=", "CC.TIPO_TRANSPORTE_ID");
      })
      .whereIn("TT.TIPO_DESCRIPCION", transportes)
      .countDistinct("CC.COTIZACIONCABECERA_ID AS TOTAL")
      .select(...select_ids)
      .select(...select_by_tipo_transporte)
      .groupBy(...group_by_tipo_transporte);

    // Consultas por centro de costo
    // (alias CEN para no chocar con el alias C de ENTIDAD cuando viene cod_cliente)
    const select_by_cc = ["CC.CENCO_ID as CC", "CEN.CENCOD_NOMBRE as NOMBRES"];
    const group_by_cc = ["CC.CENCO_ID", "CEN.CENCOD_NOMBRE"];

    const cc_query = total_query
      .clone()
      .leftJoin({ CEN: "CENTRO_COSTO" }, function () {
        this.on("CC.CENCO_ID", "=", "CEN.CENCOS_ID");
      })
      .countDistinct("CC.COTIZACIONCABECERA_ID AS TOTAL")
      .select(...select_ids)
      .select(...select_by_cc)
      .groupBy(...group_by_cc);

    const confirmadas_cc_query = confirmadas_query
      .clone()
      .leftJoin({ CEN: "CENTRO_COSTO" }, function () {
        this.on("CC.CENCO_ID", "=", "CEN.CENCOS_ID");
      })
      .countDistinct("CC.COTIZACIONCABECERA_ID AS TOTAL")
      .select(...select_ids)
      .select(...select_by_cc)
      .groupBy(...group_by_cc);

    // Ejecutar consultas independientes en paralelo
    const [
      global_by_user,
      confirmadas_by_user,
      por_transporte,
      confirmadas_por_transporte,
      cc,
      confirmadas_cc,
    ] = await Promise.all([
      global_by_user_query,
      confirmadas_by_user_query,
      tipo_transporte_query,
      tipo_transporte_confirmadas_query,
      cc_query,
      confirmadas_cc_query,
    ]);

    // Convertir los IDs a listas sin duplicados
    // (pueden repetirse si un usuario tiene varios registros en USUARIO_EMPLEADO_PUESTO)
    const unicos = (valor) =>
      [...new Set(valor ? valor.split(",").map(Number) : [])].join(",");

    [
      global_by_user,
      confirmadas_by_user,
      por_transporte,
      confirmadas_por_transporte,
      cc,
      confirmadas_cc,
    ].forEach((resultados) => {
      resultados.forEach((item) => {
        item.COTIZACIONES = unicos(item.COTIZACIONES);
      });
    });

    // Separar resultados por tipo de transporte
    const porTipo = (lista, tipo) => lista.filter((item) => item.TIPO === tipo);

    return {
      global_by_user,
      confirmadas_by_user,
      tipo_transporte_terrestre: porTipo(por_transporte, "TERRESTRE"),
      confirmadas_tipo_transporte_terrestre: porTipo(confirmadas_por_transporte, "TERRESTRE"),
      tipo_transporte_aereo: porTipo(por_transporte, "AEREO"),
      confirmadas_tipo_transporte_aereo: porTipo(confirmadas_por_transporte, "AEREO"),
      tipo_transporte_maritimo: porTipo(por_transporte, "MARITIMO"),
      confirmadas_tipo_transporte_maritimo: porTipo(confirmadas_por_transporte, "MARITIMO"),
      cc,
      confirmadas_cc,
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

module.exports.report_realizacion_de_precio = async (campos) => {

    // parametros
    if (!campos?.fecha_inicio || !campos?.fecha_fin) return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };

    try {

        // Validar fechas en formato YYYY-MM-DD
        const fechasValidas = [campos.fecha_inicio, campos.fecha_fin].every(fecha => {
            if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

            const date = new Date(`${fecha}T00:00:00.000Z`);
            return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === fecha;
        });

        if (!fechasValidas || campos.fecha_inicio > campos.fecha_fin) {
            return {
                success: false,
                cod_mensaje: 1043,
                mensaje: 'verifique las fechas: formato YYYY-MM-DD y fecha inicio menor o igual a fecha fin'
            };
        }

        // Generar query base
        const estructuraConsulta = azureSqlClient({ CC: "COTIZACION_CABECERA" })
            .leftJoin({ CD: "COTIZACION_DETALLE" }, function () {
                this.on('CC.COTIZACIONCABECERA_ID', '=', 'CD.COTIZACIONCABECERA_ID')
                    .onVal('CD.ESTADO_ID', '=', 1);
            })
            .leftJoin({ E: "ESTADO" }, function () {
                this.on("CC.ESTADO_ID", "=", "E.ESTADO_ID");
            })
            .leftJoin({ UEP: "USUARIO_EMPLEADO_PUESTO" }, function () {
                this.on('CD.USUARIO_ID', '=', 'UEP.USUARIO_ID');
            })
            .leftJoin({ U: "USUARIO" }, function () {
                this.on('CD.USUARIO_ID', '=', 'U.USUARIO_ID');
            })
            .leftJoin({ EM: "EMPLEADO" }, function () {
                this.on('EM.EMPLEADO_ID', '=', 'UEP.EMPLEADO_ID');
            });

        // Aplicar filtros
        if ('cod_empresa' in campos) estructuraConsulta.where('CC.EMPRESA_ID', `${campos.cod_empresa}`);
        if ('cod_cc' in campos) estructuraConsulta.where('CC.CENCO_ID', `${campos.cod_cc}`);
        if ('cod_cliente' in campos) estructuraConsulta
            .leftJoin({ C: "ENTIDAD" }, function () {
                this.on('CC.ENTIDAD_ID', '=', 'C.ENTIDAD_ID');
            })
            .where('CC.ENTIDAD_ID', `${campos.cod_cliente}`);
        if ('cod_usuario' in campos) estructuraConsulta.where('CD.USUARIO_ID', `${campos.cod_usuario}`);
        if ('cod_tipo_pago' in campos) estructuraConsulta
            .leftJoin({ TP: "TIPO" }, function () {
                this.on('CC.TIPO_PAGO_ID', '=', 'TP.TIPO_ID');
            })
            .where('TP.TIPO_ID', `${campos.cod_tipo_pago}`);

        estructuraConsulta.whereRaw(
            '?? >= CONVERT(date, ?, 23)',
            ['CD.COTIZACIONDETALLE_FECHA_CREACION', campos.fecha_inicio]
        );

        estructuraConsulta.whereRaw(
            '?? < DATEADD(DAY, 1, CONVERT(date, ?, 23))',
            ['CD.COTIZACIONDETALLE_FECHA_CREACION', campos.fecha_fin]
        );

        estructuraConsulta.whereNotNull('CD.USUARIO_ID');

        // Campos por usuario
        const select_by_user = [
            'CD.USUARIO_ID as USUARIO',
            'EM.EMPLEADO_NOMBRES AS NOMBRES',
            'EM.EMPLEADO_APELLIDOS AS APELLIDOS',
            'U.ORACLE_ID AS AUSRID'
          ];
        const group_by_user = [
            'CD.USUARIO_ID',
            'EM.EMPLEADO_NOMBRES',
            'EM.EMPLEADO_APELLIDOS',
            'U.ORACLE_ID'
          ];
        
        if ('cod_cliente' in campos) select_by_user.push('C.ENTIDAD_NOMBRE AS CLIENTE')
        if ('cod_cliente' in campos) group_by_user.push('C.ENTIDAD_NOMBRE')
        if ('cod_tipo_pago' in campos) select_by_user.push('TP.TIPO_DESCRIPCION AS TIPO_PAGO')
        if ('cod_tipo_pago' in campos) group_by_user.push('TP.TIPO_DESCRIPCION')

        // Consulta de IDs de cotizaciones
        const select_ids = [
          azureSqlClient.raw(
            "STRING_AGG(CONVERT(varchar(max), ??), ',') AS COTIZACIONES",
            ['CC.COTIZACIONCABECERA_ID']
          ),
          azureSqlClient.raw(
              "STRING_AGG(CONVERT(varchar(max), ??), ',') AS VERSIONES",
              ['CD.COTIZACIONDETALLE_ID']
          )
        ];

        // Total de cotizaciones realizadas por usuario
        const global_by_user_query = estructuraConsulta.clone()
            .countDistinct('CC.COTIZACIONCABECERA_ID AS TOTAL')
            .select(...select_ids)
            .select(...select_by_user)
            .groupBy(...group_by_user);

        // Base para los grupos de cotizaciones confirmadas
        const confirmadas_query = estructuraConsulta.clone()
          .where('E.ESTADO_DESCRIPCION', 'CONFIRMADO');

        // Relacionar spot con el detalle activo
        const spot_query = azureSqlClient({ TS: "TARIFA_SPOT" })
            .select(azureSqlClient.raw('1'))
            .whereColumn('TS.COTIZACIONDETALLE_ID', 'CD.COTIZACIONDETALLE_ID')
            .where('TS.ESTADO_ID', 81 );

        // Cotizaciones sin spot
        const by_user_original_query = confirmadas_query.clone()
            .whereNotExists(spot_query.clone())
            .countDistinct('CC.COTIZACIONCABECERA_ID AS TOTAL')
            .select(...select_ids)
            .select(...select_by_user)
            .groupBy(...group_by_user);

        // Cotizaciones con venta menor al precio original
        const by_user_bajo_query = confirmadas_query.clone()
            .whereExists(
                spot_query.clone()
                    .whereColumn('TS.TARIFASPOT_VENTA', '<', 'TS.TARIFASPOT_VENTA_ORIGINAL')
            )
            .countDistinct('CC.COTIZACIONCABECERA_ID AS TOTAL')
            .select(...select_ids)
            .select(...select_by_user)
            .groupBy(...group_by_user);

        // Cotizaciones con venta mayor al precio original
        const by_user_alto_query = confirmadas_query.clone()
            .whereExists(
                spot_query.clone()
                    .whereColumn('TS.TARIFASPOT_VENTA', '>', 'TS.TARIFASPOT_VENTA_ORIGINAL')
            )
            .countDistinct('CC.COTIZACIONCABECERA_ID AS TOTAL')
            .select(...select_ids)
            .select(...select_by_user)
            .groupBy(...group_by_user);

        // Ejecutar consultas independientes en paralelo
        const [
            global_by_user,
            by_user_original,
            by_user_bajo,
            by_user_alto
        ] = await Promise.all([
            global_by_user_query,
            by_user_original_query,
            by_user_bajo_query,
            by_user_alto_query
        ]);

        // Convertir los IDs a arreglos sin duplicados
        [
            global_by_user,
            by_user_original,
            by_user_bajo,
            by_user_alto
        ].forEach(resultados => {
            resultados.forEach(item => {
                item.COTIZACIONES = [
                    ...new Set(
                        item.COTIZACIONES
                            ? item.COTIZACIONES.split(',').map(Number)
                            : []
                    )
                ].join(",");
                item.VERSIONES = [
                    ...new Set(
                        item.VERSIONES
                            ? item.VERSIONES.split(',').map(Number)
                            : []
                    )
                ].join(',');
            });
        });

        return {
            global_by_user,
            by_user_original,
            by_user_bajo,
            by_user_alto,
        };
    }
    catch (error) {
        return { success: false, error: error.toString() };
    }
}

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
      // Para que la ficha del reporte busque la cabecera completa (lista-cotizacion-cabecera).
      "CC.ENTIDAD_ID AS COD_CLIENTE",
      "CC.EMPRESA_ID AS COD_EMPRESA",
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

/**
 * Realización de Precio: mismos criterios que report_realizacion_de_precio.
 *  - Una fila por cotización cuya versión activa (ESTADO_ID 1) se creó en el rango.
 *  - Dueño = usuario de la versión activa (no el de la primera versión).
 *  - REALIZADA = 1 en todas (global_by_user); CERRADA = 1 si la cabecera está CONFIRMADO
 *    (sin revisar la fecha de aprobación).
 *  - En las cerradas, con los Spot activos (ESTADO_ID 81) de la versión activa:
 *    SIN_SPOT (by_user_original) = no tiene Spot; SPOT_BAJO (by_user_bajo) = algún Spot con
 *    venta menor a la original; SPOT_ALTO (by_user_alto) = alguno con venta mayor.
 *    Una cotización puede tener SPOT_BAJO y SPOT_ALTO a la vez, igual que el reporte.
 */
const consultaKpiRealizacionDePrecio = (campos) => {
  // Un nombre por usuario: USUARIO_EMPLEADO_PUESTO puede tener varios registros por usuario
  const empleado = azureSqlClient({ UEP: "USUARIO_EMPLEADO_PUESTO" })
    .join({ EM: "EMPLEADO" }, "EM.EMPLEADO_ID", "UEP.EMPLEADO_ID")
    .select("UEP.USUARIO_ID")
    .max({ NOMBRES: "EM.EMPLEADO_NOMBRES" })
    .max({ APELLIDOS: "EM.EMPLEADO_APELLIDOS" })
    .groupBy("UEP.USUARIO_ID")
    .as("EMP");

  const confirmada = "E.ESTADO_DESCRIPCION = 'CONFIRMADO'";
  const spotActivo = (condicion) =>
    `EXISTS (SELECT 1 FROM TARIFA_SPOT TS WHERE TS.COTIZACIONDETALLE_ID = CD.COTIZACIONDETALLE_ID AND TS.ESTADO_ID = 81${condicion})`;

  const consulta = azureSqlClient({ CC: "COTIZACION_CABECERA" })
    .join({ CD: "COTIZACION_DETALLE" }, function () {
      this.on("CD.COTIZACIONCABECERA_ID", "=", "CC.COTIZACIONCABECERA_ID").andOnVal(
        "CD.ESTADO_ID",
        "=",
        1,
      );
    })
    .leftJoin(empleado, "EMP.USUARIO_ID", "CD.USUARIO_ID")
    .leftJoin({ U: "USUARIO" }, "U.USUARIO_ID", "CD.USUARIO_ID")
    .leftJoin({ E: "ESTADO" }, "E.ESTADO_ID", "CC.ESTADO_ID")
    .leftJoin({ CEN: "CENTRO_COSTO" }, "CEN.CENCOS_ID", "CC.CENCO_ID")
    .leftJoin({ TT: "TIPO" }, "TT.TIPO_ID", "CC.TIPO_TRANSPORTE_ID")
    .leftJoin({ TP: "TIPO" }, "TP.TIPO_ID", "CC.TIPO_PAGO_ID")
    .leftJoin({ C: "ENTIDAD" }, "C.ENTIDAD_ID", "CC.ENTIDAD_ID")
    .leftJoin(carrierPorCotizacion(), "CAR.COTIZACIONCABECERA_ID", "CC.COTIZACIONCABECERA_ID")
    .whereNotNull("CD.USUARIO_ID")
    .whereRaw(enRangoKpi("CD.COTIZACIONDETALLE_FECHA_CREACION", campos))
    .select(
      "CC.COTIZACIONCABECERA_ID AS COTIZACION",
      "CD.COTIZACIONDETALLE_FECHA_CREACION AS FECHA_CREACION",
      "CC.COTCAB_FECHA_APROBACION AS FECHA_APROBACION",
      "CD.USUARIO_ID AS USUARIO",
      "EMP.NOMBRES AS NOMBRES",
      "EMP.APELLIDOS AS APELLIDOS",
      "CC.CENCO_ID AS CC",
      "CEN.CENCOD_NOMBRE AS CC_NOMBRE",
      "TT.TIPO_DESCRIPCION AS TRANSPORTE",
      "TP.TIPO_DESCRIPCION AS TIPO_PAGO",
      "C.ENTIDAD_NOMBRE AS CLIENTE",
      "CC.ENTIDAD_ID AS COD_CLIENTE",
      "CC.EMPRESA_ID AS COD_EMPRESA",
      "E.ESTADO_DESCRIPCION AS ESTADO",
      "CAR.CARRIER AS CARRIER",
    )
    .select(azureSqlClient.raw("1 AS REALIZADA"))
    .select(azureSqlClient.raw(`CASE WHEN ${confirmada} THEN 1 ELSE 0 END AS CERRADA`))
    .select(
      azureSqlClient.raw(
        `CASE WHEN ${confirmada} AND NOT ${spotActivo("")} THEN 1 ELSE 0 END AS SIN_SPOT`,
      ),
      azureSqlClient.raw(
        `CASE WHEN ${confirmada} AND ${spotActivo(
          " AND TS.TARIFASPOT_VENTA < TS.TARIFASPOT_VENTA_ORIGINAL",
        )} THEN 1 ELSE 0 END AS SPOT_BAJO`,
      ),
      azureSqlClient.raw(
        `CASE WHEN ${confirmada} AND ${spotActivo(
          " AND TS.TARIFASPOT_VENTA > TS.TARIFASPOT_VENTA_ORIGINAL",
        )} THEN 1 ELSE 0 END AS SPOT_ALTO`,
      ),
    );

  unirLugar(consulta, "ORIGEN", "O");
  unirLugar(consulta, "DESTINO", "D");

  // Mismos filtros que report_realizacion_de_precio (el de usuario aplica a la versión activa)
  const tiene = (campo) => campos[campo] != null && campos[campo] !== "";
  if (tiene("cod_empresa")) consulta.where("CC.EMPRESA_ID", `${campos.cod_empresa}`);
  if (tiene("cod_cc")) consulta.where("CC.CENCO_ID", `${campos.cod_cc}`);
  if (tiene("cod_cliente")) consulta.where("CC.ENTIDAD_ID", `${campos.cod_cliente}`);
  if (tiene("cod_usuario")) consulta.where("CD.USUARIO_ID", `${campos.cod_usuario}`);
  if (tiene("cod_tipo_pago")) consulta.where("CC.TIPO_PAGO_ID", `${campos.cod_tipo_pago}`);

  return consulta;
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