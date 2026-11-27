const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal");

module.exports.getlista_cotizacion_detalle_criterio = async (campos) => {
    const estructuraConsulta = azureSqlClient({ CDC: "COTIZACION_DETALLE_CRITERIO" });

    if ('cod_detallecriterio' in campos) {
        estructuraConsulta.where('CDC.DETCOTCRITERIO_ID', `${campos.cod_detallecriterio}`);
    }
    if ('cod_cotizaciondetalle' in campos) {
        estructuraConsulta.where('CDC.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`);
    }
    if ('cod_criterio' in campos) {
        estructuraConsulta.where('CDC.CRITERIO_ID', `${campos.cod_criterio}`);
    }

    const data = await estructuraConsulta.select(
        'CDC.DETCOTCRITERIO_ID AS COD_DETALLECRITERIO',
        'CDC.COTIZACIONDETALLE_ID AS COD_COTIZACIONDETALLE',
        'CDC.CRITERIO_ID AS COD_CRITERIO',
        'CDC.DETCOTCRITERIO_VALOR AS VALOR'
    );

    return data;
};

module.exports.insertar_cotizacion_detalle_criterio = async (campos) => {
    if (
        ('cod_cotizaciondetalle' in campos) &&
        ('cod_criterio' in campos) &&
        ('valor' in campos)
    ) {
        let idnuevo = await recuperaAcualizaCorrelativoTabla({ tabla: "COTIZACION_DETALLE_CRITERIO" });
        if (idnuevo > 0) {
            try {
                let resinsert = await azureSqlClient("COTIZACION_DETALLE_CRITERIO")
                    .insert({
                        DETCOTCRITERIO_ID: idnuevo,
                        COTIZACIONDETALLE_ID: campos.cod_cotizaciondetalle,
                        CRITERIO_ID: campos.cod_criterio,
                        DETCOTCRITERIO_VALOR: campos.valor
                    }).then(async () => {
                        console.log('Nuevo cotizacion_detalle_criterio creado ID:', idnuevo);
                        return {
                            success: true,
                            cod_mensaje: 1041,
                            mensaje: 'cotizacion_detalle_criterio creado correctamente',
                            cod_detallecriterio: idnuevo.toString()
                        };
                    }).catch((e) => {
                        console_log(e.toString());
                        return { success: false, cod_mensaje: 1042, error: e.toString() };
                    });

                return resinsert;

            } catch (error) {
                return { success: false, cod_mensaje: 1044, error: error.toString() };
            }
        } else {
            return { success: false, cod_mensaje: 1047, mensaje: 'No existe un correlativo valido para la tabla, consulta con IT' };
        }
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};

module.exports.actualizar_cotizacion_detalle_criterio = async (campos) => {
    if (
        ('cod_detallecriterio' in campos) &&
        ('cod_cotizaciondetalle' in campos) &&
        ('cod_criterio' in campos) &&
        ('valor' in campos)
    ) {
        try {
            let dataActualiza = await azureSqlClient("COTIZACION_DETALLE_CRITERIO")
                .where('DETCOTCRITERIO_ID', `${campos.cod_detallecriterio}`)
                .update({
                    COTIZACIONDETALLE_ID: campos.cod_cotizaciondetalle,
                    CRITERIO_ID: campos.cod_criterio,
                    DETCOTCRITERIO_VALOR: campos.valor
                }).then(() => {
                    console.log('cotizacion_detalle_criterio actualizado', campos.cod_detallecriterio);
                    return {
                        success: true,
                        cod_mensaje: 1031,
                        mensaje: 'cotizacion_detalle_criterio actualizado correctamente',
                        cod_detallecriterio: campos.cod_detallecriterio
                    };
                }).catch((e) => {
                    console_log(e.toString());
                    return { success: false, cod_mensaje: 1042, error: e.toString() };
                });

            return dataActualiza;

        } catch (error) {
            return { success: false, cod_mensaje: 1044, error: error.toString() };
        }
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};

module.exports.eliminar_cotizacion_detalle_criterio = async (campos) => {
    if ('cod_detallecriterio' in campos) {
        try {
            var busqueda = await azureSqlClient({ CDC: "COTIZACION_DETALLE_CRITERIO" })
                .where("CDC.DETCOTCRITERIO_ID", `${campos.cod_detallecriterio}`)
                .first();

            if (busqueda) {
                let eliminar = await azureSqlClient("COTIZACION_DETALLE_CRITERIO")
                    .where('DETCOTCRITERIO_ID', `${campos.cod_detallecriterio}`)
                    .del()
                    .then(async result => {
                        console.log(result);
                        return { success: true, cod_mensaje: 1051, mensaje: 'cotizacion_detalle_criterio eliminado correctamente' };
                    }).catch((e) => {
                        console_log(e.toString());
                        return { success: false, cod_mensaje: 1052, error: e.toString() };
                    });

                return eliminar;
            } else {
                return { success: false, cod_mensaje: 1054, mensaje: 'cotizacion_detalle_criterio no fue localizado' };
            }

        } catch (error) {
            return { success: false, cod_mensaje: 1052, error: error.toString() };
        }
    } else {
        return { success: false, cod_mensaje: 1053, mensaje: 'Debe de enviar el parametro' };
    }
};
