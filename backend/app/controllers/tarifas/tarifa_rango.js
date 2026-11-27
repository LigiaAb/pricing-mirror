const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_tarifa_rango = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TR:"TARIFA_RANGO"})
    if(('cod_tarifa_rango' in campos)){
        estructuraConsulta.where('TR.TARIFARANGO_ID',`${campos.cod_tarifa_rango}`)
    }
    if(('cod_metodo' in campos)){
        estructuraConsulta.where('TR.METODO_ID',`${campos.cod_metodo}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('TR.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'TR.TARIFARANGO_ID AS COD_TARIFA_RANGO', 
        'TR.METODO_ID AS COD_METODO', 
        'TR.TARIFARANGO_INICIO AS INICIO', 
        'TR.TARIFARANGO_FINAL AS FINAL', 
        'TR.TARIFARANGO_COSTO AS COSTO', 
        'TR.TARIFARANGO_VENTA AS VENTA', 
        'TR.TARIFARANGO_COSTO_MINIMO AS COSTO_MINIMO', 
        'TR.TARIFARANGO_VENTA_MINIMO AS VENTA_MINIMO', 
        'TR.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
        'TR.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
        'TR.ESTADO_ID AS COD_ESTADO', 
    )
    return data;
}

module.exports.insertar_tarifa_rango = async (campos) => {
    if(('cod_metodo' in campos) && ('inicio' in campos) && ('costo' in campos) && ('venta' in campos) 
        && ('costo_minimo' in campos) && ('venta_minimo' in campos) && ('cod_moneda_costo' in campos) && ('cod_moneda_venta' in campos) 
    ){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_RANGO'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("TARIFA_RANGO")
                .insert({
                    TARIFARANGO_ID      : idnuevo, 
                    METODO_ID           : campos.cod_metodo,
                    TARIFARANGO_INICIO  : campos.inicio, 
                    TARIFARANGO_FINAL   : campos.final,  
                    TARIFARANGO_COSTO  : campos.costo, 
                    TARIFARANGO_VENTA  : campos.venta, 
                    TARIFARANGO_COSTO_MINIMO:  campos.costo_minimo, 
                    TARIFARANGO_VENTA_MINIMO:  campos.venta_minimo, 
                    MONEDA_COSTO_ID     : campos.cod_moneda_costo, 
                    MONEDA_VENTA_ID     : campos.cod_moneda_venta, 
                    ESTADO_ID           : campos.cod_estado || 1, 
                }).then(async () => {
                    insertar_tarifa_bitacora({
                        metodo_id: campos.cod_metodo, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'C', 
                        data: { cod_tarifa_rango: idnuevo, ...campos }, 
                        tabla: "TARIFA_RANGO"
                    })
                    console.log('Nuevo tarifa rango creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Tarifa rango creada correctamente' ,
                            'cod_tarifa_rango' : idnuevo.toString()};
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

module.exports.actualizar_tarifa_rango = async (campos) => {
    if(('cod_tarifa_rango' in campos) && ('cod_metodo' in campos) && ('inicio' in campos)
        && ('costo' in campos) && ('venta' in campos) && ('costo_minimo' in campos) && ('venta_minimo' in campos) && ('cod_moneda_costo' in campos) 
        && ('cod_moneda_venta' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_RANGO")
            .where('TARIFARANGO_ID', `${campos.cod_tarifa_rango}`)
            .update({
                TARIFARANGO_ID       : campos.cod_tarifa_rango,
                METODO_ID           : campos.cod_metodo,
                TARIFARANGO_INICIO  : campos.inicio, 
                TARIFARANGO_FINAL   : campos.final,  
                TARIFARANGO_COSTO  : campos.costo, 
                TARIFARANGO_VENTA  : campos.venta, 
                TARIFARANGO_COSTO_MINIMO:  campos.costo_minimo, 
                TARIFARANGO_VENTA_MINIMO:  campos.venta_minimo, 
                MONEDA_COSTO_ID     : campos.cod_moneda_costo, 
                MONEDA_VENTA_ID     : campos.cod_moneda_venta, 
                ESTADO_ID           : campos.cod_estado 
            }).then(() => {
                insertar_tarifa_bitacora({ 
                    metodo_id: campos.cod_metodo, 
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "TARIFA_RANGO"
                })
                console.log('Tarifa rango actualizada', campos.cod_tarifa_rango);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Tarifa rango actualizado correctamente',
                    'cod_tarifa_rango' : campos.cod_tarifa_rango};
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

module.exports.eliminar_tarifa_rango = async (campos) => {
    if(('cod_tarifa_rango' in campos)){
        try {
            var getTarifaRango = await azureSqlClient({TR:"TARIFA_RANGO"})
                .where("TR.TARIFARANGO_ID", `${campos.cod_tarifa_rango}`)
                .first();
            if(getTarifaRango){
                let eliminar = await azureSqlClient('TARIFA_RANGO')
                .where('TARIFARANGO_ID', `${campos.cod_tarifa_rango}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        metodo_id: getTarifaRango.METODO_ID, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'D', 
                        data: getTarifaRango, 
                        tabla: "TARIFA_RANGO"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Tarifa rango no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
    }
}
