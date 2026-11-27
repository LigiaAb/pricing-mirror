const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_plantilla_rubros = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TPR:"TARIFA_PLANTILLA_RUBRO"})

    if(('cod_tarifaplantilla' in campos)){
        estructuraConsulta.where('TPR.TARIFAPLANTILLA_ID',`${campos.cod_tarifaplantilla}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('TPR.ESTADO_ID',`${campos.cod_estado}`)
    }

    const data = await estructuraConsulta.select(
        'TPR.TARIFAPLANTILLARUBRO_ID AS COD_PLANTILLARUBRO', 
        'TPR.RUBRO_ID AS COD_RUBRO',
        'TPR.TARIFAPLANTILLARUBRO_OBLIGATORIO AS OBLIGATORIO',
        'TPR.TARIFAPLANTILLA_ID AS COD_TARIFAPLANTILLA',
        'TPR.ESTADO_ID AS COD_ESTADO',
        'TPR.SERVICIO_ID AS COD_SERVICIO'
    )
    return data;
}

module.exports.insertar_plantilla_rubro = async (campos) => {
    if(('cod_rubro' in campos) && ('obligatorio' in campos) && ('cod_tarifaplantilla' in campos)){

        const consultaRubro = await azureSqlClient({TPR:"TARIFA_PLANTILLA_RUBRO"})
        .where('TPR.RUBRO_ID',`${campos.cod_rubro}`)
        .where('TPR.TARIFAPLANTILLA_ID',`${campos.cod_tarifaplantilla}`)
        .first()
        
        if(!consultaRubro){
            let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_PLANTILLA_RUBRO'});
            if(idnuevo>0){
                try {
                    let resinsert = await azureSqlClient("TARIFA_PLANTILLA_RUBRO")
                    .insert({
                        TARIFAPLANTILLARUBRO_ID             : idnuevo, 
                        RUBRO_ID                            : campos.cod_rubro,
                        TARIFAPLANTILLARUBRO_OBLIGATORIO    : campos.obligatorio,
                        TARIFAPLANTILLA_ID                  : campos.cod_tarifaplantilla,
                        SERVICIO_ID                         : campos.cod_servicio,
                        ESTADO_ID                           : campos.cod_estado || 1
                    }).then(async () => {
                        insertar_tarifa_bitacora({
                            usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                            estado_id: campos.cod_estado || 1, 
                            accion: 'C', 
                            data: {"cod_plantillarubro": idnuevo, ...campos}, 
                            tabla: "TARIFA_PLANTILLA_RUBRO"
                        })
                        console.log('Nueva plantilla rubro creado ID:' , idnuevo);
                        return {'success' : true,
                                "cod_mensaje" : 1041,
                                'mensaje' : 'Plantilla rubro creado correctamente' ,
                                'cod_plantillarubro' : idnuevo.toString()};
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
            return {'success' : false, "cod_mensaje" : 1047,'mensaje' : 'El rubro seleccionado ya forma parte de esta plantilla'};    
        }
    }else{
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.actualizar_plantilla_rubro = async (campos) => {
    if(('cod_rubro' in campos) && ('obligatorio' in campos) && ('cod_tarifaplantilla' in campos)
        && ('cod_plantillarubro' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_PLANTILLA_RUBRO")
            .where('TARIFAPLANTILLARUBRO_ID', `${campos.cod_plantillarubro}`)
            .update({
                TARIFAPLANTILLARUBRO_ID             : campos.cod_plantillarubro, 
                RUBRO_ID                            : campos.cod_rubro,
                TARIFAPLANTILLARUBRO_OBLIGATORIO    : campos.obligatorio,
                TARIFAPLANTILLA_ID                  : campos.cod_tarifaplantilla,
                SERVICIO_ID                         : campos.cod_servicio,
                ESTADO_ID                           : campos.cod_estado
            }).then(() => {
                insertar_tarifa_bitacora({
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "TARIFA_PLANTILLA_RUBRO"
                })
                console.log('Plantilla rubro actualizado', campos.cod_plantillarubro );
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Plantilla rubro actualizado correctamente',
                    'cod_plantillarubro' : campos.cod_plantillarubro};
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

module.exports.eliminar_plantilla_rubro = async (campos) => {
    if(('cod_plantillarubro' in campos)){
        try {
            var getPlantillaRubro = await azureSqlClient({TP:"TARIFA_PLANTILLA_RUBRO"})
                .where("TP.TARIFAPLANTILLARUBRO_ID", `${campos.cod_plantillarubro}`)
                .first();
            if(getPlantillaRubro){
                let eliminar = await azureSqlClient('TARIFA_PLANTILLA_RUBRO')
                .where('TARIFAPLANTILLARUBRO_ID', `${campos.cod_plantillarubro}`)
                .del()
                .then(async result => {
                    return {'success' : true,"cod_mensaje" : 1051, 'mensaje' :'Eliminado correctamente'};
                }).catch((e) => {
                    insertar_tarifa_bitacora({
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: 4, 
                        accion: 'D', 
                        data: getPlantillaRubro, 
                        tabla: "TARIFA_PLANTILLA_RUBRO"
                    })
                    console_log(e.toString());                    
                    return {"success" : false, "cod_mensaje" : 1052, "error" : e.toString()};
                }
                );
                return eliminar;
            }else{
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Rubro no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }   
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
    }
}