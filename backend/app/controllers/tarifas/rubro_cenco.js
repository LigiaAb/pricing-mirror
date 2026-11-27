const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_rubros_cenco = async (campos) => {
    const estructuraConsulta =  azureSqlClient({R:"RUBRO_CENTRO_COSTO"})
    if(('cod_rubro_cenco' in campos)){
        estructuraConsulta.where('R.RUBROCENCO_ID',`${campos.cod_rubro_cenco}`)
    }
    if(('cod_rubro' in campos)){
        estructuraConsulta.where('R.RUBRO_ID',`${campos.cod_rubro}`)
    }
    if(('cod_empresa' in campos)){
        estructuraConsulta.where('R.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('R.CENCO_ID',`${campos.cod_cc}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('R.ESTADO_ID',`${campos.cod_estado}`)
    }

    const data = await estructuraConsulta.select(
        'R.RUBROCENCO_ID AS COD_RUBRO_CENCO', 
        'R.RUBRO_ID AS COD_RUBRO', 
        'R.EMPRESA_ID AS COD_EMPRESA', 
        'R.CENCO_ID AS cod_cc',
        'R.ESTADO_ID AS COD_ESTADO',
    )
    return data;
}

module.exports.insertar_rubros_cenco = async (campos) => {
    if(('cod_empresa' in campos) && ('cod_cc' in campos) 
        && ('cod_rubro' in campos) && ('cod_estado' in campos)){

            console.log(campos)

        let check_rubros = await azureSqlClient({R : "RUBRO_CENTRO_COSTO"})
            .where('R.RUBRO_ID',`${campos.cod_rubro}`)
            .where('R.EMPRESA_ID',`${campos.cod_empresa}`)
            .where('R.CENCO_ID',`${campos.cod_cc}`)
            .where('R.ESTADO_ID', 1)
            .first()

        if(!check_rubros){
            let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'RUBRO_CENTRO_COSTO'});
            if(idnuevo>0){
                try {
                    let resinsert = await azureSqlClient("RUBRO_CENTRO_COSTO")
                    .insert({
                        RUBROCENCO_ID   : idnuevo,
                        RUBRO_ID        : campos.cod_rubro,
                        EMPRESA_ID      : campos.cod_empresa,
                        CENCO_ID        : campos.cod_cc,
                        ESTADO_ID       : campos.cod_estado || 1,
                    }).then(async () => {
                        insertar_tarifa_bitacora({
                            rubro_id: idnuevo,
                            usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                            estado_id: campos.cod_estado || 1, 
                            accion: 'C', 
                            data: campos, 
                            tabla: "RUBRO_CENTRO_COSTO"
                        })
                        console.log('Nuevo rubro centro de costo creado ID:' , idnuevo);
                        return {'success' : true,
                                "cod_mensaje" : 1041,
                                'mensaje' : 'Rubro centro de costo creado correctamente' ,
                                'cod_rubro_cenco' : idnuevo.toString()};
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
            return {'success' : false, "cod_mensaje" : 1043,'mensaje' : 'Ya existe un rubro con esos datos en el mismo periodo'};
        }
    }else{
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.actualizar_rubro_cenco = async (campos) => {
    if(('cod_rubro_cenco' in campos) && ('cod_empresa' in campos) && ('cod_cc' in campos) 
        && ('cod_rubro' in campos) && ('cod_estado' in campos)){
        try {
            let dataActualiza = await azureSqlClient("RUBRO_CENTRO_COSTO")
            .where('RUBROCENCO_ID', `${campos.cod_rubro_cenco}`)
            .update({
                RUBROCENCO_ID   : campos.cod_rubro_cenco,
                RUBRO_ID        : campos.cod_rubro,
                EMPRESA_ID      : campos.cod_empresa,
                CENCO_ID        : campos.cod_cc,
                ESTADO_ID       : campos.cod_estado,
            }).then(() => {
                insertar_tarifa_bitacora({
                    rubro_id: campos.cod_rubro_cenco,
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "RUBRO_CENTRO_COSTO"
                })
                console.log('Rubro centro de costo actualizado', campos.cod_rubro_cenco);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Rubro centro de costo actualizado correctamente',
                    'cod_rubro_cenco' : campos.cod_rubro_cenco};
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

module.exports.eliminar_rubro_cenco = async (campos) => {
    if(('cod_rubro_cenco' in campos)){
        try {
            var getRubro = await azureSqlClient({R:"RUBRO_CENTRO_COSTO"})
                .where("R.RUBROCENCO_ID", `${campos.cod_rubro_cenco}`)
                .first();
            if(getRubro){
                let eliminar = await azureSqlClient('RUBRO_CENTRO_COSTO')
                .where('RUBROCENCO_ID', `${campos.cod_rubro_cenco}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        rubro_id: campos.cod_rubro_cenco,
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: 4, 
                        accion: 'D', 
                        data: getRubro, 
                        tabla: "RUBRO_CENTRO_COSTO"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'RubrO centro de costo no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}