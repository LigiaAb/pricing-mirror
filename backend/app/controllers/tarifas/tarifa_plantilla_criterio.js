const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_plantilla_criterios = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TPC:"TARIFA_PLANTILLA_CRITERIO"})
    .leftJoin({C:"CRITERIO"}, function () {
        this.on('C.CRITERIO_ID', '=', 'TPC.CRITERIO_ID');
    })
    .leftJoin({T:"TIPO_DATO"}, function () {
        this.on('T.TIPODATO_ID', '=', 'C.TIPODATO_ID');
    })

    if(('cod_tarifaplantilla' in campos)){
        estructuraConsulta.where('TPC.TARIFAPLANTILLA_ID',`${campos.cod_tarifaplantilla}`)
    }

    const data = await estructuraConsulta.select(
        'TPC.TARIFAPLANTILLACRITERIO_ID AS COD_PLANTILLACRITERIO', 
        'TPC.CRITERIO_ID AS COD_CRITERIO',
        'C.CRITERIO_DESCRIPCION AS DESCRIPCION', 
        'C.CRITERIO_CAMPO AS CAMPO', 
        'C.CRITERIO_FORMULARIO AS FORMULARIO', 
        'C.TIPODATO_ID AS COD_TIPO_DATO', 
        'T.TIPODATO_DESCRIPCION AS TIPO_DATO', 
        'TPC.TARIFAPLANTILLA_ID AS COD_TARIFAPLANTILLA',
    )
    return data;
}

module.exports.insertar_plantilla_criterio = async (campos) => {
    if(('cod_criterio' in campos) && ('cod_tarifaplantilla' in campos)){

        const busqueda =  await azureSqlClient({TPC:"TARIFA_PLANTILLA_CRITERIO"})
        .where('TPC.TARIFAPLANTILLA_ID',`${campos.cod_tarifaplantilla}`)
        .where('TPC.CRITERIO_ID',`${campos.cod_criterio}`)
        .first()

        if(!busqueda){
            let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_PLANTILLA_CRITERIO'});
            if(idnuevo>0){
                try {
                    let resinsert = await azureSqlClient("TARIFA_PLANTILLA_CRITERIO")
                    .insert({
                        TARIFAPLANTILLACRITERIO_ID  : idnuevo, 
                        CRITERIO_ID                 : campos.cod_criterio,
                        TARIFAPLANTILLA_ID          : campos.cod_tarifaplantilla,
                    }).then(async () => {
                        insertar_tarifa_bitacora({
                            usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                            estado_id: campos.cod_estado || 1, 
                            accion: 'C', 
                            data: {"cod_plantillacriterio": idnuevo, ...campos}, 
                            tabla: "TARIFA_PLANTILLA_CRITERIO"
                        })
                        console.log('Nueva plantilla criterio creado ID:' , idnuevo);
                        return {'success' : true,
                                "cod_mensaje" : 1041,
                                'mensaje' : 'Plantilla criterio creado correctamente' ,
                                'cod_plantillacriterio' : idnuevo.toString()};
                    }).catch((e) => {
                        console_log(e.toString());
                        return {"success" : false, "cod_mensaje" : 1042,"error" : e.toString()};
                    });

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
            return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'La plantilla ya posee este criterio'};
        }
    }else{
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.actualizar_plantilla_criterio = async (campos) => {
    if((('cod_criterio' in campos) && ('cod_tarifaplantilla' in campos) && ('cod_plantillacriterio' in campos))
    ){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_PLANTILLA_CRITERIO")
            .where('TARIFAPLANTILLACRITERIO_ID', `${campos.cod_plantillacriterio}`)
            .update({
                TARIFAPLANTILLACRITERIO_ID  : campos.cod_plantillacriterio, 
                CRITERIO_ID                 : campos.cod_criterio,
                TARIFAPLANTILLA_ID          : campos.cod_tarifaplantilla,
            }).then(() => {
                insertar_tarifa_bitacora({
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "TARIFA_PLANTILLA_CRITERIO"
                })
                console.log('Plantilla criterio actualizado', campos.cod_plantillacriterio );
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Plantilla criterio actualizado correctamente',
                    'cod_plantillacriterio' : campos.cod_plantillacriterio};
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

module.exports.eliminar_plantilla_criterio = async (campos) => {
    if(('cod_plantillacriterio' in campos)){
        try {
            var getPlantillaCriterio = await azureSqlClient({TP:"TARIFA_PLANTILLA_CRITERIO"})
                .where("TP.TARIFAPLANTILLACRITERIO_ID", `${campos.cod_plantillacriterio}`)
                .first();
            if(getPlantillaCriterio){
                let eliminar = await azureSqlClient('TARIFA_PLANTILLA_CRITERIO')
                .where('TARIFAPLANTILLACRITERIO_ID', `${campos.cod_plantillacriterio}`)
                .del()
                .then(async result => {
                    return {'success' : true,"cod_mensaje" : 1051, 'mensaje' :'Eliminado correctamente'};
                }).catch((e) => {
                    insertar_tarifa_bitacora({
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: 4, 
                        accion: 'D', 
                        data: getPlantillaCriterio, 
                        tabla: "TARIFA_PLANTILLA_CRITERIO"
                    })
                    console_log(e.toString());                    
                    return {"success" : false, "cod_mensaje" : 1052, "error" : e.toString()};
                }
                );
                return eliminar;
            }else{
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Criterio no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }   
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
    }
}