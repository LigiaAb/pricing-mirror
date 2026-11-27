/**
 * lista_reportes_disponibles: reportes que puede ver un usuario según su ROL y el contexto
 * (empresa, centro de costo y, opcional, módulo). Lo usa la pantalla de Reportes
 * (`src/features/reportes`, `api/reportes-disponibles.ts`).
 *
 * Parámetros: cod_usuario (requerido), cod_empresa, cod_cc, cod_modulo (opcionales; el que no
 * se envía no filtra: sin cod_modulo salen los reportes de todos los módulos).
 *
 * Tabla REPORTE_X_CC_X_MDULO_X_ROL: una fila = "este rol ve este reporte". EMPRESA_ID,
 * CENCOS_ID y MODULO_ID en NULL significan "en todos": así basta una fila para dar un
 * reporte a un rol en toda la empresa, o en todos los CC. ROL_ID NULL = todos los roles.
 *
 * Respuesta (una fila por reporte, sin repetidos):
 *   COD_REPORTE  = TIPO.TIPO_ID
 *   NOM_REPORTE  = TIPO.TIPO_DESCRIPCION   (título en pantalla)
 *   NOMENCLATURA = TIPO.TIPO_NOMENCLATURA  (une con la definición del front)
 *
 * CONFIRMAR con la base real:
 *  - Columna de la nomenclatura en TIPO (aquí TIPO_NOMENCLATURA), TIPO_TABLA y ESTADO_ID activo.
 *  - Cómo se obtienen los roles del usuario (aquí: USUARIO_EMPLEADO_PUESTO → ROL_X_PUESTO).
 *    Si el backend ya tiene el rol en la sesión (como getPermisosxRol), usar ese.
 */

// ── INICIO ───────────────────────────────────────────────────────────────────

/** ESTADO_ID activo de TIPO (CONFIRMAR). */
const ESTADO_TIPO_ACTIVO = 1;

module.exports.lista_reportes_disponibles = async (campos) => {
  if (!campos?.cod_usuario)
    return { success: false, cod_mensaje: 1043, mensaje: "faltan parametros requeridos, verifique" };

  try {
    // Roles del usuario (CONFIRMAR tablas).
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
      .where("R.ESTADO_ID", ESTADO_TIPO_ACTIVO)
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

/**
 * lista_modulos_reportes: módulos que tienen reportes en la empresa y el centro de costo (los
 * del contexto actual). Lo usa la pantalla de Reportes para el select de Módulo.
 *
 * Parámetros: cod_empresa (requerido), cod_cc (opcional; sin él no filtra por CC).
 * Misma regla de REPORTE_X_CC_X_MDULO_X_ROL que lista_reportes_disponibles (NULL = en todos),
 * con el reporte (TIPO) y la fila activos.
 *
 * Respuesta: una fila por módulo, sin repetidos: COD_MODULO = MODULO_ID. Una fila con
 * COD_MODULO NULL = hay reportes asignados a todos los módulos.
 */
module.exports.lista_modulos_reportes = async (campos) => {
  if (!campos?.cod_empresa)
    return { success: false, cod_mensaje: 1043, mensaje: "faltan parametros requeridos, verifique" };

  try {
    const consulta = azureSqlClient({ R: "REPORTE_X_CC_X_MDULO_X_ROL" })
      .join({ T: "TIPO" }, "T.TIPO_ID", "R.REPORTE_TIPO_ID")
      .where("T.TIPO_TABLA", "REPORTE")
      .where("T.ESTADO_ID", ESTADO_TIPO_ACTIVO)
      .where("R.ESTADO_ID", ESTADO_TIPO_ACTIVO)
      .where((q) => q.whereNull("R.EMPRESA_ID").orWhere("R.EMPRESA_ID", `${campos.cod_empresa}`))
      .distinct("R.MODULO_ID AS COD_MODULO")
      .orderBy("R.MODULO_ID");

    if (campos.cod_cc != null && campos.cod_cc !== "")
      consulta.where((q) => q.whereNull("R.CENCOS_ID").orWhere("R.CENCOS_ID", `${campos.cod_cc}`));

    return await consulta;
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// ── FIN ──────────────────────────────────────────────────────────────────────
