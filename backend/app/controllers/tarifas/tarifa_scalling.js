const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_tarifa_scalling = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TS: "TARIFA_SCALLING"})
    .leftJoin({ PE:"PUNTO_ENLACE" }, function () {
        this.on( 'TS.PUNTOENLACE_ID', '=', 'PE.PUNTOENLACE_ID');
    })
    .leftJoin({PEI:"PUNTO_ENLACE_IDENTIFICACION"}, function () {
        this.on( 'PE.PUNTOENLACE_ID', '=', 'PEI.PUNTOENLACE_ID')
        .onIn('PEI.TIPO_ID', [78, 80, 112])
    })

    if(('cod_tarifa_scalling' in campos)){
        estructuraConsulta.where('TS.SCALLING_ID',`${campos.cod_tarifa_scalling}`)
    }
    if(('cod_metodo' in campos)){
        estructuraConsulta.where('TS.METODO_ID',`${campos.cod_metodo}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('TS.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        "TS.SCALLING_ID AS COD_TARIFA_SCALLING",
        "TS.METODO_ID AS COD_METODO",
        "TS.PUNTOENLACE_ID AS COD_PUNTOENLACE",
        'PE.PUNTOENLACE_NOMBRE AS NOMBRE', 
        'PEI.PEIDENTFICACION_CODIGO AS CODIGO',
        "TS.SCALLING_COSTO AS COSTO",
        "TS.MONEDA_ID AS COD_MONEDA",
        "TS.ESTADO_ID AS COD_ESTADO",
    )
    return data;
}

module.exports.insertar_tarifa_scalling = async (campos) => {
    if(('cod_metodo' in campos) && ('cod_puntoenlace' in campos) && ('costo' in campos) 
        && ('cod_moneda' in campos)
    ){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_SCALLING'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("TARIFA_SCALLING")
                .insert({
                    SCALLING_ID: idnuevo,
                    METODO_ID: campos.cod_metodo,
                    PUNTOENLACE_ID: campos.cod_puntoenlace,
                    SCALLING_COSTO: campos.costo,
                    MONEDA_ID: campos.cod_moneda,
                    ESTADO_ID: campos.cod_estado || 1,
                }).then(async () => {
                    insertar_tarifa_bitacora({
                        metodo_id: campos.cod_metodo, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'C', 
                        data: { cod_tarifa_scalling: idnuevo, ...campos }, 
                        tabla: "TARIFA_SCALLING"
                    })
                    console.log('Nuevo tarifa scalling creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Tarifa Scalling creada correctamente' ,
                            'cod_tarifa_scalling' : idnuevo.toString()};
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

module.exports.actualizar_tarifa_scalling = async (campos) => {
    if(('cod_tarifa_scalling' in campos) && ('cod_metodo' in campos) && ('cod_puntoenlace' in campos) && ('costo' in campos) 
        && ('cod_moneda' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_SCALLING")
            .where('SCALLING_ID', `${campos.cod_tarifa_scalling}`)
            .update({
                METODO_ID: campos.cod_metodo,
                PUNTOENLACE_ID: campos.cod_puntoenlace,
                SCALLING_COSTO: campos.costo,
                MONEDA_ID: campos.cod_moneda,
                ESTADO_ID: campos.cod_estado 
            }).then(() => {
                insertar_tarifa_bitacora({ 
                    metodo_id: campos.cod_metodo, 
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "TARIFA_SCALLING"
                })
                console.log('Tarifa Scalling actualizada', campos.cod_tarifa_scalling);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Tarifa Scalling actualizado correctamente',
                    'cod_tarifa_scalling' : campos.cod_tarifa_scalling};
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

module.exports.eliminar_tarifa_scalling = async (campos) => {
    if(('cod_tarifa_scalling' in campos)){
        try {
            var getTarifaS = await azureSqlClient({TS: "TARIFA_SCALLING"})
                .where("TS.SCALLING_ID", `${campos.cod_tarifa_scalling}`)
                .first();
            if(getTarifaS){
                let eliminar = await azureSqlClient('TARIFA_SCALLING')
                .where('SCALLING_ID', `${campos.cod_tarifa_scalling}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        metodo_id: getTarifaS.METODO_ID, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'D', 
                        data: getTarifaS, 
                        tabla: "TARIFA_SCALLING"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Tarifa Scalling no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}