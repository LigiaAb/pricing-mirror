const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_rubros_identificacion = async (campos) => {
    const estructuraConsulta =  azureSqlClient({RUI:"RUBRO_IDENTIFICACION"})
    if(('cod_rubro_identificacion' in campos)){
        estructuraConsulta.where('RUI.RUBROIDENTIFICACION_ID',`${campos.cod_rubro_identificacion}`)
    }
    if(('cod_rubro' in campos)){
        estructuraConsulta.where('RUI.RUBRO_ID',`${campos.cod_rubro}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('RUI.ESTADO_ID',`${campos.cod_estado}`)
    }
    if(('cod_tipo' in campos)){
        estructuraConsulta.where('RUI.TIPO_ID',`${campos.cod_tipo}`)
    }

    const data_identificacions = await estructuraConsulta.select(
        "RUI.RUBROIDENTIFICACION_ID AS COD_RUBRO_IDENTIFICACION",
        "RUI.RUBROIDENTIFICACION_CODIGO AS CODIGO",
        "RUI.RUBRO_ID AS COD_RUBRO",
        "RUI.TIPO_ID AS COD_TIPO",
        "RUI.ESTADO_ID AS COD_ESTADO"
    );

    return data_identificacions;
}

module.exports.insertar_rubro_identificacion = async (campos) => {
    if(('codigo' in campos) && ('cod_rubro' in campos) && ('cod_estado' in campos) && ('cod_tipo' in campos)){

        let check_rubros = await azureSqlClient({RUI:"RUBRO_IDENTIFICACION"})
            .where('RUI.RUBROIDENTIFICACION_CODIGO',`${campos.codigo}`)
            .where('RUI.RUBRO_ID',`${campos.cod_rubro}`)
            .where('RUI.TIPO_ID',`${campos.cod_tipo}`)
            .where('RUI.ESTADO_ID', 1)
            .first()

        if(!check_rubros){
            let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'RUBRO_IDENTIFICACION'});
            if(idnuevo>0){
                try {
                    let resinsert = await azureSqlClient("RUBRO_IDENTIFICACION")
                    .insert({
                        RUBROIDENTIFICACION_ID      : idnuevo,
                        RUBROIDENTIFICACION_CODIGO  : campos.codigo,
                        RUBRO_ID                    : campos.cod_rubro,
                        TIPO_ID                     : campos.cod_tipo,
                        ESTADO_ID                   : campos.cod_estado || 1,
                    }).then(async () => {
                        insertar_tarifa_bitacora({
                            rubro_id: idnuevo,
                            usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                            estado_id: campos.cod_estado || 1, 
                            accion: 'C', 
                            data: campos, 
                            tabla: "RUBRO_IDENTIFICACION"
                        })
                        console.log('Nuevo Rubro identificacion creado ID:' , idnuevo);
                        return {'success' : true,
                                "cod_mensaje" : 1041,
                                'mensaje' : 'identificacion creado correctamente' ,
                                'cod_rubro_identificacion' : idnuevo.toString()};
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
        } else {
            return {'success' : false, "cod_mensaje" : 1043,'mensaje' : 'Ya existe un Rubro Identificacion con esos datos en el mismo periodo'};
        }
    }else{
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.actualizar_rubro_identificacion = async (campos) => {
    if(('cod_rubro' in campos) && ('codigo' in campos) && ('cod_rubro_identificacion' in campos) && ('cod_estado' in campos)
        && ('cod_tipo' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("RUBRO_IDENTIFICACION")
            .where('RUBROIDENTIFICACION_ID', `${campos.cod_rubro_identificacion}`)
            .update({
                RUBROIDENTIFICACION_ID      : campos.cod_rubro_identificacion,
                RUBROIDENTIFICACION_CODIGO  : campos.codigo,
                RUBRO_ID                    : campos.cod_rubro,
                TIPO_ID                     : campos.cod_tipo,
                ESTADO_ID                   : campos.cod_estado
            }).then(() => {
                insertar_tarifa_bitacora({
                    rubro_id: campos.cod_rubro_identificacion,
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "RUBRO_IDENTIFICACION"
                })
                console.log('Rubro identificacion actualizado', campos.cod_rubro_identificacion);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Rubro identificacion actualizado correctamente',
                    'cod_rubro_identificacion' : campos.cod_rubro_identificacion};
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

module.exports.eliminar_rubro_identificacion = async (campos) => {
    if(('cod_rubro_identificacion' in campos)){
        try {
            var getRubro = await azureSqlClient({R:"RUBRO_IDENTIFICACION"})
                .where("R.RUBROIDENTIFICACION_ID", `${campos.cod_rubro_identificacion}`)
                .first();
            if(getRubro){
                let eliminar = await azureSqlClient('RUBRO_IDENTIFICACION')
                .where('RUBROIDENTIFICACION_ID', `${campos.cod_rubro_identificacion}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        rubro_id: campos.cod_rubro_identificacion,
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: 4, 
                        accion: 'D', 
                        data: getRubro, 
                        tabla: "RUBRO_IDENTIFICACION"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Rubr no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}