const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_servicio = async (campos) => {
    const estructuraConsulta =  azureSqlClient({S:"SERVICIO"})
    .leftJoin({E:"ENTIDAD"}, function () {
        this.on( 'E.ENTIDAD_ID', '=', 'S.ENTIDAD_ID');
    })
    .joinRaw(`
        LEFT JOIN (
            SELECT 
                TB.SERVICIO_ID,
                TB.TARIFABITACORA_FECHA,
                TB.USUARIO_ID,
                ROW_NUMBER() OVER (
                    PARTITION BY TB.SERVICIO_ID 
                    ORDER BY TB.TARIFABITACORA_FECHA DESC
                ) AS RN
            FROM TARIFA_BITACORA TB
        ) ULT ON ULT.SERVICIO_ID = S.SERVICIO_ID AND ULT.RN = 1
    `)

    if(('cod_servicio' in campos)){
        estructuraConsulta.where('S.SERVICIO_ID',`${campos.cod_servicio}`)
    }
    if(('cod_rubro' in campos)){
        estructuraConsulta.where('S.RUBRO_ID',`${campos.cod_rubro}`)
    }
    if(('cod_tipo_servicio' in campos)){
        estructuraConsulta.where('S.TIPO_SERVICIO_ID',`${campos.cod_tipo_servicio}`)
    }
    if(('cod_tipo_transporte' in campos)){
        estructuraConsulta.where('S.TIPO_TRANSPORTE_ID',`${campos.cod_tipo_transporte}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('S.ESTADO_ID',`${campos.cod_estado}`)
    }
    if(('entidad_id' in campos)){
        estructuraConsulta.where('S.ENTIDAD_ID',`${campos.entidad_id}`)
    }
    if(('cod_empresa' in campos)){
        estructuraConsulta.where('S.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('S.CENCO_ID',`${campos.cod_cc}`)
    }
    if(('cod_tipo_calculo' in campos)){
        estructuraConsulta.where('S.TIPO_CALCULO_ID',`${campos.cod_tipo_calculo}`)
    }
    if(('cod_tipo_aplicacion' in campos)){
        estructuraConsulta.where('S.TIPO_APLICACION_ID',`${campos.cod_tipo_aplicacion}`)
    }
    if(('cod_tipo_carga' in campos)){
        estructuraConsulta.where('S.TIPO_CARGA_ID',`${campos.cod_tipo_carga}`)
    }
    if(('cod_clasificacion_carga' in campos)){
        estructuraConsulta.where('S.CLASIFICACION_CARGA_ID',`${campos.cod_clasificacion_carga}`)
    }
    if(('incoterm_id' in campos)){
        estructuraConsulta.where('S.INCOTERM_ID',`${campos.incoterm_id}`)
    }
    if(('cod_tipo_pago' in campos)){
         estructuraConsulta.where('S.TIPO_PAGO_ID',`${campos.cod_tipo_pago}`)
    }
    if(('servicio_interno' in campos)){
        estructuraConsulta.where('S.SERVICIO_INTERNO',`${campos.servicio_interno}`)
    }
    if(('clasificacion' in campos)){
        estructuraConsulta.where('S.SERVICIO_CLASIFICACION',`${campos.clasificacion}`)
    }
    if(('servicio_especial' in campos)){
        estructuraConsulta.where('S.SERVICIO_ESPECIAL',`${campos.servicio_especial}`)
    }
    if(('categoria_transporte' in campos)){
        estructuraConsulta.where('S.CATEGORIA_TRANSPORTE',`${campos.categoria_transporte}`)
    }
    if(('obligatorio' in campos)){
        estructuraConsulta.where('S.OBLIGATORIO',`${campos.obligatorio}`)
    }

    const data = await estructuraConsulta.select(
        'S.SERVICIO_ID AS COD_SERVICIO', 
        'S.SERVICIO_NOMBRE AS NOMBRE', 
        'S.SERVICIO_SIGLAS AS SIGLAS', 
        'S.RUBRO_ID AS COD_RUBRO', 
        'S.TIPO_SERVICIO_ID AS COD_TIPO_SERVICIO', 
        'S.TIPO_TRANSPORTE_ID AS COD_TIPO_TRANSPORTE', 
        'S.ENTIDAD_ID ',
        'E.ENTIDAD_NOMBRE',
        'S.EMPRESA_ID AS COD_EMPRESA',
        'S.CENCO_ID AS COD_CC',
        'S.TIPO_CALCULO_ID AS COD_TIPO_CALCULO',
        'S.TIPO_APLICACION_ID AS COD_TIPO_APLICACION',
        'S.TIPO_CARGA_ID AS COD_TIPO_CARGA',
        'S.CLASIFICACION_CARGA_ID AS COD_CLASIFICACION_CARGA',
        'S.INCOTERM_ID',
        'S.TIPO_PAGO_ID AS COD_TIPO_PAGO',
        'S.ESTADO_ID AS COD_ESTADO', 
        'S.SERVICIO_INTERNO',
        'S.SERVICIO_CLASIFICACION AS CLASIFICACION',
        'S.SERVICIO_ESPECIAL',
        'S.CATEGORIA_TRANSPORTE',
        'S.OBLIGATORIO',

        'ULT.USUARIO_ID AS ULTIMO_USUARIO',
        'ULT.TARIFABITACORA_FECHA AS ULTIMA_FECHA_MODIFICACION'
    )


    return data;
}

module.exports.insertar_servicio = async (campos) => {
    if(('nombre' in campos) && ('siglas' in campos) && ('cod_rubro' in campos) && ('entidad_id' in campos) 
        && ('cod_tipo_servicio' in campos) && ('cod_tipo_transporte' in campos)  && ('cod_empresa' in campos) 
        && ('cod_cc' in campos) && ('cod_tipo_calculo' in campos) && ('cod_tipo_aplicacion' in campos)
        && ('cod_estado' in campos) 
    ){
        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'SERVICIO'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("SERVICIO")
                .insert({
                    SERVICIO_ID             : idnuevo,
                    SERVICIO_NOMBRE         : campos.nombre,
                    SERVICIO_SIGLAS         : campos.siglas,
                    RUBRO_ID                : campos.cod_rubro,
                    TIPO_SERVICIO_ID        : campos.cod_tipo_servicio,
                    TIPO_TRANSPORTE_ID      : campos.cod_tipo_transporte,
                    ENTIDAD_ID              : campos.entidad_id,
                    EMPRESA_ID              : campos.cod_empresa,
                    CENCO_ID                : campos.cod_cc,
                    TIPO_CALCULO_ID         : campos.cod_tipo_calculo,
                    TIPO_APLICACION_ID      : campos.cod_tipo_aplicacion,
                    TIPO_CARGA_ID           : campos.cod_tipo_carga || 119,
                    CLASIFICACION_CARGA_ID  : campos.cod_clasificacion_carga || 123,
                    INCOTERM_ID             : campos.incoterm_id,
                    TIPO_PAGO_ID            : campos.cod_tipo_pago,
                    ESTADO_ID               : campos.cod_estado || 1,
                    SERVICIO_INTERNO        : campos.servicio_interno,
                    SERVICIO_CLASIFICACION  : campos.clasificacion,
                    SERVICIO_ESPECIAL       : campos.servicio_especial || 0,
                    CATEGORIA_TRANSPORTE    : campos.categoria_transporte,
                    OBLIGATORIO             : campos.obligatorio
                }).then(async () => {
                    console.log('Nuevo servicio creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Servicio creado correctamente' ,
                            'cod_servicio' : idnuevo.toString()};
                }).catch((e) => {
                    console_log(e.toString());
                    return {"success" : false, "cod_mensaje" : 1042,"error" : e.toString()};
                });

                await insertar_tarifa_bitacora({
                    servicio_id: idnuevo,
                    rubro_id: campos.cod_rubro,
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: resinsert.success ? campos.estado || 1 : 2,
                    accion: 'C', 
                    data: resinsert.success ? campos : resinsert, 
                    tabla: "SERVICIO"
                })
                return resinsert;
                
            } catch (error) {

                return {'success' : false, 
                    "cod_mensaje" : 1044,
                    'error' : error.toString()};
            }
        }else{
            return {'success' : false, "cod_mensaje" : 1047,'mensaje' : 'No existe un correlativo valido para la tabla, consulta con IT'};    
        }
  
    }else{
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.actualizar_servicio = async (campos) => {
    if(('cod_servicio' in campos) && ('nombre' in campos) && ('siglas' in campos) && ('cod_rubro' in campos) 
        && ('cod_tipo_servicio' in campos) && ('cod_tipo_transporte' in campos)  && ('entidad_id' in campos) 
        && ('cod_empresa' in campos) && ('cod_cc' in campos) && ('cod_tipo_calculo' in campos)
        && ('cod_tipo_aplicacion' in campos) && ('cod_estado' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("SERVICIO")
            .where('SERVICIO_ID', `${campos.cod_servicio}`)
            .update({
                SERVICIO_ID             : campos.cod_servicio,
                SERVICIO_NOMBRE         : campos.nombre,
                SERVICIO_SIGLAS         : campos.siglas,
                RUBRO_ID                : campos.cod_rubro,
                TIPO_SERVICIO_ID        : campos.cod_tipo_servicio,
                TIPO_TRANSPORTE_ID      : campos.cod_tipo_transporte,
                ENTIDAD_ID              : campos.entidad_id,
                EMPRESA_ID              : campos.cod_empresa,
                CENCO_ID                : campos.cod_cc,
                TIPO_CALCULO_ID         : campos.cod_tipo_calculo,
                TIPO_APLICACION_ID      : campos.cod_tipo_aplicacion,
                TIPO_CARGA_ID           : campos.cod_tipo_carga || 119,
                CLASIFICACION_CARGA_ID  : campos.cod_clasificacion_carga || 123,
                INCOTERM_ID             : campos.incoterm_id,
                TIPO_PAGO_ID            : campos.cod_tipo_pago,
                ESTADO_ID               : campos.cod_estado,
                SERVICIO_INTERNO        : campos.servicio_interno,
                SERVICIO_CLASIFICACION  : campos.clasificacion,
                SERVICIO_ESPECIAL       : campos.servicio_especial,
                CATEGORIA_TRANSPORTE    : campos.categoria_transporte,
                OBLIGATORIO             : campos.obligatorio
            }).then(() => {
                insertar_tarifa_bitacora({
                    servicio_id: campos.cod_servicio,
                    rubro_id: campos.cod_rubro,
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "SERVICIO"
                })
                console.log('Servicio actualizado', campos.cod_servicio );
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Servicio actualizado correctamente',
                    'cod_servicio' : campos.cod_servicio};
            }).catch((e) => {
                console_log(e.toString());
                return {"success" : false, "cod_mensaje" : 1042,"error" : e.toString()};
            }
            );
            return dataActualiza;
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1044,"error" : error.toString()};                
        }
    }else{
        return {'success' : false, "cod_mensaje" : 1043,'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.eliminar_servicio = async (campos) => {
    if(('cod_servicio' in campos)){
        try {
            var getServicio = await azureSqlClient({S:"SERVICIO"})
                .where("S.SERVICIO_ID", `${campos.cod_servicio}`)
                .first();
            if(getServicio){
                let eliminar = await azureSqlClient('SERVICIO')
                .where('SERVICIO_ID', `${campos.cod_servicio}`)
                .del()
                .then(async result => {
                    return {'success' : true,"cod_mensaje" : 1051, 'mensaje' :'Eliminado correctamente'};
                }).catch((e) => {
                    insertar_tarifa_bitacora({
                        servicio_id: campos.cod_servicio,
                        rubro_id: getServicio.RUBRO_ID,
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: 4, 
                        accion: 'D', 
                        data: getServicio, 
                        tabla: "SERVICIO"
                    })
                    console_log(e.toString());                    
                    return {"success" : false, "cod_mensaje" : 1052, "error" : e.toString()};
                }
                );
                return eliminar;
            }else{
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Servicio no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }   
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}

module.exports.copiar_servicio = async (campos) => {
    if(("cod_servicio" in campos)){

        const servicio = await azureSqlClient({S: "SERVICIO"})
        .where('S.SERVICIO_ID',`${campos.cod_servicio}`)
        .first("*")

        if(!servicio) return { success: false, cod_mensaje: 1043, mensaje: 'No se pudo localizar el servicio' }; 

        const consulta_metodo = azureSqlClient({M:"METODO"})
        .where('M.SERVICIO_ID',`${campos.cod_servicio}`)
        
        if(("cod_metodo" in campos)){
            consulta_metodo.where('M.METODO_ID',`${campos.cod_metodo}`)
        }

        const metodo = await consulta_metodo.first("*")

        if(!metodo) return { success: false, cod_mensaje: 1043, mensaje: 'No se pudo localizar el metodo' }; 

        if("fecha_inicial" in campos) metodo["METODO_FECHA_INICIAL"] = campos.fecha_inicial || null
        if("fecha_final" in campos) metodo["METODO_FECHA_FINAL"] = campos.fecha_final || null

        const entidades = await azureSqlClient({TE:"TARIFA_ENTIDAD"})
        .where('TE.METODO_ID',`${metodo.METODO_ID}`)
        .select("*")

        const detalles = await azureSqlClient({TD:"TARIFA_DETALLE"})
        .where('TD.METODO_ID',`${metodo.METODO_ID}`)
        .select("*")

        const rutas = await azureSqlClient({TR:"TARIFA_RUTA"})
        .where('TR.METODO_ID',`${metodo.METODO_ID}`)
        .select("*")

        const commodities = await azureSqlClient({TC:"METODO_COMMODITY"})
        .where('TC.METODO_ID',`${metodo.METODO_ID}`)
        .select("*")

        let new_ids = {} 
        await azureSqlClient.transaction(async (trx) => {
            try {

                const  idnuevo_servicio = await recuperaAcualizaCorrelativoTabla({'tabla' : 'SERVICIO'});
                await trx("SERVICIO")
                .insert({ ...servicio, SERVICIO_ID: idnuevo_servicio })
                new_ids["SERVICIO"] = idnuevo_servicio

                const  idnuevo_metodo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'METODO'});
                await trx("METODO")
                .insert({ ...metodo, METODO_ID: idnuevo_metodo, SERVICIO_ID: idnuevo_servicio })
                new_ids["METODO"] = idnuevo_metodo


                new_ids["RUTAS"] = await Promise.all(rutas.map(async ruta => {
                    const idnuevo_ruta = await recuperaAcualizaCorrelativoTabla({ tabla: 'TARIFA_RUTA' });
                    await trx("TARIFA_RUTA").insert({ ...ruta, TARIFARUTA_ID: idnuevo_ruta, METODO_ID: idnuevo_metodo });
                    return idnuevo_ruta;
                }));

                new_ids["ENTIDADES"] = await Promise.all(entidades.map(async entidad => {
                    const  idnuevo_entidad = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_ENTIDAD'});
                    await trx("TARIFA_ENTIDAD").insert({ ...entidad, TARIFAENTIDAD_ID: idnuevo_entidad, METODO_ID: idnuevo_metodo });
                    return idnuevo_entidad;
                }));

                new_ids["DETALLES"] = await Promise.all(detalles.map(async detalle => {
                    const  idnuevo_detalle = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_DETALLE'});
                    await trx("TARIFA_DETALLE").insert({ ...detalle, TARIFAENTIDAD_ID: idnuevo_detalle, METODO_ID: idnuevo_metodo });
                    return idnuevo_detalle;
                }));

                new_ids["COMMODITIES"] = await Promise.all(commodities.map(async commodity => {
                    const  idnuevo_commodity = await recuperaAcualizaCorrelativoTabla({'tabla' : 'METODO_COMMODITY'});
                    await trx("METODO_COMMODITY").insert({ ...commodity, TARIFAENTIDAD_ID: idnuevo_commodity, METODO_ID: idnuevo_metodo });
                    return idnuevo_commodity;
                }));

            } catch (e) {
                throw new Error(`${e.message || e}`);
            }  
        })
        .catch(e => {
            // Rollback
            return { success: false, cod_mensaje: 1043, error: `Error al replicar servicio: ${e}` }; 
        })  

        return {'success' : true,
            "cod_mensaje" : 1041,
            'mensaje' : 'Servicio replicado correctamente' ,
            'ids': new_ids
        };
        
    } else {
       return { success: false, cod_mensaje: 1043, mensaje: 'Faltan parámetros requeridos, verifique' }; 
    }
};