const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")

module.exports.getlista_metodocommodity = async (campos) => {
    const estructuraConsulta =  azureSqlClient({C:"METODO_COMMODITY"})
    if(('cod_metodocommodity' in campos)){
        estructuraConsulta.where('C.METODOCOMMODITY_ID',`${campos.cod_metodocommodity}`)
    }
    if(('cod_metodo' in campos)){
        estructuraConsulta.where('C.METODO_ID',`${campos.cod_metodo}`)
    }
    if(('cod_commodity' in campos)){
        estructuraConsulta.where('C.COMMODITY_ID',`${campos.cod_commodity}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('C.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'C.METODOCOMMODITY_ID AS COD_METODOCOMMODITY', 
        'C.METODO_ID AS COD_METODO', 
        'C.COMMODITY_ID AS COD_COMMODITY', 
        'C.ESTADO_ID AS COD_ESTADO', 
    )
    return data;
}

module.exports.insertar_metodocommodity = async (campos) => {
    if(('cod_metodo' in campos) && ('cod_commodity' in campos) && ('cod_estado' in campos)){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'METODO_COMMODITY'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("METODO_COMMODITY")
                .insert({
                    METODOCOMMODITY_ID  : idnuevo,
                    METODO_ID           : campos.cod_metodo,
                    COMMODITY_ID        : campos.cod_commodity,
                    ESTADO_ID           : campos.cod_estado || 1,
                }).then(async () => {
                    console.log('Nuevo metodo commodity creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Metodo commodity creado correctamente' ,
                            'cod_metodocommodity' : idnuevo.toString()};
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

module.exports.actualizar_metodocommodity = async (campos) => {
    if(('cod_metodocommodity' in campos) && ('cod_metodo' in campos) && ('cod_commodity' in campos) && ('cod_estado' in campos)){
        try {
            let dataActualiza = await azureSqlClient("METODO_COMMODITY")
            .where('METODOCOMMODITY_ID', `${campos.cod_metodocommodity}`)
            .update({
                METODOCOMMODITY_ID  : campos.cod_metodocommodity,
                METODO_ID           : campos.cod_metodo,
                COMMODITY_ID        : campos.cod_commodity,
                ESTADO_ID           : campos.cod_estado || 1,
            }).then(() => {
                console.log('Metodo commodity actualizado', campos.cod_metodocommodity);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Metodo commodity actualizado correctamente',
                    'cod_metodocommodity' : campos.cod_metodocommodity};
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

module.exports.eliminar_metodocommodity = async (campos) => {
    if(('cod_metodocommodity' in campos)){
        try {
            var getCommodity = await azureSqlClient({C:"METODO_COMMODITY"})
                .where("C.METODOCOMMODITY_ID", `${campos.cod_metodocommodity}`)
                .first();
            if(getCommodity){
                let eliminar = await azureSqlClient('METODO_COMMODITY')
                .where('METODOCOMMODITY_ID', `${campos.cod_metodocommodity}`)
                .del()
                .then(async result => {
                    return {'success' : true,"cod_mensaje" : 1051, 'mensaje' :'Eliminado correctamente'};
                }).catch((e) => {
                    console_log(e.toString());                    
                    return {"success" : false, "cod_mensaje" : 1052, "error" : e.toString()};
                }
                );
                return eliminar;
            }else{
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Metodo cmmodity no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }   
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}