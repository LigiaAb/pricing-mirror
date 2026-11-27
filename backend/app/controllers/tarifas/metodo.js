const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_metodo = async (campos) => {
    const estructuraConsulta =  azureSqlClient({M:"METODO"})
    if(('cod_metodo' in campos)){
        estructuraConsulta.where('M.METODO_ID',`${campos.cod_metodo}`)
    }
    if(('cod_servicio' in campos)){
        estructuraConsulta.where('M.SERVICIO_ID',`${campos.cod_servicio}`)
    }
    if(('cod_tipo' in campos)){
        estructuraConsulta.where('M.TIPO_ID',`${campos.cod_tipo}`)
    }
    if(('cod_tipo_tarifa' in campos)){
        estructuraConsulta.where('M.TIPO_TARIFA_ID',`${campos.cod_tipo_tarifa}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('M.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'M.METODO_ID AS COD_METODO', 
        'M.SERVICIO_ID AS COD_SERVICIO', 
        'M.TIPO_ID AS COD_TIPO', 
        'M.TIPO_TARIFA_ID AS COD_TIPO_TARIFA', 
        'M.METODO_TODOS_LOS_PAISES AS TODOS_LOS_PAISES',
        'M.METODO_TODOS_LOS_CLIENTES AS TODOS_LOS_CLIENTES',
        'M.METODO_TODOS_LOS_COMMODITIES AS TODOS_LOS_COMMODITIES',
        'M.METODO_FECHA_INICIAL AS FECHA_INICIAL', 
        'M.METODO_FECHA_FINAL AS FECHA_FINAL', 
        'M.ESTADO_ID AS COD_ESTADO',
        'M.METODO_MINIMO AS MINIMO'
    )
    return data;
}

module.exports.insertar_metodos = async (campos) => {
    if(('cod_servicio' in campos) && ('cod_tipo' in campos) && ('cod_tipo_tarifa' in campos)
        && ('todos_los_paises' in campos) && ('todos_los_clientes' in campos)
    ){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'METODO'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("METODO ")
                .insert({
                    METODO_ID                       : idnuevo, 
                    SERVICIO_ID                     : campos.cod_servicio, 
                    TIPO_ID                         : campos.cod_tipo, 
                    TIPO_TARIFA_ID                  : campos.cod_tipo_tarifa, 
                    METODO_TODOS_LOS_PAISES         : campos.todos_los_paises, 
                    METODO_TODOS_LOS_CLIENTES       : campos.todos_los_clientes, 
                    METODO_TODOS_LOS_COMMODITIES    : campos.todos_los_commodities || 1,
                    METODO_FECHA_INICIAL            : campos.fecha_inicial || await cropa_fecha_hora_actual(),
                    METODO_FECHA_FINAL              : campos.fecha_final, 
                    ESTADO_ID                       : campos.cod_estado || 1, 
                    METODO_MINIMO                   : campos.minimo
                }).then(async () => {
                    insertar_tarifa_bitacora({
                        servicio_id: campos.cod_servicio, 
                        metodo_id: idnuevo,
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'C', 
                        data: campos, 
                        tabla: "METODO"
                    })
                    console.log('Nuevo metodo creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Metodo creado correctamente' ,
                            'cod_metodo' : idnuevo.toString()};
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

module.exports.actualizar_metodo = async (campos) => {
    if(('cod_metodo' in campos) && ('cod_servicio' in campos) && ('cod_tipo' in campos)  && ('fecha_inicial' in campos)
        && ('cod_tipo_tarifa' in campos) && ('todos_los_paises' in campos) && ('todos_los_clientes' in campos)
        && ('cod_estado' in campos) 
    ){
        try {
            let dataActualiza = await azureSqlClient("METODO")
            .where('METODO_ID', `${campos.cod_metodo}`)
            .update({
                METODO_ID                       : campos.cod_metodo, 
                SERVICIO_ID                     : campos.cod_servicio, 
                TIPO_ID                         : campos.cod_tipo, 
                TIPO_TARIFA_ID                  : campos.cod_tipo_tarifa, 
                METODO_TODOS_LOS_PAISES         : campos.todos_los_paises === false ? 0 : 1,
                METODO_TODOS_LOS_CLIENTES       : campos.todos_los_clientes === false ? 0 : 1,
                METODO_TODOS_LOS_COMMODITIES    : campos.todos_los_commodities === false ? 0 : 1,
                METODO_FECHA_INICIAL            : campos.fecha_inicial,
                METODO_FECHA_FINAL              : campos.fecha_final, 
                ESTADO_ID                       : campos.cod_estado || 1, 
                METODO_MINIMO                   : campos.minimo
            }).then(() => {
                insertar_tarifa_bitacora({
                    servicio_id: campos.cod_servicio, 
                    metodo_id: campos.cod_metodo, 
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U  ', 
                    data: campos, 
                    tabla: "METODO"
                })
                console.log('Metodo actualizado', campos.cod_metodo);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Metodo actualizado correctamente',
                    'cod_metodo' : campos.cod_metodo};
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

module.exports.eliminar_metodo = async (campos) => {
    if(('cod_metodo' in campos)){
        try {
            var getMetodo = await azureSqlClient({M:"METODO"})
                .where("M.METODO_ID", `${campos.cod_metodo}`)
                .first();
            if(getMetodo){
                let eliminar = await azureSqlClient('METODO')
                .where('METODO_ID', `${campos.cod_metodo}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        servicio_id: getMetodo?.SERVICIO_ID, 
                        metodo_id: campos.cod_metodo, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'D', 
                        data: getMetodo, 
                        tabla: "METODO"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Metodo no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}