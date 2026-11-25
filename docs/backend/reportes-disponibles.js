/**
 * BACKEND (no es código del espejo; no sale en los diff/).
 *
 * lista_reportes_disponibles: reportes que puede ver un usuario en un MÓDULO según su ROL y el
 * contexto (empresa y centro de costo). Lo usa la pantalla de Reportes
 * (`src/features/reportes`, `api/reportes-disponibles.ts`).
 *
 * Cómo instalarlo:
 *  1. Copiar desde "INICIO" hasta "FIN" en el archivo de los reportes (usa `azureSqlClient`).
 *  2. Registrar la ruta `/api/appweb/lista-reportes-disponibles` (GET, parámetros por query
 *     string), igual que `report_kpi_cotizaciones`.
 *
 * Parámetros: cod_usuario y cod_modulo (requeridos), cod_empresa y cod_cc (opcionales; el que
 * no se envía no filtra).
 *
 * Tabla REPORTE_X_CC_X_MDULO_X_ROL: una fila = "este rol ve este reporte". EMPRESA_ID,
 * CENCOS_ID y MODULO_ID en NULL significan "en todos": así basta una fila para dar un
 * reporte a un rol en toda la empresa, o en todos los CC. ROL_ID NULL = todos los roles.
 *
 * Respuesta (una fila por reporte, sin repetidos):
 *   COD_REPORTE  = TIPO.TIPO_ID
 *   NOM_REPORTE  = TIPO.TIPO_DESCRIPCION   (título en pantalla)
 *   NOMENCLATURA = TIPO.NOMENCLATURA       (une con la definición del front)
 *
 * Nombres confirmados por el usuario: USUARIO_EMPLEADO_PUESTO.PUESTO_ID, ROL_PUESTO
 * (PUESTO_ID, ROL_ID), TIPO.NOMENCLATURA, TIPO.TIPO_TABLA y TIPO.ESTADO_ID (activo = 1).
 */

// ── INICIO ───────────────────────────────────────────────────────────────────

/** ESTADO_ID activo de TIPO. */
const ESTADO_TIPO_ACTIVO = 1;

module.exports.lista_reportes_disponibles = async (campos) => {
  if (!campos?.cod_usuario || !campos?.cod_modulo)
    return { success: false, cod_mensaje: 1043, mensaje: "faltan parametros requeridos, verifique" };

  try {
    // Roles del usuario: puestos del usuario → ROL_PUESTO.
    const rolesUsuario = azureSqlClient({ UEP: "USUARIO_EMPLEADO_PUESTO" })
      .join({ RP: "ROL_PUESTO" }, "RP.PUESTO_ID", "UEP.PUESTO_ID")
      .where("UEP.USUARIO_ID", `${campos.cod_usuario}`)
      .select("RP.ROL_ID");

    /** Columna NULL = aplica a todos; si no, debe coincidir. Sin parámetro, no se filtra. */
    const nuloOIgual = (consulta, columna, valor) => {
      if (valor == null || valor === "") return;
      consulta.where((q) => q.whereNull(columna).orWhere(columna, `${valor}`));
    };

    const consulta = azureSqlClient({ R: "REPORTE_X_CC_X_MDULO_X_ROL" })
      .join({ T: "TIPO" }, "T.TIPO_ID", "R.REPORTE_TIPO_ID")
      .where("T.TIPO_TABLA", "REPORTE")
      .where("T.ESTADO_ID", ESTADO_TIPO_ACTIVO)
      .where((q) => q.whereNull("R.ROL_ID").orWhereIn("R.ROL_ID", rolesUsuario))
      .distinct(
        "T.TIPO_ID AS COD_REPORTE",
        "T.TIPO_DESCRIPCION AS NOM_REPORTE",
        "T.NOMENCLATURA AS NOMENCLATURA",
      )
      .orderBy("T.TIPO_DESCRIPCION");

    nuloOIgual(consulta, "R.EMPRESA_ID", campos.cod_empresa);
    nuloOIgual(consulta, "R.CENCOS_ID", campos.cod_cc);
    nuloOIgual(consulta, "R.MODULO_ID", campos.cod_modulo);

    return await consulta;
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// ── FIN ──────────────────────────────────────────────────────────────────────
