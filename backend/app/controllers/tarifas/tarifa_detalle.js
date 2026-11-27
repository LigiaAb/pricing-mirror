const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_tarifa_detalle = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TD:"TARIFA_DETALLE"})
    if(('cod_tarifa_detalle' in campos)){
        estructuraConsulta.where('TE.TARIFADETALLE_ID',`${campos.cod_tarifa_detalle}`)
    }
    if(('cod_metodo' in campos)){
        estructuraConsulta.where('TD.METODO_ID',`${campos.cod_metodo}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('TD.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'TD.TARIFADETALLE_ID AS COD_TARIFA_DETALLE', 
        'TD.TARIFADETALLE_DESCRIPCION AS DESCRIPCION', 
        'TD.TARIFADETALLE_VALOR AS VALOR', 
        'TD.METODO_ID AS COD_METODO', 
        'TD.TIPO_ID AS COD_TIPO', 
        'TD.ESTADO_ID AS COD_ESTADO', 
    )
    return data;
}

module.exports.insertar_tarifa_detalle = async (campos) => {
    if(('cod_metodo' in campos) && ('descripcion' in campos) && ('valor' in campos) && ('cod_tipo' in campos)){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_DETALLE'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("TARIFA_DETALLE")
                .insert({
                    TARIFADETALLE_ID            : idnuevo, 
                    TARIFADETALLE_DESCRIPCION   : campos.descripcion, 
                    TARIFADETALLE_VALOR         : campos.valor, 
                    METODO_ID                   : campos.cod_metodo, 
                    TIPO_ID                     : campos.cod_tipo, 
                    ESTADO_ID                   : campos.cod_estado || 1, 
                }).then(async () => {
                    insertar_tarifa_bitacora({
                        metodo_id: campos.cod_metodo, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'C', 
                        data: { cod_tarifa_detalle: idnuevo, ...campos }, 
                        tabla: "TARIFA_DETALLE"
                    })
                    console.log('Nuevo tarifa detalle creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Tarifa detalle creada correctamente' ,
                            'cod_tarifa_detalle' : idnuevo.toString()};
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

module.exports.actualizar_tarifa_detalle = async (campos) => {
    if(('cod_tarifa_detalle' in campos) && ('cod_metodo' in campos) && ('descripcion' in campos) 
        && ('valor' in campos) && ('cod_tipo' in campos) && ('cod_estado' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_DETALLE")
            .where('TARIFADETALLE_ID', `${campos.cod_tarifa_detalle}`)
            .update({
                TARIFADETALLE_ID            : campos.cod_tarifa_detalle, 
                TARIFADETALLE_DESCRIPCION   : campos.descripcion, 
                TARIFADETALLE_VALOR         : campos.valor, 
                METODO_ID                   : campos.cod_metodo, 
                TIPO_ID                     : campos.cod_tipo, 
                ESTADO_ID                   : campos.cod_estado, 
            }).then(() => {
                insertar_tarifa_bitacora({ 
                    metodo_id: campos.cod_metodo, 
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U  ', 
                    data: campos, 
                    tabla: "TARIFA_DETALLE"
                })
                console.log('Tarifa detalle actualizada', campos.cod_tarifa_detalle);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Tarifa detalle actualizado correctamente',
                    'cod_tarifa_detalle' : campos.cod_tarifa_detalle};
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

module.exports.eliminar_tarifa_detalle = async (campos) => {
    if(('cod_tarifa_detalle' in campos)){
        try {
            var getTarifaDetalle = await azureSqlClient({TD:"TARIFA_DETALLE"})
                .where("TD.TARIFADETALLE_ID", `${campos.cod_tarifa_detalle}`)
                .first();
            if(getTarifaDetalle){
                let eliminar = await azureSqlClient('TARIFA_DETALLE')
                .where('TARIFADETALLE_ID', `${campos.cod_tarifa_detalle}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        metodo_id: getTarifaDetalle.METODO_ID, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'D', 
                        data: getTarifaDetalle, 
                        tabla: "TARIFA_DETALLE"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Detalle no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}