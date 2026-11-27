const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_tarifa_entidad = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TE:"TARIFA_ENTIDAD"})
    .leftJoin({ CL: "ENTIDAD" }, function () {
        this.on( 'CL.ENTIDAD_ID', '=', 'TE.ENTIDAD_ID');
    }) 

    if(('cod_tarifa_entidad' in campos)){
        estructuraConsulta.where('TE.TARIFAENTIDAD_ID',`${campos.cod_tarifa_entidad}`)
    }
    if(('cod_metodo' in campos)){
        estructuraConsulta.where('TE.METODO_ID',`${campos.cod_metodo}`)
    }
    if(('entidad_id' in campos)){
        estructuraConsulta.where('TE.ENTIDAD_ID',`${campos.entidad_id}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('TE.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'TE.TARIFAENTIDAD_ID AS COD_TARIFA_ENTIDAD', 
        'TE.METODO_ID AS COD_METODO', 
        'TE.ENTIDAD_ID', 
        "CL.ENTIDAD_NOMBRE AS NOMBRE_CLIENTE",
        'TE.ESTADO_ID AS COD_ESTADO', 
    )
    return data;
}

module.exports.insertar_tarifa_entidad = async (campos) => {
    if(('cod_metodo' in campos) && ('entidad_id' in campos)){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_ENTIDAD'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("TARIFA_ENTIDAD ")
                .insert({
                    TARIFAENTIDAD_ID        : idnuevo, 
                    METODO_ID               : campos.cod_metodo, 
                    ENTIDAD_ID              : campos.entidad_id, 
                    ESTADO_ID               : campos.cod_estado || 1, 
                }).then(async () => {
                    insertar_tarifa_bitacora({
                        metodo_id: campos.cod_metodo, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'C', 
                        data: { cod_tarifa_entidad: idnuevo, ...campos }, 
                        tabla: "TARIFA_ENTIDAD"
                    })
                    console.log('Nuevo tarifa entidad creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Tarifa entidad creada correctamente' ,
                            'cod_tarifa_entidad' : idnuevo.toString()};
                }).catch((e) => {
                    console_log(e.toString());
                    return {"success" : false, "cod_mensaje" : 1042,"error" : e.toString()};
                }
                );

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

module.exports.actualizar_tarifa_entidad = async (campos) => {
    if(('cod_tarifa_entidad' in campos) && ('cod_metodo' in campos) && ('entidad_id' in campos) 
        && ('cod_estado' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_ENTIDAD")
            .where('TARIFAENTIDAD_ID', `${campos.cod_tarifa_entidad}`)
            .update({
                TARIFAENTIDAD_ID        : campos.cod_tarifa_entidad, 
                METODO_ID               : campos.cod_metodo, 
                ENTIDAD_ID              : campos.entidad_id, 
                ESTADO_ID               : campos.cod_estado, 
            }).then(() => {
                insertar_tarifa_bitacora({ 
                    metodo_id: campos.cod_metodo, 
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U  ', 
                    data: campos, 
                    tabla: "TARIFA_ENTIDAD"
                })
                console.log('Tarifa entidad actualizada', campos.cod_tarifa_entidad);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Tarifa entidad actualizado correctamente',
                    'cod_tarifa_entidad' : campos.cod_tarifa_entidad};
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

module.exports.eliminar_tarifa_entidad = async (campos) => {
    if(('cod_tarifa_entidad' in campos)){
        try {
            var getTarifaEntidad = await azureSqlClient({TE:"TARIFA_ENTIDAD"})
                .where("TE.TARIFAENTIDAD_ID", `${campos.cod_tarifa_entidad}`)
                .first();
            if(getTarifaEntidad){
                let eliminar = await azureSqlClient('TARIFA_ENTIDAD')
                .where('TARIFAENTIDAD_ID', `${campos.cod_tarifa_entidad}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        metodo_id: getTarifaEntidad.METODO_ID, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'D', 
                        data: getTarifaEntidad, 
                        tabla: "TARIFA_ENTIDAD"
                    })
                    console.log(result);
                    return {'success' : true,"cod_mensaje" : 1051, 'mensaje' :'Eliminado correctamente'};
                }).catch((e) => {
                    console_log(e.toString());                    
                    return {"success" : false, "cod_mensaje" : 1052, "error" : e.toString()};
                }
                );

                return eliminar;
            }else{
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Tarifa entidad no fue localizada'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}