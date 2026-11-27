const { actualizar_actividad, insertar_resultado, getdatos_actividad } = require("../actividades/actividades");
const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal");
const { insertar_bpm_instancia } = require("../bpm/bpm_instancia");
const { registrar_bitacora_cotizacion } = require("./cotizacion_bitacora");

module.exports.getlista_cotizacion_detalle = async (campos) => {
    const estructuraConsulta = azureSqlClient({ CD: "COTIZACION_DETALLE" });

    if ('cod_cotizaciondetalle' in campos) {
        estructuraConsulta.where('CD.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`);
    }
    if ('cod_cotizacion_cabecera' in campos) {
        estructuraConsulta.where('CD.COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`);
    }
    if ('version' in campos) {
        estructuraConsulta.where('CD.COTIZACIONDETALLE_VERSION', `${campos.version}`);
    }
    if ('cod_estado' in campos) {
        estructuraConsulta.where('CD.ESTADO_ID', `${campos.cod_estado}`);
    }
    if ('cod_usuario' in campos) {
        estructuraConsulta.where('CD.USUARIO_ID', `${campos.cod_usuario}`);
    }
    if ('cod_actividad' in campos) {
        estructuraConsulta.where('CD.ACTIVIDAD_ID', `${campos.cod_actividad}`);
    }
    if ('es_spot' in campos) {
        estructuraConsulta.where('CD.COTIZACIONDETALLE_ES_SPOT', `${campos.es_spot}`);
    }
    if ('vencida' in campos) {
        estructuraConsulta.where('CD.COTIZACIONDETALLE_VENCIDA', `${campos.vencida}`);
    }

    const data = await estructuraConsulta.select(
        'CD.COTIZACIONDETALLE_ID AS COD_COTIZACIONDETALLE',
        'CD.COTIZACIONCABECERA_ID AS COD_COTIZACION_CABECERA',
        'CD.COTIZACIONDETALLE_VERSION AS VERSION',
        'CD.COTIZACIONDETALLE_FECHA_CREACION AS FECHA_CREACION',
        'CD.COTIZACIONDETALLE_FECHA_VENCIMIENTO AS FECHA_VENCIMIENTO',
        'CD.COTIZACIONDETALLE_VALOR AS TOTAL',
        'CD.ESTADO_ID AS COD_ESTADO',
        'CD.USUARIO_ID AS COD_USUARIO',
        'CD.ACTIVIDAD_ID AS COD_ACTIVIDAD',
        'CD.COTIZACIONDETALLE_SALIDA AS SALIDA',
        'CD.COTIZACIONDETALLE_TIPO_TRANSITO AS TIPO_TRANSITO',
        'CD.COTIZACIONDETALLE_OPCIONALES AS OPCIONALES',
        'CD.COTIZACIONDETALLE_TIPO_SERVICIO AS TIPO_SERVICIO',
        'CD.COTIZACIONDETALLE_OBSERVACION AS OBSERVACION',
        'CD.COTIZACIONDETALLE_TIPO_PRODUCTO AS TIPO_PRODUCTO',
        'CD.COTIZACIONDETALLE_ES_SPOT AS ES_SPOT',
        'CD.COTIZACIONDETALLE_VENCIDA AS VENCIDA'
    );

    return data;
};

module.exports.insertar_cotizacion_detalle = async (campos) => {
    if (
        ('cod_cotizacion_cabecera' in campos) &&
        ('version' in campos) &&
        ('fecha_vencimiento' in campos) &&
        ('total' in campos) &&
        ('cod_estado' in campos) 
    ) {
        let idnuevo = await recuperaAcualizaCorrelativoTabla({ tabla: "COTIZACION_DETALLE" });
        if (idnuevo > 0) {
            try {
                let resinsert = await azureSqlClient("COTIZACION_DETALLE")
                    .insert({
                        COTIZACIONDETALLE_ID: idnuevo,
                        COTIZACIONCABECERA_ID: campos.cod_cotizacion_cabecera,
                        COTIZACIONDETALLE_VERSION: campos.version,
                        COTIZACIONDETALLE_FECHA_CREACION: campos.fecha_creacion || await cropa_fecha_hora_actual(),
                        COTIZACIONDETALLE_FECHA_VENCIMIENTO: campos.fecha_vencimiento,
                        COTIZACIONDETALLE_VALOR: campos.total,
                        ESTADO_ID: campos.cod_estado,
                        USUARIO_ID: campos.cod_usuario,
                        COTIZACIONDETALLE_SALIDA: campos.salida,
                        COTIZACIONDETALLE_TIPO_TRANSITO: campos.tipo_transito,
                        COTIZACIONDETALLE_OPCIONALES: campos.opcionales,
                        COTIZACIONDETALLE_TIPO_SERVICIO: campos.tipo_servicio,
                        COTIZACIONDETALLE_OBSERVACION: campos.observacion,
                        COTIZACIONDETALLE_TIPO_PRODUCTO: campos.tipo_producto,
                        COTIZACIONDETALLE_ES_SPOT: campos.es_spot
                    }).then(async () => {
                        console.log('Nuevo cotizacion_detalle creado ID:', idnuevo);

                        await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera: campos.cod_cotizacion_cabecera, cod_cotizaciondetalle: idnuevo.toString(), cod_tipo: 'CREACION', json_modificacion : campos, tabla: "COTIZACION_DETALLE"});

                        if(!!campos.hacer_activo){
                            this.activar_cotizacion_detalle({
                                cod_cotizaciondetalle   : idnuevo,
                                cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera
                            })
                        }
                        if("cod_instancia" in campos){
                            await azureSqlClient("BPM_INSTANCIA")
                            .where('BPMINSTANCIA_ID', `${campos.cod_instancia}`)
                            .update({
                                CABECERA_ID: idnuevo,
                            })
                        }
                        return {
                            success: true,
                            cod_mensaje: 1041,
                            mensaje: 'cotizacion_detalle creado correctamente',
                            cod_cotizaciondetalle: idnuevo.toString()
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

module.exports.actualizar_cotizacion_detalle = async (campos) => {
    if (
        ('cod_cotizaciondetalle' in campos) &&
        ('cod_cotizacion_cabecera' in campos) &&
        ('version' in campos) &&
        ('fecha_vencimiento' in campos) &&
        ('total' in campos) &&
        ('cod_estado' in campos)
    ) {
        try {
            let dataActualiza = await azureSqlClient("COTIZACION_DETALLE")
                .where('COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
                .update({
                    COTIZACIONCABECERA_ID: campos.cod_cotizacion_cabecera,
                    COTIZACIONDETALLE_VERSION: campos.version,
                    COTIZACIONDETALLE_FECHA_VENCIMIENTO: campos.fecha_vencimiento,
                    COTIZACIONDETALLE_VALOR: campos.total,
                    ESTADO_ID: campos.cod_estado,
                    USUARIO_ID: campos.cod_usuario,
                    COTIZACIONDETALLE_SALIDA: campos.salida,
                    COTIZACIONDETALLE_TIPO_TRANSITO: campos.tipo_transito,
                    COTIZACIONDETALLE_OPCIONALES: campos.opcionales,
                    COTIZACIONDETALLE_TIPO_SERVICIO: campos.tipo_servicio,
                    COTIZACIONDETALLE_OBSERVACION: campos.observacion,
                    COTIZACIONDETALLE_TIPO_PRODUCTO: campos.tipo_producto,
                    COTIZACIONDETALLE_ES_SPOT: campos.es_spot
                }).then(async () => {
                    console.log('cotizacion_detalle actualizado', campos.cod_cotizaciondetalle);
                    await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera: campos.cod_cotizacion_cabecera, cod_cotizaciondetalle: campos.cod_cotizaciondetalle, cod_tipo: 'ACTUALIZA', json_modificacion : campos, tabla: "COTIZACION_DETALLE" });
                    return {
                        success: true,
                        cod_mensaje: 1031,
                        mensaje: 'cotizacion_detalle actualizado correctamente',
                        cod_cotizaciondetalle: campos.cod_cotizaciondetalle
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

module.exports.activar_cotizacion_detalle = async (campos) => {
    if (('cod_cotizaciondetalle' in campos) && ('cod_cotizacion_cabecera' in campos)){
        try {
            const lista_actualizar = await azureSqlClient("COTIZACION_DETALLE")
                .where('COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
                .where('ESTADO_ID', 1)
                .update({
                    ESTADO_ID: 2
                })
                .returning('COTIZACIONDETALLE_ID')

            for await (let cotizacion of lista_actualizar){
                await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera, cod_cotizaciondetalle: cotizacion.COTIZACIONDETALLE_ID, cod_tipo: 'CAMBIO_ESTADO', json_modificacion : {estado_id :2}, tabla: "COTIZACION_DETALLE" });
            }

            await azureSqlClient("COTIZACION_DETALLE")
                .where('COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
                .where('COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
                .update({
                    ESTADO_ID: 1
                })
            await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera, cod_cotizaciondetalle: campos.cod_cotizaciondetalle, cod_tipo: 'CAMBIO_ESTADO', json_modificacion : {estado_id :1}, tabla: "COTIZACION_DETALLE" });

            return {
                success: true,
                cod_mensaje: 1031,
                mensaje: 'cotizacion_detalle actualizado correctamente',
                cod_cotizaciondetalle: campos.cod_cotizaciondetalle
            };

        } catch (error) {
            return { success: false, cod_mensaje: 1044, error: error.toString() };
        }
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};

module.exports.anular_cotizacion_detalle = async (campos) => {
    if (('cod_cotizaciondetalle' in campos)){
        try {
            let cotizacion = await azureSqlClient("COTIZACION_DETALLE")
                .where('COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
                .update({
                    ESTADO_ID: 4
                })
                .returning('COTIZACIONCABECERA_ID')
            console.log(cotizacion)

            await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera : cotizacion[0].COTIZACIONCABECERA_ID, cod_cotizaciondetalle: campos.cod_cotizaciondetalle, cod_tipo: 'CAMBIO_ESTADO', json_modificacion : {estado_id :4}, tabla: "COTIZACION_DETALLE" });

            return {
                success: true,
                cod_mensaje: 1031,
                mensaje: 'cotizacion_detalle anulado correctamente',
                cod_cotizaciondetalle: campos.cod_cotizaciondetalle
            };

        } catch (error) {
            return { success: false, cod_mensaje: 1044, error: error.toString() };
        }
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};

module.exports.eliminar_cotizacion_detalle = async (campos) => {
    if ('cod_cotizaciondetalle' in campos) {
        try {
            var busqueda = await azureSqlClient({ CD: "COTIZACION_DETALLE" })
                .where("CD.COTIZACIONDETALLE_ID", `${campos.cod_cotizaciondetalle}`)
                .first();

            if (busqueda) {
                let eliminar = await azureSqlClient("COTIZACION_DETALLE")
                    .where('COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
                    .del()
                    .then(async result => {
                        console.log(result);
                        await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera: busqueda.COD_COTIZACION_CABECERA, cod_cotizaciondetalle: campos.cod_cotizaciondetalle, json_previo : busqueda ,cod_tipo: 'INTERACCION', json_modificacion : campos, tabla: "COTIZACION_DETALLE" });
                        return { success: true, cod_mensaje: 1051, mensaje: 'cotizacion_detalle eliminado correctamente' };
                    }).catch((e) => {
                        console_log(e.toString());
                        return { success: false, cod_mensaje: 1052, error: e.toString() };
                    });

                return eliminar;
            } else {
                return { success: false, cod_mensaje: 1054, mensaje: 'cotizacion_detalle no fue localizado' };
            }

        } catch (error) {
            return { success: false, cod_mensaje: 1052, error: error.toString() };
        }
    } else {
        return { success: false, cod_mensaje: 1053, mensaje: 'Debe de enviar el parametro' };
    }
};

module.exports.agregar_actividad_cotizacion = async (campos) => {
    if (
        ('cod_actividad' in campos) &&
        ('cod_cotizaciondetalle' in campos) 
    ) {
        try {

            let busqueda_cotizacion = await azureSqlClient("COTIZACION_DETALLE")
            .where("COTIZACIONDETALLE_ID",  campos.cod_cotizaciondetalle) 
            .first()

            if(busqueda_cotizacion){

                let busqueda_actividad = await getdatos_actividad({ cod_actividad: campos.cod_actividad })

                if(busqueda_actividad.length > 0){

                    const lowercasedObject = Object.keys(busqueda_actividad[0]).reduce((acc, key) => {
                        acc[key.toLowerCase()] = busqueda_actividad[0][key];
                        return acc;
                    }, {});

                    const actividad_actualizada = await actualizar_actividad({
                        ...lowercasedObject, 
                        cod_estado: 24  
                    })

                    if(actividad_actualizada.success){

                        const nuevo_resultado =  await insertar_resultado({
                            ...lowercasedObject,
                            actividad_padre : campos.cod_actividad,
                            descripcion     : campos.descripcion || `COTIZACION ${await cropa_fecha_actual()} - ${lowercasedObject.nombre_cliente}`
                        })

                        if(nuevo_resultado.success){
                            const cotizacion_actualizar = await azureSqlClient("COTIZACION_DETALLE")
                            .where('COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
                            .update({
                                ACTIVIDAD_ID: campos.cod_actividad,
                            })
                            .then(() => {
                                return {
                                    success: true,
                                    cod_mensaje: 1031,
                                    mensaje: 'La actividad ha sido asociada a la cotizacion',
                                };
                            }).catch((e) => {
                                console_log(e.toString());
                                return { success: false, cod_mensaje: 1042, error: e.toString() };
                            });
                            return cotizacion_actualizar
                        }
                        return nuevo_resultado
                    }
                    return actividad_actualizada
                } else {
                    return { success: false, cod_mensaje: 1054, mensaje: 'Actividad no fue localizada' };
                }
            } else {
                return { success: false, cod_mensaje: 1054, mensaje: 'cotizacion detalle no fue localizado' };
            }
        } catch (error) {
            return { success: false, cod_mensaje: 1044, error: error.toString() };
        }
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
}

module.exports.iniciar_proceso_cotizacion_detalle = async (campos) => {
    if (
        ('cod_cotizacion_cabecera' in campos) &&
        ('version' in campos) &&
        ('fecha_vencimiento' in campos) &&
        ('total' in campos) &&
        ('cod_estado' in campos) 
    ) {

        const proceso = await azureSqlClient({TC: "BPM_PROCESO"})
        .where('TC.BPMPROCESO_DESCRIPCION', 'PROCESO DETALLE COTIZACION')
        .where('TC.ESTADO_ID', 1)
        .first()

        if(proceso){
            let idnuevo = await recuperaAcualizaCorrelativoTabla({ tabla: "COTIZACION_DETALLE" });
            if (idnuevo > 0) {
                try {
                    let resinsert = await azureSqlClient("COTIZACION_DETALLE")
                        .insert({
                            COTIZACIONDETALLE_ID: idnuevo,
                            COTIZACIONCABECERA_ID: campos.cod_cotizacion_cabecera,
                            COTIZACIONDETALLE_VERSION: campos.version,
                            COTIZACIONDETALLE_FECHA_CREACION: campos.fecha_creacion || await cropa_fecha_hora_actual(),
                            COTIZACIONDETALLE_FECHA_VENCIMIENTO: campos.fecha_vencimiento,
                            COTIZACIONDETALLE_VALOR: campos.total,
                            ESTADO_ID: campos.cod_estado,
                            USUARIO_ID: campos.cod_usuario,
                            COTIZACIONDETALLE_SALIDA: campos.salida,
                            COTIZACIONDETALLE_TIPO_TRANSITO: campos.tipo_transito,
                            COTIZACIONDETALLE_OPCIONALES: campos.opcionales,
                            COTIZACIONDETALLE_JSON: campos.cotizaciondetalle_json
                        }).then(async () => {
                            console.log('Nuevo cotizacion_detalle creado ID:', idnuevo);

                            this.activar_cotizacion_detalle({
                                cod_cotizaciondetalle   : idnuevo,
                                cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera
                            })

                            const instancia = await insertar_bpm_instancia({
                                'cod_modulo': proceso.MODULO_ID,
                                'cod_bpmproceso': proceso.BPMPROCESO_ID,
                                'cod_cabecera':  idnuevo.toString(),
                                'cod_bpmnodo': proceso.BPMNODO_ID,
                                'cod_estado': 1
                            })

                            return {
                                success: true,
                                cod_mensaje: 1041,
                                mensaje: 'Cotizacion_detalle creado correctamente',
                                cod_cotizaciondetalle: idnuevo.toString(),
                                cod_instancia: instancia.cod_instancia.toString()
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
            return { success: false, cod_mensaje: 1047, mensaje: 'No existe un proceso valido para la operacion, consule con IT' };
        }
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};