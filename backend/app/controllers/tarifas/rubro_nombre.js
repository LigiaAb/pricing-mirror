const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_rubros_nombre = async (campos) => {
    const estructuraConsulta =  azureSqlClient({RUN:"RUBRO_NOMBRE"})
    if(('cod_rubro_nombre' in campos)){
        estructuraConsulta.where('RUN.RUBRONOMBRE_ID',`${campos.cod_rubro_nombre}`)
    }
    if(('cod_rubro' in campos)){
        estructuraConsulta.where('RUN.RUBRO_ID',`${campos.cod_rubro}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('RUN.ESTADO_ID',`${campos.cod_estado}`)
    }

    const data_nombres = await estructuraConsulta.select(
        "RUN.RUBRONOMBRE_ID AS COD_RUBRO_NOMBRE",
        "RUN.RUBRONOMBRE_NOMBRE AS NOMBRE",
        "RUN.RUBRO_ID AS COD_RUBRO",
        "RUN.ESTADO_ID AS COD_ESTADO"
    );

    return data_nombres;
}

module.exports.insertar_rubro_nombre = async (campos) => {
    if(('nombre' in campos) && ('cod_rubro' in campos) && ('cod_estado' in campos)){

        let check_rubros = await azureSqlClient({RUN:"RUBRO_NOMBRE"})
            .where('RUN.RUBRONOMBRE_NOMBRE',`${campos.nombre}`)
            .where('RUN.RUBRO_ID',`${campos.cod_rubro}`)
            .where('RUN.ESTADO_ID', 1)
            .first()

        if(!check_rubros){
            let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'RUBRO_NOMBRE'});
            if(idnuevo>0){
                try {
                    let resinsert = await azureSqlClient("RUBRO_NOMBRE")
                    .insert({
                        RUBRONOMBRE_ID      : idnuevo,
                        RUBRONOMBRE_NOMBRE  : campos.nombre,
                        RUBRO_ID            : campos.cod_rubro,
                        ESTADO_ID           : campos.cod_estado || 1,
                    }).then(async () => {
                        insertar_tarifa_bitacora({
                            rubro_id: idnuevo,
                            usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                            estado_id: campos.cod_estado || 1, 
                            accion: 'D', 
                            data: campos, 
                            tabla: "RUBRO_NOMBRE"
                        })
                        console.log('Nuevo Rubro Nombre creado ID:' , idnuevo);
                        return {'success' : true,
                                "cod_mensaje" : 1041,
                                'mensaje' : 'Rubro_nombre creado correctamente' ,
                                'cod_rubro_nombre' : idnuevo.toString()};
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
            return {'success' : false, "cod_mensaje" : 1043,'mensaje' : 'Ya existe un Rubro Nombre con esos datos en el mismo periodo'};
        }
    }else{
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.actualizar_rubro_nombre = async (campos) => {
    if(('cod_rubro' in campos) && ('nombre' in campos) && ('cod_rubro_nombre' in campos) && ('cod_estado' in campos)){
        try {
            let dataActualiza = await azureSqlClient("RUBRO_NOMBRE")
            .where('RUBRONOMBRE_ID', `${campos.cod_rubro_nombre}`)
            .update({
                RUBRONOMBRE_ID      : campos.cod_rubro_nombre,
                RUBRONOMBRE_NOMBRE  : campos.nombre,
                RUBRO_ID            : campos.cod_rubro,
                ESTADO_ID           : campos.cod_estado
            }).then(() => {
                insertar_tarifa_bitacora({
                    rubro_id: campos.cod_rubro_nombre,
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "RUBRO_NOMBRE"
                })
                console.log('Rubro actualizado', campos.cod_rubro_nombre);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Rubro actualizado correctamente',
                    'cod_rubro_nombre' : campos.cod_rubro_nombre};
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

module.exports.eliminar_rubro_nombre = async (campos) => {
    if(('cod_rubro_nombre' in campos)){
        try {
            var getRubro = await azureSqlClient({R:"RUBRO_NOMBRE"})
                .where("R.RUBRONOMBRE_ID", `${campos.cod_rubro_nombre}`)
                .first();
            if(getRubro){
                let eliminar = await azureSqlClient('RUBRO_NOMBRE')
                .where('RUBRONOMBRE_ID', `${campos.cod_rubro_nombre}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        rubro_id: campos.cod_rubro_nombre,
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: 4, 
                        accion: 'D', 
                        data: getRubro, 
                        tabla: "RUBRO_NOMBRE"
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