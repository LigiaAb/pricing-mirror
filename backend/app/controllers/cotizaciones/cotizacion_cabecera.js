const { insertar_actividad } = require("../actividades/actividades");
const { crear_coordinacion_cotizacion } = require("../admon/embarques/coordinacion_embarque");
const { generar_html_cotizacion } = require("../admon/notificaciones/plantilla_html_cotizacion");
const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal");
const { calcular_tarifa_servicios } = require("../tarifas/tarifa");
const { registrar_bitacora_cotizacion } = require("./cotizacion_bitacora");
const { generarPDFCotizacion } = require("./generar_pdf_cotizacion");
const  axios = require("axios");

const alias = {
    cod_cotizacion_cabecera: "COTIZACIONCABECERA_ID",
    COD_COTIZACION_CABECERA: "COTIZACIONCABECERA_ID",
    cod_tarifaplantilla: "TARIFAPLANTILLA_ID",
    COD_TARIFAPLANTILLA: "TARIFAPLANTILLA_ID",
    fecha_creacion: "COTIZACIONCABECERA_FECHA",
    FECHA_CREACION: "COTIZACIONCABECERA_FECHA",
    fecha_aprobacion: "COTCAB_FECHA_APROBACION",
    FECHA_APROBACION: "COTCAB_FECHA_APROBACION",
    cod_empresa: "EMPRESA_ID",
    COD_EMPRESA: "EMPRESA_ID",
    cod_cc: "CENCO_ID",
    COD_CC: "CENCO_ID",
    entidad_id: "ENTIDAD_ID",
    ENTIDAD_ID: "ENTIDAD_ID",
    entidadcontacto_id: "ENTIDADCONTACTO_ID",
    ENTIDADCONTACTO_ID: "ENTIDADCONTACTO_ID",
    cod_tipo_servicio: "TIPO_SERVICIO_ID",
    COD_TIPO_SERVICIO: "TIPO_SERVICIO_ID",
    cod_tipo_transporte: "TIPO_TRANSPORTE_ID",
    COD_TIPO_TRANSPORTE: "TIPO_TRANSPORTE_ID",
    cod_tipo_carga: "TIPO_CARGA_ID",
    COD_TIPO_CARGA: "TIPO_CARGA_ID",
    cod_clasificacion_carga: "CLASIFICACION_CARGA_ID",
    COD_CLASIFICACION_CARGA: "CLASIFICACION_CARGA_ID",
    incoterm_id: "INCOTERM_ID",
    INCOTERM_ID: "INCOTERM_ID",
    cod_tipo_pago: "TIPO_PAGO_ID",
    COD_TIPO_PAGO: "TIPO_PAGO_ID",
    cod_puntoenlace_origen: "PUNTOENLACE_ORIGEN_ID",
    COD_PUNTOENLACE_ORIGEN: "PUNTOENLACE_ORIGEN_ID",
    cod_puntoenlace_destino: "PUNTOENLACE_DESTINO_ID",
    COD_PUNTOENLACE_DESTINO: "PUNTOENLACE_DESTINO_ID",
    cod_ciudad_origen: "CIUDAD_ORIGEN_ID",
    COD_CIUDAD_ORIGEN: "CIUDAD_ORIGEN_ID",
    cod_ciudad_destino: "CIUDAD_DESTINO_ID",
    COD_CIUDAD_DESTINO: "CIUDAD_DESTINO_ID",
    direccion_origen: "DIRECCION_ORIGEN",
    DIRECCION_ORIGEN: "DIRECCION_ORIGEN",
    direccion_destino: "DIRECCION_DESTINO",
    DIRECCION_DESTINO: "DIRECCION_DESTINO",
    entidad_id_estacion: "ENTIDAD_ID_ESTACION",
    ENTIDAD_ID_ESTACION: "ENTIDAD_ID_ESTACION",
    contacto_estacion: "CONTACTO_ESTACION",
    CONTACTO_ESTACION: "CONTACTO_ESTACION",
    cod_estado: "ESTADO_ID",
    COD_ESTADO: "ESTADO_ID",
    estado_id: "ESTADO_ID"
};

