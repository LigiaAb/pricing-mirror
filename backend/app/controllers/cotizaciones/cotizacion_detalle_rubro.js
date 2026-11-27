const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal");

module.exports.getlista_cotizacion_detalle_rubro = async (campos) => {
    const estructuraConsulta = azureSqlClient({ CDR: "COTIZACION_DETALLE_RUBRO" });

    if ('cod_detallerubro' in campos) {
        estructuraConsulta.where('CDR.COTDETRUB_ID', `${campos.cod_detallerubro}`);
    }
    if ('cod_cotizaciondetalle' in campos) {
        estructuraConsulta.where('CDR.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`);
    }
    if ('cod_rubro' in campos) {
        estructuraConsulta.where('CDR.RUBRO_ID', `${campos.cod_rubro}`);
    }
    if ('cod_servicio' in campos) {
        estructuraConsulta.where('CDR.SERVICIO_ID', `${campos.cod_servicio}`);
    }
    if ('entidad_id' in campos) {
        estructuraConsulta.where('CDR.ENTIDAD_ID', `${campos.entidad_id}`);
    }
    if ('gruporubro_nombre' in campos) {
        estructuraConsulta.where('CDR.GRUPORUBRO_NOMBRE', `${campos.gruporubro_nombre}`);
    }
    if ('valor_rubro' in campos) {
        estructuraConsulta.where('CDR.COTDETRUB_VALOR_RUBRO', `${campos.valor_rubro}`);
    }
    if ('valor_grupo' in campos) {
        estructuraConsulta.where('CDR.COTDETRUB_VALOR_GRUPO', `${campos.valor_grupo}`);
    }

    const data = await estructuraConsulta.select(
        'CDR.COTDETRUB_ID AS COD_DETALLERUBRO',
        'CDR.COTIZACIONDETALLE_ID AS COD_COTIZACIONDETALLE',
        'CDR.RUBRO_ID AS COD_RUBRO',
        'CDR.GRUPORUBRO_NOMBRE AS GRUPORUBRO_NOMBRE',
        'CDR.COTDETRUB_COSTO_RUBRO AS COSTO_RUBRO',
        'CDR.COTDETRUB_COSTO_GRUPO AS COSTO_GRUPO',
        'CDR.COTDETRUB_VENTA_RUBRO AS VENTA_RUBRO',
        'CDR.COTDETRUB_VENTA_GRUPO AS VENTA_GRUPO',
        'CDR.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
        'CDR.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
        'CDR.SERVICIO_ID AS COD_SERVICIO',
        'CDR.ENTIDAD_ID',
        'CDR.SERVICIO_CLASIFICACION AS CLASIFICACION',
        'CDR.TIPO_PAGO_ID AS COD_TIPO_PAGO',
        'CDR.TIPO_FACTURACION_ID AS COD_TIPO_FACTURACION',
        'CDR.TIPO_CALCULO_ID AS COD_TIPO_CALCULO',
        'CDR.METODO_ID AS COD_METODO',
        'CDR.COTDETRUB_RATE_COSTO AS RATE_COSTO',
        'CDR.COTDETRUB_RATE_VENTA AS RATE_VENTA',
        'CDR.COTDETRUB_DETALLE AS DETALLE'
    );

    return data;
};

module.exports.insertar_cotizacion_detalle_rubro = async (campos) => {
    if (
        ('cod_cotizaciondetalle' in campos) &&
        ('cod_rubro' in campos) &&
        ('costo_rubro' in campos) && 
        ('venta_rubro' in campos) && 
        ('cod_moneda_costo' in campos) && 
        ('cod_moneda_venta' in campos) &&
        ('entidad_id' in campos) &&
        ('cod_servicio' in campos)
    ) {
        let idnuevo = await recuperaAcualizaCorrelativoTabla({ tabla: "COTIZACION_DETALLE_RUBRO" });
        if (idnuevo > 0) {
            try {
                let resinsert = await azureSqlClient("COTIZACION_DETALLE_RUBRO")
                    .insert({
                        COTDETRUB_ID: idnuevo,
                        COTIZACIONDETALLE_ID: campos.cod_cotizaciondetalle,
                        RUBRO_ID: campos.cod_rubro,
                        GRUPORUBRO_NOMBRE: campos.gruporubro_nombre,
                        COTDETRUB_COSTO_RUBRO: campos.costo_rubro,
                        COTDETRUB_COSTO_GRUPO: campos.costo_grupo,
                        COTDETRUB_VENTA_RUBRO: campos.venta_rubro,
                        COTDETRUB_VENTA_GRUPO: campos.venta_grupo,
                        MONEDA_COSTO_ID: campos.cod_moneda_costo, 
                        MONEDA_VENTA_ID: campos.cod_moneda_venta, 
                        ENTIDAD_ID: campos.entidad_id,
                        SERVICIO_ID: campos.cod_servicio,
                        SERVICIO_CLASIFICACION: campos.clasificacion,
                        TIPO_PAGO_ID: campos.cod_tipo_pago,
                        TIPO_FACTURACION_ID: campos.cod_tipo_facturacion,
                        TIPO_CALCULO_ID: campos.cod_tipo_calculo,
                        METODO_ID: campos.cod_metodo,
                        COTDETRUB_RATE_COSTO: campos.rate_costo,
                        COTDETRUB_RATE_VENTA: campos.rate_venta,
                        COTDETRUB_DETALLE: campos.detalle
                    }).then(async () => {
                        console.log('Nuevo cotizacion_detalle_rubro creado ID:', idnuevo);
                        return {
                            success: true,
                            cod_mensaje: 1041,
                            mensaje: 'cotizacion_detalle_rubro creado correctamente',
                            cod_detallerubro: idnuevo.toString()
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

module.exports.insertar_cotizacion_detalle_rubro_especial = async (campos) => {
    if (
        ('cod_cotizaciondetalle' in campos) &&
        ('cod_rubro' in campos) &&
        ('costo_rubro' in campos) && 
        ('venta_rubro' in campos) && 
        ('cod_moneda_costo' in campos) && 
        ('cod_moneda_venta' in campos) 
    ) {
        let idnuevo = await recuperaAcualizaCorrelativoTabla({ tabla: "COTIZACION_DETALLE_RUBRO" });
        if (idnuevo > 0) {
            try {
                let resinsert = await azureSqlClient("COTIZACION_DETALLE_RUBRO")
                    .insert({
                        COTDETRUB_ID: idnuevo,
                        COTIZACIONDETALLE_ID: campos.cod_cotizaciondetalle,
                        RUBRO_ID: campos.cod_rubro,
                        GRUPORUBRO_NOMBRE: campos.gruporubro_nombre,
                        COTDETRUB_COSTO_RUBRO: campos.costo_rubro,
                        COTDETRUB_COSTO_GRUPO: campos.costo_grupo,
                        COTDETRUB_VENTA_RUBRO: campos.venta_rubro,
                        COTDETRUB_VENTA_GRUPO: campos.venta_grupo,
                        MONEDA_COSTO_ID: campos.cod_moneda_costo, 
                        MONEDA_VENTA_ID: campos.cod_moneda_venta, 
                        ENTIDAD_ID: campos.entidad_id,
                        SERVICIO_ID: campos.cod_servicio,
                        SERVICIO_CLASIFICACION: campos.clasificacion,
                        TIPO_PAGO_ID: campos.cod_tipo_pago,
                        TIPO_FACTURACION_ID: campos.cod_tipo_facturacion,
                        TIPO_CALCULO_ID: campos.cod_tipo_calculo,
                        METODO_ID: campos.cod_metodo,
                        COTDETRUB_RATE_COSTO: campos.rate_costo,
                        COTDETRUB_RATE_VENTA: campos.rate_venta,
                        COTDETRUB_DETALLE: campos.detalle
                    }).then(async () => {
                        console.log('Nuevo cotizacion_detalle_rubro creado ID:', idnuevo);
                        return {
                            success: true,
                            cod_mensaje: 1041,
                            mensaje: 'cotizacion_detalle_rubro creado correctamente',
                            cod_detallerubro: idnuevo.toString()
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

module.exports.actualizar_cotizacion_detalle_rubro = async (campos) => {
    if (
        ('cod_detallerubro' in campos) &&
        ('cod_cotizaciondetalle' in campos) &&
        ('cod_rubro' in campos) &&
        ('costo_rubro' in campos) && 
        ('venta_rubro' in campos) && 
        ('entidad_id' in campos) &&
        ('cod_moneda_costo' in campos) && 
        ('cod_moneda_venta' in campos) &&
        ('cod_servicio' in campos)
    ) {
        try {
            let dataActualiza = await azureSqlClient("COTIZACION_DETALLE_RUBRO")
                .where('COTDETRUB_ID', `${campos.cod_detallerubro}`)
                .update({
                    COTIZACIONDETALLE_ID: campos.cod_cotizaciondetalle,
                    RUBRO_ID: campos.cod_rubro,
                    GRUPORUBRO_NOMBRE: campos.gruporubro_nombre,
                    COTDETRUB_COSTO_RUBRO: campos.costo_rubro,
                    COTDETRUB_COSTO_GRUPO: campos.costo_grupo,
                    COTDETRUB_VENTA_RUBRO: campos.venta_rubro,
                    COTDETRUB_VENTA_GRUPO: campos.venta_grupo,
                    MONEDA_COSTO_ID: campos.cod_moneda_costo, 
                    MONEDA_VENTA_ID: campos.cod_moneda_venta, 
                    ENTIDAD_ID: campos.entidad_id,
                    SERVICIO_ID: campos.cod_servicio,
                    SERVICIO_CLASIFICACION: campos.clasificacion,
                    TIPO_PAGO_ID: campos.cod_tipo_pago,
                    TIPO_FACTURACION_ID: campos.cod_tipo_facturacion,
                    TIPO_CALCULO_ID: campos.cod_tipo_calculo,
                    METODO_ID: campos.cod_metodo,
                    COTDETRUB_RATE_COSTO: campos.rate_costo,
                    COTDETRUB_RATE_VENTA: campos.rate_venta,
                    COTDETRUB_DETALLE: campos.detalle
                }).then(() => {
                    console.log('cotizacion_detalle_rubro actualizado', campos.cod_detallerubro);
                    return {
                        success: true,
                        cod_mensaje: 1031,
                        mensaje: 'cotizacion_detalle_rubro actualizado correctamente',
                        cod_detallerubro: campos.cod_detallerubro
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

module.exports.eliminar_cotizacion_detalle_rubro = async (campos) => {
    if ('cod_detallerubro' in campos) {
        try {
            var busqueda = await azureSqlClient({ CDR: "COTIZACION_DETALLE_RUBRO" })
                .where("CDR.COTDETRUB_ID", `${campos.cod_detallerubro}`)
                .first();

            if (busqueda) {
                let eliminar = await azureSqlClient("COTIZACION_DETALLE_RUBRO")
                    .where('COTDETRUB_ID', `${campos.cod_detallerubro}`)
                    .del()
                    .then(async result => {
                        console.log(result);
                        return { success: true, cod_mensaje: 1051, mensaje: 'cotizacion_detalle_rubro eliminado correctamente' };
                    }).catch((e) => {
                        console_log(e.toString());
                        return { success: false, cod_mensaje: 1052, error: e.toString() };
                    });

                return eliminar;
            } else {
                return { success: false, cod_mensaje: 1054, mensaje: 'cotizacion_detalle_rubro no fue localizado' };
            }

        } catch (error) {
            return { success: false, cod_mensaje: 1052, error: error.toString() };
        }
    } else {
        return { success: false, cod_mensaje: 1053, mensaje: 'Debe de enviar el parametro' };
    }
};

module.exports.insertar_totales_cotizacion = async (campos) => {
    console.log(campos)
    if (('totales' in campos)){
        let cont = 0
        try {
            await azureSqlClient.transaction(async (trx) => {
                for await (const total of campos.totales){
                    if(
                        ('cod_cotizaciondetalle' in total) &&
                        ('cod_rubro' in total) &&
                        ('costo_rubro' in total) && 
                        ('venta_rubro' in total) && 
                        ('cod_moneda_costo' in total) && 
                        ('cod_moneda_venta' in total) &&
                        ('entidad_id' in total) &&
                        ('cod_servicio' in total)
                    ){
                        let idnuevo = await recuperaAcualizaCorrelativoTabla({ tabla: "COTIZACION_DETALLE_RUBRO" });

                        if(idnuevo){
                             await azureSqlClient("COTIZACION_DETALLE_RUBRO")
                            .insert({
                                COTDETRUB_ID: idnuevo,
                                COTIZACIONDETALLE_ID: total.cod_cotizaciondetalle,
                                RUBRO_ID: total.cod_rubro,
                                GRUPORUBRO_NOMBRE: total.gruporubro_nombre,
                                COTDETRUB_COSTO_RUBRO: total.costo_rubro,
                                COTDETRUB_COSTO_GRUPO: total.costo_grupo,
                                COTDETRUB_VENTA_RUBRO: total.venta_rubro,
                                COTDETRUB_VENTA_GRUPO: total.venta_grupo,
                                MONEDA_COSTO_ID: total.cod_moneda_costo, 
                                MONEDA_VENTA_ID: total.cod_moneda_venta, 
                                ENTIDAD_ID: total.entidad_id,
                                SERVICIO_ID: total.cod_servicio,
                                SERVICIO_CLASIFICACION: total.clasificacion,
                                TIPO_PAGO_ID: total.cod_tipo_pago,
                                TIPO_FACTURACION_ID: total.cod_tipo_facturacion,
                                TIPO_CALCULO_ID: total.cod_tipo_calculo,
                                METODO_ID: campos.cod_metodo,
                                COTDETRUB_RATE_COSTO: campos.rate_costo,
                                COTDETRUB_RATE_VENTA: campos.rate_venta
                            })
                            cont += 1
                        } else {
                            throw new Error('No existe un correlativo valido para la tabla, consulta con IT' );
                        } 
                    } else {
                        throw new Error(`Al menos uno de los totales tienen parametros requeridos faltantes, verifique`);
                    }
                }
            })
        } catch(e){
            console.error(error);
            return {
                'success' : false, 
                "cod_mensaje" : 1044,
                'error' : error.toString()
            };
        }
       return {
            success: true,
            cod_mensaje: 1041,
            mensaje: `${cont} total(es) agregados correctamente`,
        };
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};