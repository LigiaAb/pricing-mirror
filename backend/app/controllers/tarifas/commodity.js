const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")

module.exports.getlista_commodity = async (campos) => {
    const estructuraConsulta =  azureSqlClient({C:"COMMODITY"})
    if(('cod_commodity' in campos)){
        estructuraConsulta.where('C.COMMODITY_ID',`${campos.cod_commodity}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('C.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'C.COMMODITY_ID AS COD_COMMODITY', 
        'C.COMMODITY_NOMBRE AS NOMBRE', 
        'C.COMMODITY_DESCRIPCION AS DESCRIPCION', 
        'C.ESTADO_ID AS COD_ESTADO', 
    )
    return data;
}

module.exports.insertar_commodity = async (campos) => {
    if(('nombre' in campos) && ('descripcion' in campos) && ('cod_estado' in campos)){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'COMMODITY'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("COMMODITY")
                .insert({
                    COMMODITY_ID            : idnuevo,
                    COMMODITY_NOMBRE        : campos.nombre,
                    COMMODITY_DESCRIPCION   : campos.descripcion,
                    ESTADO_ID               : campos.cod_estado || 1,
                }).then(async () => {
                    console.log('Nuevo commodity creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Commodity creado correctamente' ,
                            'cod_commodity' : idnuevo.toString()};
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

module.exports.actualizar_commodity = async (campos) => {
    if(('cod_commodity' in campos) && ('nombre' in campos) && ('descripcion' in campos) && ('cod_estado' in campos)){
        try {
            let dataActualiza = await azureSqlClient("COMMODITY")
            .where('COMMODITY_ID', `${campos.cod_commodity}`)
            .update({
                COMMODITY_ID            : campos.cod_commodity,
                COMMODITY_NOMBRE        : campos.nombre,
                COMMODITY_DESCRIPCION   : campos.descripcion,
                ESTADO_ID               : campos.cod_estado
            }).then(() => {
                console.log('Commodity actualizado', campos.cod_commodity);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Commodity actualizado correctamente',
                    'cod_commodity' : campos.cod_commodity};
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

module.exports.eliminar_commodity = async (campos) => {
    if(('cod_commodity' in campos)){
        try {
            var getCommodity = await azureSqlClient({C:"COMMODITY"})
                .where("C.COMMODITY_ID", `${campos.cod_commodity}`)
                .first();
            if(getCommodity){
                let eliminar = await azureSqlClient('COMMODITY')
                .where('COMMODITY_ID', `${campos.cod_commodity}`)
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Commodity no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }   
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}