module.exports.getlista_cotizacion_cabecera = async (campos) => {
    const estructuraConsulta = azureSqlClient({ CC: "COTIZACION_CABECERA" })
    .leftJoin({ TIPSEV: "TIPO" }, function () {
        this.on( 'TIPSEV.TIPO_ID', '=', 'CC.TIPO_SERVICIO_ID');                    
    })
    .leftJoin({ PEO: "PUNTO_ENLACE" }, function () {
        this.on( 'PEO.PUNTOENLACE_ID', '=', 'CC.PUNTOENLACE_ORIGEN_ID');
    }) 
    .leftJoin({ PED: "PUNTO_ENLACE" }, function () {
        this.on( 'PED.PUNTOENLACE_ID', '=', 'CC.PUNTOENLACE_DESTINO_ID');
    }) 
    .leftJoin(
        azureSqlClient('PUNTO_ENLACE_IDENTIFICACION')
            .select('PEIDENTFICACION_CODIGO','PUNTOENLACE_ID')
            .min('PEIDENTFICACION_ID AS PEIDENTFICACION_ID')
            .whereIn('TIPO_ID', [78, 79])
            .groupBy('PEIDENTFICACION_CODIGO','PUNTOENLACE_ID')
            .as('PEDI'),
        'PEDI.PUNTOENLACE_ID', 
        'PED.PUNTOENLACE_ID'
    ) 
    .leftJoin({ CIO: "CIUDAD" }, function () {
        this.on( 'CIO.CIUDAD_ID', '=', 'CC.CIUDAD_ORIGEN_ID');
    }) 
    .leftJoin({ CID: "CIUDAD" }, function () {
        this.on( 'CID.CIUDAD_ID', '=', 'CC.CIUDAD_DESTINO_ID');
    }) 
    .leftJoin({ EN: "ENTIDAD" }, function () {
        this.on( 'EN.ENTIDAD_ID', '=', 'CC.ENTIDAD_ID');
    })
    .leftJoin({ ES: "ESTADO" }, function () {
        this.on( 'ES.ESTADO_ID', '=', 'CC.ESTADO_ID');
    })
    .leftJoin(
        azureSqlClient('COTIZACION_DETALLE')
            .select('COTIZACIONCABECERA_ID', 'USUARIO_ID', 'COTIZACIONDETALLE_FECHA_VENCIMIENTO')
            .min('COTIZACIONDETALLE_ID AS COTIZACIONDETALLE_ID')
            .where('ESTADO_ID', 1)
            .groupBy('COTIZACIONCABECERA_ID', 'USUARIO_ID', 'COTIZACIONDETALLE_FECHA_VENCIMIENTO')
            .as('VERSION_ACTIVA'),
        'VERSION_ACTIVA.COTIZACIONCABECERA_ID',
        'CC.COTIZACIONCABECERA_ID'
    )
    .leftJoin(
        azureSqlClient('COTIZACION_DETALLE_DIMENSION')
            .select('COTIZACIONDETALLE_ID')
            .max('COTDETDIM_TOTAL_VOLUMEN AS COTDETDIM_TOTAL_VOLUMEN')
            .groupBy('COTIZACIONDETALLE_ID')
            .as('VOLUMEN'),
        'VOLUMEN.COTIZACIONDETALLE_ID',
        'VERSION_ACTIVA.COTIZACIONDETALLE_ID'
    )
    .leftJoin(
        azureSqlClient('COTIZACION_DETALLE_DIMENSION')
            .select('COTIZACIONDETALLE_ID')
            .max('COTDETDIM_TOTAL_PESO AS COTDETDIM_TOTAL_PESO')
            .groupBy('COTIZACIONDETALLE_ID')
            .as('PESO'),
        'PESO.COTIZACIONDETALLE_ID',
        'VERSION_ACTIVA.COTIZACIONDETALLE_ID'
    )
    .leftJoin(
        azureSqlClient({UEP: 'USUARIO_EMPLEADO_PUESTO'})
            .select('UEP.USUARIO_ID', 'UEP.EMPLEADO_ID', 'USU.ORACLE_ID', 'EMP.EMPLEADO_NOMBRES', 'EMP.EMPLEADO_APELLIDOS')
            .max('UEP.PUESTO_ID AS MAX_PUESTO_ID')
            .groupBy('UEP.USUARIO_ID', 'UEP.EMPLEADO_ID', 'USU.ORACLE_ID', 'EMP.EMPLEADO_NOMBRES', 'EMP.EMPLEADO_APELLIDOS')
            .leftJoin({EMP: 'EMPLEADO'}, 'EMP.EMPLEADO_ID', 'UEP.EMPLEADO_ID')
            .leftJoin({USU: 'USUARIO'}, 'USU.USUARIO_ID', 'UEP.USUARIO_ID')
            .as('EMPLEADO'),
        'VERSION_ACTIVA.USUARIO_ID',
        'EMPLEADO.USUARIO_ID'
    )
    .leftJoin({ PAD: "PAIS" }, function () {
        this.on(function () {
            this.onNull('CC.CIUDAD_DESTINO_ID')
            .andOn('PED.PAIS_ID', 'PAD.PAIS_ID')
        }).orOn(function () {
            this.onNotNull('CC.CIUDAD_DESTINO_ID')
            .andOn('CID.PAIS_ID', 'PAD.PAIS_ID')
        });
    });

    if ('cod_cotizacion_cabecera' in campos) {
        estructuraConsulta.where('CC.COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`);
    }
    if ('cod_tarifaplantilla' in campos) {
        estructuraConsulta.where('CC.TARIFAPLANTILLA_ID', `${campos.cod_tarifaplantilla}`);
    }
    if(('cod_empresa' in campos)){
        estructuraConsulta.where('CC.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('CC.CENCO_ID',`${campos.cod_cc}`)
    }
    if ('entidad_id' in campos) {
        estructuraConsulta.where('CC.ENTIDAD_ID', `${campos.entidad_id}`);
    }
    if ('cod_estado' in campos) {
        estructuraConsulta.where('CC.ESTADO_ID', `${campos.cod_estado}`);
    }
    if ('cod_puntoenlace_origen' in campos) {
        estructuraConsulta.where('CC.PUNTOENLACE_ORIGEN_ID', `${campos.cod_puntoenlace_origen}`);
    }
    if ('cod_pais_origen' in campos) {
        estructuraConsulta.where('PEO.PAIS_ID', `${campos.cod_pais_origen}`);
    }
    if ('cod_puntoenlace_destino' in campos) {
        estructuraConsulta.where('CC.PUNTOENLACE_DESTINO_ID', `${campos.cod_puntoenlace_destino}`);
    }
    if ('cod_pais_destino' in campos) {
        estructuraConsulta.where('PED.PAIS_ID', `${campos.cod_pais_destino}`);
    }
    if ('cod_tipo_transporte' in campos) {
        estructuraConsulta.where('CC.TIPO_TRANSPORTE_ID', `${campos.cod_tipo_transporte}`);
    }
    if ('cod_tipo_servicio' in campos) {
        estructuraConsulta.where('CC.TIPO_SERVICIO_ID', `${campos.cod_tipo_servicio}`);
    }
    if ('cod_clasificacion_carga' in campos) {
        estructuraConsulta.where('CC.CLASIFICACION_CARGA_ID', `${campos.cod_clasificacion_carga}`);
    }
    if ('incoterm_id' in campos) {
        estructuraConsulta.where('CC.INCOTERM_ID', `${campos.incoterm_id}`);
    }
    if ('cod_tipo_pago' in campos) {
        estructuraConsulta.where('CC.TIPO_PAGO_ID', `${campos.cod_tipo_pago}`);
    }

    const data = await estructuraConsulta.select(
        'CC.COTIZACIONCABECERA_ID AS COD_COTIZACION_CABECERA',
        'CC.TARIFAPLANTILLA_ID AS COD_TARIFAPLANTILLA',
        'CC.EMPRESA_ID AS COD_EMPRESA',
        'CC.CENCO_ID AS COD_CC',
        'CC.COTIZACIONCABECERA_FECHA AS FECHA_CREACION',
        'CC.COTCAB_FECHA_APROBACION AS FECHA_APROBACION',
        'CC.ENTIDAD_ID',
        'EN.ENTIDAD_NOMBRE',
        'CC.ENTIDADCONTACTO_ID',
        'CC.TIPO_SERVICIO_ID AS COD_TIPO_SERVICIO', 
        "TIPSEV.TIPO_DESCRIPCION AS TIPO_DESCRIPCION_SERVICIO",
        'CC.TIPO_TRANSPORTE_ID AS COD_TIPO_TRANSPORTE', 
        'CC.TIPO_CARGA_ID AS COD_TIPO_CARGA',
        'CC.CLASIFICACION_CARGA_ID AS COD_CLASIFICACION_CARGA',
        'CC.INCOTERM_ID',
        'CC.TIPO_PAGO_ID AS COD_TIPO_PAGO',

        'CC.PUNTOENLACE_ORIGEN_ID AS COD_PUNTOENLACE_ORIGEN',
        'PEO.TIPO_ID AS COD_TIPO_PUNTOENLACE_ORIGEN', 
        'CC.PUNTOENLACE_DESTINO_ID AS COD_PUNTOENLACE_DESTINO',
        'PED.TIPO_ID AS COD_TIPO_PUNTOENLACE_DESTINO', 

        'CC.CIUDAD_ORIGEN_ID AS COD_CIUDAD_ORIGEN',
        'CC.DIRECCION_ORIGEN',
        'CC.CIUDAD_DESTINO_ID AS COD_CIUDAD_DESTINO',
        'CC.DIRECCION_DESTINO',

        'ES.ESTADO_DESCRIPCION AS ESTADO_NOMBRE',
        azureSqlClient.raw('ROUND(VOLUMEN.COTDETDIM_TOTAL_VOLUMEN, 2) AS VOLUMEN'),
        azureSqlClient.raw('ROUND(PESO.COTDETDIM_TOTAL_PESO, 2) AS PESO'),


        azureSqlClient.raw(`
        CONCAT(
            CASE 
                WHEN CC.CIUDAD_DESTINO_ID IS NOT NULL THEN CID.CIUDAD_NOMBRE
                WHEN CC.PUNTOENLACE_DESTINO_ID IS NOT NULL THEN PEDI.PEIDENTFICACION_CODIGO
                ELSE CC.DIRECCION_DESTINO
            END,
            ' / ',
            CASE 
                WHEN PAD.PAIS_NOMBRE IS NOT NULL THEN PAD.PAIS_NOMBRE
                ELSE NULL
            END
        ) AS DESTINO
        `),

        azureSqlClient.raw(`
         CASE 
                WHEN CC.PUNTOENLACE_ORIGEN_ID IS NOT NULL THEN PEO.PAIS_ID
                ELSE CIO.PAIS_ID
            END AS COD_PAIS_ORIGEN
        `),

        azureSqlClient.raw(`
         CASE 
                WHEN NULLIF(TRIM(EMPLEADO.ORACLE_ID), '') IS NOT NULL THEN TRIM(EMPLEADO.ORACLE_ID)
                ELSE CONCAT(EMPLEADO.EMPLEADO_NOMBRES, ' ', EMPLEADO.EMPLEADO_APELLIDOS) 
            END AS USUARIO
        `),

        azureSqlClient.raw(`
         CASE 
                WHEN CC.PUNTOENLACE_DESTINO_ID IS NOT NULL THEN PED.PAIS_ID
                ELSE CID.PAIS_ID
            END AS COD_PAIS_DESTINO
        `),

        'CC.ENTIDAD_ID_ESTACION',
        'CC.CONTACTO_ESTACION',

        'CC.ESTADO_ID AS COD_ESTADO',

        'VERSION_ACTIVA.COTIZACIONDETALLE_FECHA_VENCIMIENTO AS FECHA_VENCIMIENTO',
        
        'VERSION_ACTIVA.COTIZACIONDETALLE_ID AS COD_VERSION_ACTIVA'
    );

    return data;
};

module.exports.insertar_cotizacion_cabecera = async (campos) => {
    if (
        ('cod_empresa' in campos) &&
        ('cod_cc' in campos) &&
        ('entidad_id' in campos) &&
        ('cod_tipo_servicio' in campos) &&
        ('cod_tipo_transporte' in campos) &&
        ('incoterm_id' in campos) &&
        ('cod_tipo_pago' in campos) &&
        ('cod_tipo_carga' in campos) &&
        ('cod_clasificacion_carga' in campos) &&
        ('cod_puntoenlace_origen' in campos) &&
        ('cod_puntoenlace_destino' in campos)
    ) {
        console.log("campos:", campos)
        let idnuevo = await recuperaAcualizaCorrelativoTabla({ tabla: "COTIZACION_CABECERA" });
        if (idnuevo > 0) {
            try {
                let resinsert = await azureSqlClient("COTIZACION_CABECERA")
                    .insert({
                        COTIZACIONCABECERA_ID: idnuevo,
                        TARIFAPLANTILLA_ID: campos.COD_TARIFAPLANTILLA,
                        EMPRESA_ID: campos.cod_empresa,
                        CENCO_ID: campos.cod_cc,
                        COTIZACIONCABECERA_FECHA: campos.fecha_creacion || await cropa_fecha_hora_actual(),
                        COTCAB_FECHA_APROBACION: campos.fecha_aprobacion,
                        ENTIDAD_ID: campos.entidad_id,
                        ENTIDADCONTACTO_ID: campos.entidadcontacto_id,
                        TIPO_SERVICIO_ID: campos.cod_tipo_servicio,
                        TIPO_TRANSPORTE_ID: campos.cod_tipo_transporte,
                        INCOTERM_ID: campos.incoterm_id,
                        TIPO_PAGO_ID: campos.cod_tipo_pago,
                        TIPO_CARGA_ID: campos.cod_tipo_carga,
                        CLASIFICACION_CARGA_ID: campos.cod_clasificacion_carga,
                        PUNTOENLACE_ORIGEN_ID: campos.cod_puntoenlace_origen,
                        PUNTOENLACE_DESTINO_ID: campos.cod_puntoenlace_destino,
                        CIUDAD_ORIGEN_ID: campos.cod_ciudad_origen,
                        CIUDAD_DESTINO_ID: campos.cod_ciudad_destino,
                        DIRECCION_ORIGEN: campos.direccion_origen,
                        DIRECCION_DESTINO: campos.direccion_destino,
                        ENTIDAD_ID_ESTACION: campos.entidad_id_estacion,
                        CONTACTO_ESTACION: campos.contacto_estacion,
                        ESTADO_ID: campos.cod_estado
                    }).then(async () => {
                        console.log('Nueva cotizacion_cabecera creada ID:', idnuevo);

                        if(!campos.solicitud){
                            await insertar_actividad({
                                asunto: `SEGUIMIENTO COTIZACIÓN #${idnuevo.toString()}`,
                                descripcion: `SEGUIMIENTO COTIZACIÓN #${idnuevo.toString()}`,
                                cod_tipo: 65,
                                fecha_programada: campos.fecha_creacion || await cropa_fecha_hora_actual(),
                                cod_cliente: campos.entidad_id,
                                contactos: campos.entidadcontacto_id,
                                cod_emp: campos.cod_empresa,
                                cod_cc: campos.cod_cc,
                                cod_asesor: !!campos.usuario ? campos.usuario : global.usuario?.USUARIO_ID,
                                cod_estado: 23,
                                cod_documento: idnuevo.toString()
                            })
                        }
                        
                        // La funcion dentro de BPM, por lo que se actualiza la instancia
                        if("cod_instancia" in campos){
                            await azureSqlClient("BPM_INSTANCIA")
                            .where('BPMINSTANCIA_ID', `${campos.cod_instancia}`)
                            .update({
                                CABECERA_ID: idnuevo.toString(),
                            })
                        }

                        //BITACORA DE CREACION
                        await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera : idnuevo.toString() , cod_tipo: 'CREACION', json_modificacion : campos, tabla: "COTIZACION_CABECERA"});

                        return {
                            success: true,
                            cod_mensaje: 1041,
                            mensaje: 'cotizacion_cabecera creado correctamente',
                            cod_cotizacion_cabecera: idnuevo.toString()
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

module.exports.actualizar_cotizacion_cabecera = async (campos) => {
    if (
        ('cod_cotizacion_cabecera' in campos)/*  &&
        ('cod_empresa' in campos) &&
        ('cod_cc' in campos) &&
        ('entidad_id' in campos) &&
        ('cod_tipo_servicio' in campos) &&
        ('cod_tipo_transporte' in campos) &&
        ('incoterm_id' in campos) &&
        ('cod_tipo_pago' in campos) &&
        ('cod_tipo_carga' in campos) &&
        ('cod_clasificacion_carga' in campos) &&
        ('cod_puntoenlace_origen' in campos) &&
        ('cod_puntoenlace_destino' in campos) &&
        ('cod_estado' in campos) */
    ) {
        try {
            const camposConocidos = Object.fromEntries(
                Object.entries(campos).filter(([key]) => Object.hasOwn(alias, key))
            );
            const columnas = Object.keys(camposConocidos).filter(key => alias[key] !== 'COTIZACIONCABECERA_ID').map(key => alias[key]);
            if (new Set(columnas).size !== columnas.length) return { success: false, cod_mensaje: 1043, mensaje: 'Se enviaron varios alias para una misma columna' };
            const camposUpdate = Object.fromEntries(Object.entries(camposConocidos)
                .filter(([key]) => alias[key] !== 'COTIZACIONCABECERA_ID')
                .map(([key, value]) => [alias[key], value]));
            if (!Object.keys(camposUpdate).length) return { success: false, cod_mensaje: 1043, mensaje: 'No se enviaron campos para actualizar' };

            let dataActualiza = await azureSqlClient("COTIZACION_CABECERA")
            // ... igual que antes
                .where('COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
                .update(camposUpdate).then(async () => {
                    console.log('cotizacion_cabecera actualizada', campos.cod_cotizacion_cabecera);
                    //BITACORA DE ACTUALIZACION
                    await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera, cod_tipo: 'ACTUALIZA', json_modificacion : campos, tabla: "COTIZACION_CABECERA" });

                    if(campos.cod_estado == 53){
                         await this.cerrar_seguimientos_auto({cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera, cod_tipo: 68})
                    }
                    if(campos.cod_estado == 54){
                         await this.cerrar_seguimientos_auto({cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera, cod_tipo: 67})
                    }

                    return {
                        success: true,
                        cod_mensaje: 1031,
                        mensaje: 'cotizacion_cabecera actualizada correctamente',
                        cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera
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

module.exports.eliminar_cotizacion_cabecera = async (campos) => {
    if (('cod_cotizacion_cabecera' in campos)) {
        try {
            var busqueda = await azureSqlClient({ CC: "COTIZACION_CABECERA" })
                .where("CC.COTIZACIONCABECERA_ID", `${campos.cod_cotizacion_cabecera}`)
                .first();

            if (busqueda) {
                let eliminar = await azureSqlClient("COTIZACION_CABECERA")
                    .where('COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
                    .del()
                    .then(async result => {
                        console.log(result);
                        //BITACORA DE ELIMINACION
                        await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera, json_previo : busqueda ,cod_tipo: 'INTERACCION', json_modificacion : campos, tabla: "COTIZACION_CABECERA" });
                        return { success: true, cod_mensaje: 1051, mensaje: 'cotizacion_cabecera eliminada correctamente' };
                    }).catch((e) => {
                        console_log(e.toString());
                        return { success: false, cod_mensaje: 1052, error: e.toString() };
                    });

                return eliminar;
            } else {
                return { success: false, cod_mensaje: 1054, mensaje: 'cotizacion_cabecera no fue localizada' };
            }

        } catch (error) {
            return { success: false, cod_mensaje: 1052, error: error.toString() };
        }
    } else {
        return { success: false, cod_mensaje: 1053, mensaje: 'Debe de enviar el parametro' };
    }
};

module.exports.rechazar_cotizacion_cabecera = async (campos) => {
    if (('cod_cotizacion_cabecera' in campos)){
        try {
            await azureSqlClient("COTIZACION_CABECERA")
                .where('COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
                .update({
                    ESTADO_ID: 53
                })
            
            await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera , cod_tipo: 'CAMBIO_ESTADO', json_modificacion : campos, tabla: "COTIZACION_CABECERA" });
            await this.cerrar_seguimientos_auto({cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera, cod_tipo: 68})

            return {
                success: true,
                cod_mensaje: 1031,
                mensaje: 'Cotizacion rechazada',
                cod_cotizacion_cabecera: campos.cod_cotizacion_cabecera
            };

        } catch (error) {
            return { success: false, cod_mensaje: 1044, error: error.toString() };
        }
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};

module.exports.confirmar_cotizacion_cabecera = async (campos) => {
    if (('cod_cotizacion_cabecera' in campos)){
        try {
            await azureSqlClient("COTIZACION_CABECERA")
                .where('COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
                .update({
                    ESTADO_ID: 54,
                    COTCAB_FECHA_APROBACION: campos.fecha_aprobacion || await cropa_fecha_hora_actual(),
                })

            const cotizacion_detalle = await azureSqlClient("COTIZACION_DETALLE")
                .where({
                    COTIZACIONCABECERA_ID: campos.cod_cotizacion_cabecera,
                    ESTADO_ID : 1
                })
                .first();

            await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera , cod_tipo: 'CAMBIO_ESTADO', json_modificacion : campos, tabla: "COTIZACION_CABECERA" });
            await this.cerrar_seguimientos_auto({cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera, cod_tipo: 67})
            const res_embarque = await crear_coordinacion_cotizacion({cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera })
            
            if(!!cotizacion_detalle){
                await require("./cotizacion_documentosj").enviar_cotizacion({
                    cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera,  cod_cotizaciondetalle: cotizacion_detalle.COTIZACIONDETALLE_ID, embarque_id: res_embarque.cod_embarque
                })
            }

            return {
                success: true,
                cod_mensaje: 1031,
                mensaje: 'Cotizacion confirmada',
                cod_cotizacion_cabecera: campos.cod_cotizacion_cabecera,
                res_embarque: res_embarque
            };

        } catch (error) {
            return { success: false, cod_mensaje: 1044, error: error.toString() };
        }
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};

module.exports.getdetalles_cotizacion = async (campos) => {
    if ('cod_cotizaciondetalle' in campos) {

        const consulta_cotizacion = azureSqlClient({ CD: "COTIZACION_DETALLE" })
        .leftJoin({ CC: "COTIZACION_CABECERA" }, function () {
            this.on( 'CC.COTIZACIONCABECERA_ID', '=', 'CD.COTIZACIONCABECERA_ID');
        })   
        .leftJoin({ CCO: "CENTRO_COSTO" }, function () {
            this.on( 'CC.CENCO_ID', '=', 'CCO.CENCOS_ID');
        })  
        .leftJoin({ CL: "ENTIDAD" }, function () {
            this.on( 'CL.ENTIDAD_ID', '=', 'CC.ENTIDAD_ID');
        }) 
        .leftJoin({ PEO: "PUNTO_ENLACE" }, function () {
            this.on( 'PEO.PUNTOENLACE_ID', '=', 'CC.PUNTOENLACE_ORIGEN_ID');
        }) 
        .leftJoin({ PO: "PAIS" }, function () {
            this.on( 'PO.PAIS_ID', '=', 'PEO.PAIS_ID');
        }) 
        .leftJoin({ PED: "PUNTO_ENLACE" }, function () {
            this.on( 'PED.PUNTOENLACE_ID', '=', 'CC.PUNTOENLACE_DESTINO_ID');
        }) 
        .leftJoin({ PD: "PAIS" }, function () {
            this.on( 'PD.PAIS_ID', '=', 'PED.PAIS_ID');
        }) 
        .leftJoin({ IT: "INCOTERM" }, function () {
            this.on( 'IT.INCOTERM_ID', '=', 'CC.INCOTERM_ID');
        }) 
        .leftJoin({ UE: "USUARIO_EMPLEADO_PUESTO" }, function () {
            this.on( 'UE.USUARIO_ID', '=', 'CD.USUARIO_ID');
        })
        .leftJoin({ E: "EMPLEADO" }, function () {
            this.on( 'E.EMPLEADO_ID', '=', 'UE.EMPLEADO_ID');
        })
        .leftJoin({ P: "PUESTO" }, function () {
            this.on( 'P.PUESTO_ID', '=', 'UE.PUESTO_ID');
        })
        .where('CD.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
        

        const data_cotizacion = await consulta_cotizacion.first(
            'CC.COTIZACIONCABECERA_ID AS COD_COTIZACION_CABECERA',
            'CC.TARIFAPLANTILLA_ID AS COD_TARIFAPLANTILLA',
            'CCO.CENCOS_CODCROPA AS COD_CENCO',
            'CC.COTIZACIONCABECERA_FECHA AS FECHA_CREACION',
            'CC.COTCAB_FECHA_APROBACION AS FECHA_APROBACION',
            'CC.ENTIDAD_ID',
            'CL.ENTIDAD_NOMBRE',
            'CC.TIPO_TRANSPORTE_ID AS COD_TIPO_TRANSPORTE', 
            'PO.PAIS_NOMBRE AS PAIS_ORIGEN', 
            'PEO.PUNTOENLACE_NOMBRE AS PUNTOENLACE_ORIGEN', 
            'PD.PAIS_NOMBRE AS PAIS_DESTINO', 
            'PED.PUNTOENLACE_NOMBRE AS PUNTOENLACE_DESTINO', 
            'CD.COTIZACIONDETALLE_VERSION AS VERSION',
            'IT.INCOTERM_CODIGO',
            'CD.COTIZACIONDETALLE_FECHA_VENCIMIENTO AS FECHA_VENCIMIENTO',
            'E.EMPLEADO_NOMBRES',
            'E.EMPLEADO_APELLIDOS',
            'P.PUESTO_DESCRIPCION AS PUESTO_DESC' ,
            'CD.COTIZACIONDETALLE_JSON'
        );

        if(!data_cotizacion){
            return { success: false, cod_mensaje: 1043, mensaje: 'Cotizacion no encontrada' };
        }

        const datos = {
            fecha_actual: `${new Date().toLocaleDateString()}`,
            cenco: data_cotizacion.COD_CENCO,
            cod_cotizacion_cabecera: data_cotizacion.COD_COTIZACION_CABECERA,
            ano: `${new Date(data_cotizacion.FECHA_CREACION).getFullYear()}`,
            version: data_cotizacion.VERSION,
            entidad_id: data_cotizacion.ENTIDAD_ID,
            cliente: data_cotizacion.ENTIDAD_NOMBRE,
            tipo_transporte: data_cotizacion.COD_TIPO_TRANSPORTE == 49 ? 0 : data_cotizacion.COD_TIPO_TRANSPORTE == 50 ? 1 : 2, //0=Aereo, 1= Maritimo, 2=Terrestre
            incoterm: data_cotizacion.INCOTERM_CODIGO ,
            origen: data_cotizacion.PUNTOENLACE_ORIGEN,
            destino: data_cotizacion.PUNTOENLACE_DESTINO,
			pais_origen: data_cotizacion.PAIS_ORIGEN,
            pais_destino: data_cotizacion.PAIS_DESTINO,
            fecha_vencimiento: `${new Date(data_cotizacion.FECHA_VENCIMIENTO).toLocaleDateString()}`,
            tiempo_transito: "-",
            nombre_creador: `${data_cotizacion.EMPLEADO_NOMBRES} ${data_cotizacion.EMPLEADO_APELLIDOS}`,
            puesto_creador: `${data_cotizacion.PUESTO_DESC}`,
            descargar: false
        };

        let items = []
        if(!data_cotizacion.COTIZACIONDETALLE_JSON){
            const consulta_rubros = await azureSqlClient({ CDR: "COTIZACION_DETALLE_RUBRO" })
            .leftJoin({ R: "RUBRO" }, function () {
                this.on( 'CDR.RUBRO_ID', '=', 'R.RUBRO_ID');
            }) 
            .leftJoin({ M: "MONEDA" }, function () {
                this.on( 'M.MONEDA_ID', '=', 'CDR.MONEDA_VENTA_ID');
            }) 
            .where('CDR.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
            .select(
                'CDR.GRUPORUBRO_NOMBRE AS rubro',
                'CDR.COTDETRUB_DETALLE AS detalle',
                // 'CDR.GRUPORUBRO_NOMBRE AS detalle',
                'M.MONEDA_SIMBOLO AS moneda',
                // 'CDR.COTDETRUB_VENTA_RUBRO as monto'
                azureSqlClient.raw(`
                    SUM(CDR.COTDETRUB_VENTA_RUBRO) AS monto
                `)
            )
            .groupBy(
                'CDR.GRUPORUBRO_NOMBRE',
                'M.MONEDA_SIMBOLO',
                'CDR.COTDETRUB_DETALLE',
            )
            items = consulta_rubros
        } else {
            items = await this.procesar_json_resultados({ json: data_cotizacion.COTIZACIONDETALLE_JSON })
        }

        const consulta_criterios = await azureSqlClient({ CDC: "COTIZACION_DETALLE_CRITERIO" })
            .leftJoin({ C: "CRITERIO" }, function () {
                this.on( 'C.CRITERIO_ID', '=', 'CDC.CRITERIO_ID');
            })  
            .where('CDC.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`)
            .whereIn('C.CRITERIO_ID', [1, 2, 3, 4, 5])
            .select(
                'C.CRITERIO_DESCRIPCION as criterio',
                'CDC.DETCOTCRITERIO_VALOR as valor',
            )
            .groupBy(
                'C.CRITERIO_DESCRIPCION',
                'CDC.DETCOTCRITERIO_VALOR',
            ) 
        
        return {
            success: true,
            cod_mensaje: 1041,
            mensaje: 'PDF generado',
            datos: datos,
            items: items,
            opcionales: await this.getrubros_opcionales({cod_cotizaciondetalle: campos.cod_cotizaciondetalle}),
            criterios: consulta_criterios
        }
         
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};

module.exports.getrubros_opcionales = async ({ cod_cotizaciondetalle }) => {

    const cabecera = await azureSqlClient({ CD: "COTIZACION_DETALLE" })
    .leftJoin({ CC: "COTIZACION_CABECERA" }, function () {
        this.on( 'CC.COTIZACIONCABECERA_ID', '=', 'CD.COTIZACIONCABECERA_ID');
    }) 
    .where('CD.COTIZACIONDETALLE_ID', `${cod_cotizaciondetalle}`)
    .first(
        'CC.TIPO_SERVICIO_ID AS cod_tipo_servicio',
        'CC.TIPO_TRANSPORTE_ID AS cod_tipo_transporte',
        'CC.ENTIDAD_ID AS entidad_id',
        'CC.EMPRESA_ID AS cod_empresa',
        'CC.CENCO_ID AS cod_cc',
    )

    const rubros_presentes = await azureSqlClient({ CDR: "COTIZACION_DETALLE_RUBRO" })
    .where('CDR.COTIZACIONDETALLE_ID', `${cod_cotizaciondetalle}`)
    .select(
        'CDR.RUBRO_ID'
    )

    const monedas = await azureSqlClient({ M: "MONEDA" })
    .select(
        'M.MONEDA_ID',
        'M.MONEDA_SIMBOLO'
    )

    const criterios = await azureSqlClient({ CDC: "COTIZACION_DETALLE_CRITERIO" })
    .leftJoin({ C: "CRITERIO" }, function () {
        this.on( 'CDC.CRITERIO_ID', '=', 'C.CRITERIO_ID');
    }) 
    .where('CDC.COTIZACIONDETALLE_ID', `${cod_cotizaciondetalle}`)
    .select(
        'C.CRITERIO_ID',
        'C.CRITERIO_CAMPO',
        'CDC.DETCOTCRITERIO_VALOR'
    )
    
    let campos = {
        ...cabecera,
        interna: true
    }

    for(const criterio of criterios){
        campos[criterio.CRITERIO_CAMPO] = criterio.DETCOTCRITERIO_VALOR
    }

    let resultados = await calcular_tarifa_servicios(campos)
    resultados = resultados.filter(resultado => !rubros_presentes.find(rubro => rubro.RUBRO_ID == resultado.COD_RUBRO))

    return resultados.map(resultado => ({
        id: resultado.COD_RUBRO,
        rubro: resultado.NOMBRE_RUBRO,
        detalle: "",
        moneda: monedas.find(moneda => moneda.MONEDA_ID == resultado.METODO.COD_MONEDA_VENTA)?.MONEDA_SIMBOLO || "",
        monto: resultado.METODO.VENTA,
        opcion: 'S'
    }))
}

module.exports.procesar_json_resultados = async ({ json }) => {

    let json_array = JSON.parse(json)
    let items = []

    for(let rubro of json_array){
        
        let metodo = rubro["s"]["metodo"] || rubro["s"]["porcentaje"]
        let detalle_string = ""

        for(let i in metodo["detalles"]){
            let detalle = metodo["detalles"][i]
            detalle_string = `${detalle_string}${detalle["tipo_desc"]} ${detalle["tarifadetalle_descripcion"] || detalle["tarifadetalle_valor"]}`
            if((i + 1) < metodo["detalles"].length){
                detalle_string = `${detalle_string}, `
            }
        }

        let rubro_data = {
            "rubro": rubro["r"]["nombre_rubro"],
            "detalle": detalle_string,
            "monto": metodo["venta"],
            "moneda": metodo["moneda_venta"]["simbolo_moneda"]
        }

        items.push(rubro_data)
    }
    return items
}

module.exports.validar_elegibilidad_cotizacion = async (campos) => {
    if ('cod_cotizacion_cabecera' in campos) {

        const estructuraConsulta = azureSqlClient({ CC: "COTIZACION_CABECERA" })
            .leftJoin({ CD: "COTIZACION_DETALLE" }, function () {
                this.on("CC.COTIZACIONCABECERA_ID", "=", "CD.COTIZACIONCABECERA_ID")
                    .andOn("CD.ESTADO_ID", "=", azureSqlClient.raw("?", [1]));
                if ("cod_cotizaciondetalle" in campos) this.andOn("CD.COTIZACIONDETALLE_ID", "=", azureSqlClient.raw("?", [campos.cod_cotizaciondetalle]));
            })
            .where("CC.COTIZACIONCABECERA_ID", campos.cod_cotizacion_cabecera)
            .where("CC.ESTADO_ID", 1);
        const data_cotizacion = await estructuraConsulta.first(
            "CC.COTIZACIONCABECERA_ID",
            "CD.COTIZACIONDETALLE_ID",
            "CD.COTIZACIONDETALLE_VERSION AS VERSION",
            "CD.COTIZACIONDETALLE_FECHA_VENCIMIENTO",
            azureSqlClient.raw(`CASE WHEN EXISTS (
                SELECT 1 FROM COTIZACION_DETALLE
                WHERE COTIZACIONCABECERA_ID = CC.COTIZACIONCABECERA_ID
            ) THEN 1 ELSE 0 END AS TIENE_VERSIONES`)
        );
        // VALIDAR ESTADO / EXISTENCIA DE COTIZACION
        if (!data_cotizacion) return { success: false, mensaje: "La cotizacion no esta activa o no existe" };
        // VALIDAR QUE LA VERSION SEA VALIDA
        if (!data_cotizacion.TIENE_VERSIONES) return { success: false, mensaje: "No existen versiones disponibles" };
        // VALIDAR QUE LA VERSION ESTE ACTIVA
        if (data_cotizacion.COTIZACIONDETALLE_ID == null) return { success: false, mensaje: "No existen versiones activas" };
        // VALIDAR QUE LA VERSION ACTIVA ESTE VIGENTE 
        if (data_cotizacion.COTIZACIONDETALLE_FECHA_VENCIMIENTO && new Date(data_cotizacion.COTIZACIONDETALLE_FECHA_VENCIMIENTO) < new Date()) return { success: false, mensaje: "La versión está vencida" };
        
        const consulta_rubros = await azureSqlClient({ CDR: "COTIZACION_DETALLE_RUBRO" })
        .leftJoin({ R: "RUBRO" }, function () {
            this.on( 'R.RUBRO_ID', '=', 'CDR.RUBRO_ID');
        }) 
        .leftJoin({ M: "METODO" }, function () {
            this.on( 'M.METODO_ID', '=', 'CDR.METODO_ID');
        }) 
        .leftJoin({ S: "SERVICIO" }, function () {
            this.on( 'S.SERVICIO_ID', '=', 'M.SERVICIO_ID');
        }) 
        .where('CDR.COTIZACIONDETALLE_ID', `${data_cotizacion.COTIZACIONDETALLE_ID}`)
        .whereNot('CDR.RUBRO_ID', 133)
        .select(
            'CDR.COTDETRUB_ID',
            'CDR.RUBRO_ID ',
            'R.ESTADO_ID AS RUBRO_ESTADO_ID',
            'M.SERVICIO_ID ',
            'S.ESTADO_ID AS SERVICIO_ESTADO_ID',
            'CDR.METODO_ID',
            // 'M.METODO_FECHA_INICIAL',
            azureSqlClient.raw('CAST(M.METODO_FECHA_INICIAL AS DATE) AS METODO_FECHA_INICIAL' ),
            // 'M.METODO_FECHA_FINAL',
            azureSqlClient.raw('CAST(M.METODO_FECHA_FINAL AS DATE) AS METODO_FECHA_FINAL' ),
            'M.ESTADO_ID AS METODO_ESTADO_ID',
        )

        const errores = []
        const fecha_actual = new Date(await cropa_fecha_actual())
        
        consulta_rubros.forEach(rubro => {

            const fecha_inicial = new Date(rubro.METODO_FECHA_INICIAL);
            const fecha_final = new Date(rubro.METODO_FECHA_FINAL);      

            if(rubro.RUBRO_ESTADO_ID != 1){
                errores.push(`Tarifa #${rubro.SERVICIO_ID}: El rubro no se encuentra activo.`)
            }
            else if(rubro.SERVICIO_ESTADO_ID != 1){
                errores.push(`Tarifa #${rubro.SERVICIO_ID}: Ta tarifa no se encuentra activa.`)
            }
            else if(rubro.METODO_ESTADO_ID != 1){
                errores.push(`Tarifa #${rubro.SERVICIO_ID}: El metodo de calculo no se encuentra activo.`)
            }
            else if(!!rubro.METODO_FECHA_INICIA && fecha_inicial.getTime() > fecha_actual.getTime()){
                errores.push(`Tarifa #${rubro.SERVICIO_ID}: La tarifa aún no se encuentra activa (Fecha de inicio: ${fecha_inicial.toLocaleDateString('es-GT')}).`)
            }
            else if(!!rubro.METODO_FECHA_FINAL && fecha_final.getTime() < fecha_actual.getTime()){
                errores.push(`Tarifa #${rubro.SERVICIO_ID}: La tarifa se encuentra vencida (Fecha de vencimiento: ${fecha_final.toLocaleDateString('es-GT')}).`)
            }
        });

        return {
            success: errores.length == 0,
            cod_mensaje: 1041,
            mensaje: errores.length > 0 ? "La cotización no es elegible para confirmación." : "La tarifa puede confirmarse.",
            // rubros: consulta_rubros,
            errores: errores,
        }
         
    } else {
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
};

// SEGUIMIENTOS
module.exports.cerrar_seguimiento = async (campos) => {
    if("cod_actividad" in campos && "cod_tipo" in campos){

        const cotizacion_oracle = await azureSqlClient("ACTIVIDAD_COTIZACION")
        .where("ACTIVIDAD_ID", campos.cod_actividad)
        .select(
            "EMP_CODIGO", 
            "CABCOT_NUMERO",
            "DEPORG_CODIGO",
            "TIPDOC_CODIGO",
            "ACTIVIDAD_ID"
        ).first()
        
        if(cotizacion_oracle){
            // LA COTIZACION SE ENCUENTRA EN ORACLE
            const url_servicio = `${process.env.URL_NODE_CLIENTE}/api/azureapp/cerrar-seguimiento`;

            //confir basica de la peticion
            const config = {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                };

            const resultado_peticion = await axios.post(url_servicio, campos, config)
                .then(async response => {
                    console_log("Respuesta de peticion de la api");
                    console_log(JSON.stringify(response.data));
                    return (response.data.data);
                })
                .catch(async error => {                            
                    console.error('Error al realizar la petición de la api :', url_servicio , error);
                    return {'success' : false,"cod_mensaje" : 1060, 'mensaje' : `Error al consumir servicio api. ${url_servicio}`};
                })

            return resultado_peticion;
        } else {
            // LA COTIZACION SE ENCUENTRA EN AZURE
            const actividad =  await azureSqlClient({"AC": "ACTIVIDAD"}) 
            .where('AC.ACTIVIDAD_ID',`${campos.cod_actividad}`)
            .first(
                "AC.ACTIVIDAD_COD_DOCUMENTO AS COD_DOCUMENTO"
            );

            if(!!actividad.COD_DOCUMENTO){
                try {
                    await azureSqlClient("ACTIVIDAD") 
                    .where('ACTIVIDAD_COD_DOCUMENTO',`${actividad.COD_DOCUMENTO}`)
                    .where('ESTADO_ID', 23)
                    .update({
                        "ESTADO_ID": 24
                    });

                } catch (e){
                    console_error(e)
                }

                if(Number(campos.cod_tipo) == 67){
                    return await this.confirmar_cotizacion_cabecera({
                        cod_cotizacion_cabecera: actividad.COD_DOCUMENTO
                    })
                } 
                else if(Number(campos.cod_tipo) == 289 && 'cod_cotizacion_cabecera' in campos){

                    try {
                        await azureSqlClient("ACTIVIDAD") 
                        .where('ACTIVIDAD_COD_DOCUMENTO',`${campos.cod_cotizacion_cabecera}`)
                        .where('ESTADO_ID', 23)
                        .update({
                            "ESTADO_ID": 24
                        });
                    } catch (e){
                        console_error(e)
                    }

                    await this.confirmar_cotizacion_cabecera({
                        cod_cotizacion_cabecera: campos.cod_cotizacion_cabecera
                    })
                    return await this.rechazar_cotizacion_cabecera({
                        cod_cotizacion_cabecera: actividad.COD_DOCUMENTO
                    })
                }
                else {
                    return await this.rechazar_cotizacion_cabecera({
                        cod_cotizacion_cabecera: actividad.COD_DOCUMENTO
                    })
                }
                
            }
            return {'success' : false, 'mensaje' : `La actividad no se encuentra asociada con una cotización`};
            
        }
    } 
    return {'success' : false, 'mensaje' : `Faltan parametros`};
}

module.exports.cerrar_seguimientos_auto = async (campos) => {
   try {
     if("cod_cotizacion_cabecera" in campos && "cod_tipo" in campos){

        const tipo = await azureSqlClient({"T": "TIPO"}) 
        .where('T.TIPO_ID',`${campos.cod_tipo}`)
        .first("T.TIPO_DESCRIPCION");

        const actividades =  await azureSqlClient({"AC": "ACTIVIDAD"}) 
        .where('AC.ACTIVIDAD_COD_DOCUMENTO',`${campos.cod_cotizacion_cabecera}`)
        .select("*");

        for await (let actividad of actividades){
            await azureSqlClient("ACTIVIDAD") 
                .where('ACTIVIDAD_ID',`${actividad.ACTIVIDAD_ID}`)
                .update({
                    "ESTADO_ID": 24
                });
            
            const  idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'ACTIVIDAD_RESULTADO'});
            if(idnuevo > 0){
                await azureSqlClient("ACTIVIDAD_RESULTADO")
                    .insert({
                        "ACTIVIDAD_RESULTADO_ID"            : idnuevo,
                        "ACTIVIDAD_RESULTADO_FECHA"         : await cropa_fecha_hora_actual(),
                        "TIPO_ID"                           : campos.cod_tipo,
                        "ESTADO_ID"                         : 24,
                        "ACTIVIDAD_ID"                      : actividad.ACTIVIDAD_ID,
                        "ACTIVIDAD_RESULTADO_DESCRIPCION"   : `${tipo.TIPO_DESCRIPCION} - ${await cropa_fecha_hora_actual()}`,
                        "ACTIVIDAD_RESULTADO_ACTIVIDAD"     : null,
                    })
            }   
            
        }

        return {'success' : true, 'mensaje' : `Seguimientos cerrados con exito`};
    } 
    return {'success' : false, 'mensaje' : `Faltan parametros`};
   }catch (e) {
    console_error(e.message);
   }
}

module.exports.generar_reporte_cotizaciones = async (campos) => {
    const estructuraConsulta = azureSqlClient({ CC: "COTIZACION_CABECERA" })
    .leftJoin({ PEO: "PUNTO_ENLACE" }, function () {
        this.on( 'PEO.PUNTOENLACE_ID', '=', 'CC.PUNTOENLACE_ORIGEN_ID');
    }) 
    .leftJoin({ PED: "PUNTO_ENLACE" }, function () {
        this.on( 'PED.PUNTOENLACE_ID', '=', 'CC.PUNTOENLACE_DESTINO_ID');
    }) 
    .leftJoin({"AC": "ACTIVIDAD"}, function () {
        this.on( 'AC.ACTIVIDAD_COD_DOCUMENTO', '=', 'CC.COTIZACIONCABECERA_ID');
    })
    .leftJoin({"AR": "ACTIVIDAD_RESULTADO "}, function () {
        this.on( 'AC.ACTIVIDAD_ID', '=', 'AR.ACTIVIDAD_RESULTADO_ACTIVIDAD ');
    })

    if ('cod_cotizacion_cabecera' in campos) {
        estructuraConsulta.where('CC.COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`);
    }
    if(('cod_empresa' in campos)){
        estructuraConsulta.where('CC.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('CC.CENCO_ID',`${campos.cod_cc}`)
    }
    if ('entidad_id' in campos) {
        estructuraConsulta.where('CC.ENTIDAD_ID', `${campos.entidad_id}`);
    }
    if ('cod_estado' in campos) {
        estructuraConsulta.where('CC.ESTADO_ID', `${campos.estado_id}`);
    }

    if ('cod_puntoenlace_origen' in campos) {
        estructuraConsulta.where('PEO.PUNTOENLACE_ORIGEN_ID', `${campos.cod_puntoenlace_origen}`);
    }
    if ('cod_pais_origen' in campos) {
        estructuraConsulta.where('PEO.PAIS_ID', `${campos.cod_pais_origen}`);
    }

    if ('cod_puntoenlace_destino' in campos) {
        estructuraConsulta.where('PED.PUNTOENLACE_DESTINO_ID', `${campos.cod_puntoenlace_destino}`);
    }
    if ('cod_pais_destino' in campos) {
        estructuraConsulta.where('PED.PAIS_ID', `${campos.cod_pais_destino}`);
    }

    if ('reason_code' in campos) {
        estructuraConsulta.where('AR.ACTIVIDAD_RESULTADO_REASON_CODE', `${campos.reason_code}`);
    }

    const data = await estructuraConsulta.select(
        'CC.COTIZACIONCABECERA_ID AS COD_COTIZACION_CABECERA',
        'CC.EMPRESA_ID AS COD_EMPRESA',
        'CC.CENCO_ID AS COD_CC',
        'CC.COTIZACIONCABECERA_FECHA AS FECHA_CREACION',
        'CC.ENTIDAD_ID',
        'CC.ENTIDADCONTACTO_ID',
        'CC.TIPO_SERVICIO_ID AS COD_TIPO_SERVICIO', 
        'CC.TIPO_TRANSPORTE_ID AS COD_TIPO_TRANSPORTE', 
        'CC.TIPO_CARGA_ID AS COD_TIPO_CARGA',
        'CC.CLASIFICACION_CARGA_ID AS COD_CLASIFICACION_CARGA',
        'CC.INCOTERM_ID',
        'CC.TIPO_PAGO_ID AS COD_TIPO_PAGO',

        'CC.PUNTOENLACE_ORIGEN_ID AS COD_PUNTOENLACE_ORIGEN',
        'PEO.PAIS_ID AS COD_PAIS_ORIGEN', 
        'PEO.TIPO_ID AS COD_TIPO_PUNTOENLACE_ORIGEN', 

        'CC.PUNTOENLACE_DESTINO_ID AS COD_PUNTOENLACE_DESTINO',
        'PED.PAIS_ID AS COD_PAIS_DESTINO', 
        'PED.TIPO_ID AS COD_TIPO_PUNTOENLACE_DESTINO', 

        'CC.ESTADO_ID AS COD_ESTADO',

        'AR.ACTIVIDAD_RESULTADO_REASON_CODE AS REASON_CODE'
    );

    return data;
};

//CAMBIO ESTADO COTIZACION
module.exports.cambio_estado_cotizacion = async(campos) =>{
    if(
        ('cod_cotizacion_cabecera' in campos) &&
        ('cod_empresa' in campos) &&
        ('cod_cc' in campos) &&
        ('entidad_id' in campos && 'cod_estado' in campos)
    ){
        const fila_coti = await azureSqlClient("COTIZACION_CABECERA")
                .where('COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
                .where('EMPRESA_ID', `${campos.cod_empresa}`)
                .where('CENCO_ID', `${campos.cod_cc}`)
                .where('ENTIDAD_ID', `${campos.entidad_id}`)
                .first();

        if(fila_coti){
            let dataActualiza = await azureSqlClient("COTIZACION_CABECERA")
                    .where('COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
                    .where('EMPRESA_ID', `${campos.cod_empresa}`)
                    .where('CENCO_ID', `${campos.cod_cc}`)
                    .where('ENTIDAD_ID', `${campos.entidad_id}`)
                    .update({
                        ESTADO_ID: campos.cod_estado
                    }).then(async (res) => {
                        console_log("Resultado actualizada" ,res);
                        if(res>0){

                            console.log('Estado cotizacion_cabecera actualizada', campos.cod_cotizacion_cabecera);
                            const registrar_bitacora = await registrar_bitacora_cotizacion({ cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera , cod_tipo: 'CAMBIO_ESTADO', json_previo : fila_coti, json_modificacion : campos, tabla: "COTIZACION_CABECERA" });
                            console_log(registrar_bitacora);
                            return {
                                success: true,
                                cod_mensaje: 1031,
                                mensaje: 'cotizacion_cabecera estado actualizado correctamente',
                                cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera
                            };
                        }else{
                            return {
                                success: false,
                                cod_mensaje: 1033,
                                mensaje: 'cotizacion_cabecera estado no fue posible actualizar, revisa tus parametros',
                                cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera
                            };
                        }
                    }).catch((e) => {
                        console_log(e.toString());
                        return { success: false, cod_mensaje: 1042, error: e.toString() };
                    });
    
                return dataActualiza;
        }else{
            return { success: false, cod_mensaje: 1043, mensaje: 'No fue localiza la cotizacion, revisa los parametros enviados' };
        }
    }else{
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
}

//SEGUIMIENTO CTS
module.exports.seguimiento_cts_cotizacion = async(campos) => {
    if(
        ('cod_cotizacion_cabecera' in campos) &&
        ('cod_empresa' in campos) &&
        ('cod_cc' in campos) &&
        ('entidad_id' in campos) &&
        ('fecha_seguimiento' in campos) &&
        ('desc_seguimiento' in campos)
    ){
        const fila_coti = await azureSqlClient("COTIZACION_CABECERA")
                .where('COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
                .where('EMPRESA_ID', `${campos.cod_empresa}`)
                .where('CENCO_ID', `${campos.cod_cc}`)
                .where('ENTIDAD_ID', `${campos.entidad_id}`)
                .first();

        if(fila_coti){
            const resultado_cot = await azureSqlClient("COTIZACION_CABECERA")
                    .where('COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
                    .where('EMPRESA_ID', `${campos.cod_empresa}`)
                    .where('CENCO_ID', `${campos.cod_cc}`)
                    .where('ENTIDAD_ID', `${campos.entidad_id}`)
                    .update({
                        FECHA_CTS_SEGUIMIENTO: campos.fecha_seguimiento //YYYY-MM-DD HH:MM:SS
                    }).then(async (res) => {

                        //buscar id del tipo de estados
                        const fila_tipo_estado = await azureSqlClient("TIPO")
                                                .where("TIPO_TABLA", "ESTADO")
                                                .where("TIPO_DESCRIPCION", "COTIZACION_SEGUIMIENTO_CTS")
                                                .first();

                        //buscar seguimiento anterior y actualizar
                        if(!fila_tipo_estado){
                            return {
                                success : false,
                                cod_mensaje: 1031,
                                mensaje : "No existe creado TIPO para estados CTS"
                            };
                        }
                        //buscar estado anterior y tomar su id
                        const lista_estado_busq = await azureSqlClient("ESTADO") 
                                                .where("TIPO_ID", fila_tipo_estado.TIPO_ID)
                                                //.where("ESTADO_DESCRIPCION", "PENDIENTE")
                                                .select();
                        

                        if(lista_estado_busq.length == 0){
                            return {
                                success : false,
                                cod_mensaje: 1031,
                                mensaje : "No existen estados para los CTS, revisa para continuar"
                            };
                        }

                        const estado_pendiente = lista_estado_busq.find(element => element.ESTADO_DESCRIPCION =='PENDIENTE' );
                        const estado_siguiente = lista_estado_busq.find(element => element.ESTADO_DESCRIPCION =='REALIZADO' );

                        const fila_seg_anterior = await azureSqlClient("COTIZACION_SEGUIMIENTO_CTS")
                                                .where("COTIZACIONCABECERA_ID", campos.cod_cotizacion_cabecera)
                                                .where("ESTADO_ID", estado_pendiente.ESTADO_ID)
                                                .first();

                        if(fila_seg_anterior){
                            console_log("si existe un seguimietno anterior, se actualizara");
                            await azureSqlClient("COTIZACION_SEGUIMIENTO_CTS")
                            .where("COTIZACIONSEGUIMIENTO_ID", fila_seg_anterior.COTIZACIONSEGUIMIENTO_ID)
                            .update({
                                ESTADO_ID: estado_siguiente.ESTADO_ID
                            })
                            .then(async (resins) => {
                                console_log("Sesguimiento actualizado", resins, "correctamente");
                                console_log("Seguimiento CTS actualizado para la cotizacion", campos.cod_cotizacion_cabecera);
                            })
                            .catch((e) => {
                                console_log("Se ha presentado un error para registrar el seguimiento del CTS", campos.cod_cotizacion_cabecera);
                                console_log(e.toString());
                            })
                        }else{
                            console_log("No existe un seguimiento anterior, solo se crea el nuevo");
                        }

                        //registrar en cotizacion seguimiento cts
                        await azureSqlClient("COTIZACION_SEGUIMIENTO_CTS")
                        .insert({
                            COTIZACIONCABECERA_ID   : campos.cod_cotizacion_cabecera,
                            FECHA_REGISTRO          : await cropa_fecha_hora_actual(),
                            USUARIO_ID              : global.usuario.USUARIO_ID,
                            FECHA_SEGUIMIENTO       : campos.fecha_seguimiento,
                            SEGUIMIENTO             : campos.desc_seguimiento.trim(),
                            ESTADO_ID               : estado_pendiente.ESTADO_ID
                        })
                        .then(async (resins) => {
                            console_log("creado seguimiento cts", resins, "correctamente");
                            console_log("Seguimiento CTS registrado para la cotizacion", campos.cod_cotizacion_cabecera);
                        })
                        .catch((e) => {
                            console_log("Se ha presentado un error para registrar el seguimiento del CTS", campos.cod_cotizacion_cabecera);
                            console_log(e.toString());
                        })

                        return {
                            success: true,
                            cod_mensaje: 1031,
                            mensaje: 'Seguimiento CTS registrado correctamente',
                            cod_cotizacion_cabecera : campos.cod_cotizacion_cabecera
                        };

                    }).catch((e) => {
                        console_log(e.toString());
                        return { success: false, cod_mensaje: 1042, error: e.toString() };
                    });

            return resultado_cot;
    
        }
    }else{
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
}

module.exports.listar_seguimiento_cts_cotizacion = async(campos) => {
    const estructuraConsulta = azureSqlClient({ CO: "COTIZACION_CABECERA" })
    .leftJoin({ CSC: "COTIZACION_SEGUIMIENTO_CTS" }, function () {
        this.on( 'CO.COTIZACIONCABECERA_ID', '=', 'CSC.COTIZACIONCABECERA_ID');
    })
    .leftJoin({ USUA: "USUARIO" }, function () {
        this.on( 'USUA.USUARIO_ID', '=', 'CSC.USUARIO_ID');
    })            
    .leftJoin({ ES: "ESTADO" }, function () {
        this.on( 'ES.ESTADO_ID', '=', 'CSC.ESTADO_ID');
    })            

    if ('cod_cotizacion_cabecera' in campos) {
        estructuraConsulta.where('CO.COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`)
    }
    if ('cod_empresa' in campos) {
        estructuraConsulta.where('CO.EMPRESA_ID', `${campos.cod_empresa}`)
    }
    if ('cod_cc' in campos) {
        estructuraConsulta.where('CO.CENCO_ID', `${campos.cod_cc}`)
    }
    if ('entidad_id' in campos) {
        estructuraConsulta.where('CO.ENTIDAD_ID', `${campos.entidad_id}`)
    }
    if ('cod_usuario' in campos) {
        estructuraConsulta.where('CSC.USUARIO_ID', `${campos.cod_usuario}`)
    }

    const consulta = await estructuraConsulta.select(
        "CO.COTIZACIONCABECERA_ID",
        "CSC.FECHA_REGISTRO",
        "CSC.USUARIO_ID",
        "USUA.USUARIO_CORREO AS USUARIO",
        "CSC.FECHA_SEGUIMIENTO",
        "CSC.SEGUIMIENTO",
        "CSC.ESTADO_ID",
        "ES.ESTADO_DESCRIPCION"
    );

    return {
        success : consulta.length > 0,
        mensaje : consulta.length > 0 ? "Se localizo seguimiento de CTS para la cotizacion" : "Sin seguimiento en de CTS para la cotizacion",
        data : consulta
    }
}

module.exports.consultar_cotizaciones_no_validas = async () => {
    try {
        const fecha_actual = new Date(await cropa_fecha_actual());

        const lista = await azureSqlClient({ CC: "COTIZACION_CABECERA" })
            .leftJoin({ CD: "COTIZACION_DETALLE" }, function () {
                this.on("CC.COTIZACIONCABECERA_ID", "=", "CD.COTIZACIONCABECERA_ID")
                    .andOn("CD.ESTADO_ID", "=", azureSqlClient.raw("?", [1]));
            })
            .whereNotIn("CC.ESTADO_ID", [53, 63, 54, 110])
            .whereNotNull("CD.COTIZACIONDETALLE_ID")
            .where(function () {
                this.whereRaw("CAST(CD.COTIZACIONDETALLE_FECHA_VENCIMIENTO AS DATE) < CAST(? AS DATE)", [fecha_actual])
                    .orWhereExists(function () {
                        this.select(azureSqlClient.raw("1"))
                            .from({ CDR: "COTIZACION_DETALLE_RUBRO" })
                            .join({ M: "METODO" }, "M.METODO_ID", "CDR.METODO_ID")
                            .whereRaw("CDR.COTIZACIONDETALLE_ID = CD.COTIZACIONDETALLE_ID")
                            .whereNot("CDR.RUBRO_ID", 133)
                            .whereRaw("CAST(M.METODO_FECHA_FINAL AS DATE) < CAST(? AS DATE)", [fecha_actual]);
                    });
            })
            .distinct(
                "CC.COTIZACIONCABECERA_ID" ,
                "CD.COTIZACIONDETALLE_ID",
                "CD.COTIZACIONDETALLE_VERSION AS VERSION",
                "CD.COTIZACIONDETALLE_FECHA_VENCIMIENTO"
            );

        return lista;
    } catch (error) {
        console_error(error);
        throw error.message;
    }
};

module.exports.cambio_de_estado_de_cotizacion_a_vencida = async (campos) => {
    const data_cotizaciones = await this.consultar_cotizaciones_no_validas();

    const lista = await Promise.all(data_cotizaciones.map(async i => ({
        ...i,
        exito: await azureSqlClient("COTIZACION_CABECERA")
            .where("COTIZACIONCABECERA_ID", i.COTIZACIONCABECERA_ID)
            .update("ESTADO_ID", 110) === 1
    })));

    return lista;
};

module.exports.cambio_de_estado_de_versiones_vencidas = async () => {
    const fecha_actual = new Date(await cropa_fecha_actual());

    const versiones_vencidas = await azureSqlClient("COTIZACION_DETALLE")
        .where("COTIZACIONDETALLE_VENCIDA", 0)
        .whereIn("COTIZACIONCABECERA_ID", function () {
            this.select("COTIZACIONCABECERA_ID")
                .from("COTIZACION_CABECERA");
                // .whereNotIn("ESTADO_ID", [53, 63, 54]);
        })
        .whereRaw("CAST(COTIZACIONDETALLE_FECHA_VENCIMIENTO AS DATE) < CAST(? AS DATE)", [fecha_actual])
        .update("COTIZACIONDETALLE_VENCIDA", 1);

    const versiones_tarifas_vencidas = await azureSqlClient("COTIZACION_DETALLE")
        .where("COTIZACIONDETALLE_VENCIDA", 0)
        .whereIn("COTIZACIONCABECERA_ID", function () {
            this.select("COTIZACIONCABECERA_ID")
                .from("COTIZACION_CABECERA");
                // .whereNotIn("ESTADO_ID", [53, 63, 54]);
        })
        .whereExists(function () {
            this.select(azureSqlClient.raw("1"))
                .from({ CDR: "COTIZACION_DETALLE_RUBRO" })
                .join({ M: "METODO" }, "M.METODO_ID", "CDR.METODO_ID")
                .whereRaw("CDR.COTIZACIONDETALLE_ID = COTIZACION_DETALLE.COTIZACIONDETALLE_ID")
                .whereNot("CDR.RUBRO_ID", 133)
                .whereRaw("CAST(M.METODO_FECHA_FINAL AS DATE) < CAST(? AS DATE)", [fecha_actual]);
        })
        .update("COTIZACIONDETALLE_VENCIDA", 1);

    return {
        versiones_vencidas,
        versiones_tarifas_vencidas
    };
};