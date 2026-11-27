const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")

module.exports.getlista_destino = async (campos) => {
    const estructuraConsulta =  azureSqlClient({D:"DESTINO"})
    if(('cod_destino' in campos)){
        estructuraConsulta.where('D.DESTINO_ID',`${campos.cod_destino}`)
    }
    if(('cod_pais' in campos)){
        estructuraConsulta.where('D.PAIS_ID',`${campos.cod_pais}`)
    }
    if(('cod_puerto' in campos)){
        estructuraConsulta.where('D.PUERTO_ID',`${campos.cod_puerto}`)
    }
    if(('cod_aeropuerto' in campos)){
        estructuraConsulta.where('D.AEROPUERTO_ID',`${campos.cod_aeropuerto}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('D.ESTADO_ID',`${campos.cod_estado}`)
    }

    const data = await estructuraConsulta.select(
        'D.DESTINO_ID AS COD_DESTINO', 
        'D.PAIS_ID AS COD_PAIS', 
        'D.PUERTO_ID AS COD_PUERTO', 
        'D.AEROPUERTO_ID AS COD_AEROPUERTO', 
        'D.ESTADO_ID AS COD_ESTADO', 
    )
    return data;
}

module.exports.insertar_destinos = async (campos) => {
    if(('cod_pais' in campos) && (('cod_puerto' in campos) || ('cod_aeropuerto' in campos)) && ('cod_estado' in campos)){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'DESTINO'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("DESTINO")
                .insert({
                    DESTINO_ID      : idnuevo,
                    PAIS_ID         : campos.cod_pais,
                    PUERTO_ID       : campos.cod_puerto,
                    AEROPUERTO_ID   : campos.cod_aeropuerto,
                    ESTADO_ID       : campos.cod_estado || 1,
                }).then(async () => {
                    console.log('Nuevo destino creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Destino creado correctamente' ,
                            'cod_destino' : idnuevo.toString()};
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

module.exports.actualizar_destino = async (campos) => {
    if(('cod_destino' in campos) && ('cod_pais' in campos) && ('cod_estado' in campos)
        && (('cod_puerto' in campos) || ('cod_aeropuerto' in campos))){
        try {
            let dataActualiza = await azureSqlClient("DESTINO")
            .where('DESTINO_ID', `${campos.cod_destino}`)
            .update({
                DESTINO_ID      : campos.cod_destino,
                PAIS_ID         : campos.cod_pais,
                PUERTO_ID       : campos.cod_puerto,
                AEROPUERTO_ID   : campos.cod_aeropuerto,
                ESTADO_ID       : campos.cod_estado || 1,
            }).then(() => {
                console.log('Destino actualizado', campos.cod_destino);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Destino actualizado correctamente',
                    'cod_destino' : campos.cod_destino};
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

module.exports.eliminar_destino = async (campos) => {
    if(('cod_destino' in campos)){
        try {
            var getDestino = await azureSqlClient({D:"DESTINO"})
                .where("D.DESTINO_ID", `${campos.cod_destino}`)
                .first();
            if(getDestino){
                let eliminar = await azureSqlClient('DESTINO')
                .where('DESTINO_ID', `${campos.cod_destino}`)
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Destino no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }   
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}