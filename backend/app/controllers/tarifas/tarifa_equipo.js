const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_tarifa_equipo = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TE:"TARIFA_EQUIPO"})
    if(('cod_tarifa_equipo' in campos)){
        estructuraConsulta.where('TE.TARIFAEQUIPO_ID',`${campos.cod_tarifa_equipo}`)
    }
    if(('cod_metodo' in campos)){
        estructuraConsulta.where('TE.METODO_ID',`${campos.cod_metodo}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('TE.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'TE.TARIFAEQUIPO_ID AS COD_TARIFA_EQUIPO', 
        'TE.METODO_ID AS COD_METODO', 
        'TE.EQUIPO_ID AS COD_EQUIPO', 
        'TE.TARIFAEQUIPO_COSTO AS COSTO', 
        'TE.TARIFAEQUIPO_VENTA AS VENTA', 
        'TE.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
        'TE.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
        'TE.ESTADO_ID AS COD_ESTADO', 
    )
    return data;
}

module.exports.insertar_tarifa_equipo = async (campos) => {
    if(('cod_metodo' in campos) && ('cod_equipo' in campos) && ('costo' in campos) && ('venta' in campos) 
        && ('cod_moneda_costo' in campos) && ('cod_moneda_venta' in campos) 
    ){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_EQUIPO'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("TARIFA_EQUIPO")
                .insert({
                    TARIFAEQUIPO_ID     : idnuevo, 
                    EQUIPO_ID           : campos.cod_equipo, 
                    METODO_ID           : campos.cod_metodo, 
                    TARIFAEQUIPO_COSTO  : campos.costo, 
                    TARIFAEQUIPO_VENTA  : campos.venta, 
                    MONEDA_COSTO_ID     : campos.cod_moneda_costo, 
                    MONEDA_VENTA_ID     : campos.cod_moneda_venta, 
                    ESTADO_ID           : campos.cod_estado || 1, 
                }).then(async () => {
                    insertar_tarifa_bitacora({
                        metodo_id: campos.cod_metodo, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'C', 
                        data: { cod_tarifa_equipo: idnuevo, ...campos }, 
                        tabla: "TARIFA_EQUIPO"
                    })
                    console.log('Nuevo tarifa equipo creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Tarifa equipo creada correctamente' ,
                            'cod_tarifa_equipo' : idnuevo.toString()};
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

module.exports.actualizar_tarifa_equipo = async (campos) => {
    if(('cod_tarifa_equipo' in campos) && ('cod_equipo' in campos) && ('cod_metodo' in campos) && ('costo' in campos) 
        && ('venta' in campos) && ('cod_moneda_costo' in campos) && ('cod_moneda_venta' in campos) && ('cod_estado' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_EQUIPO")
            .where('TARIFAEQUIPO_ID', `${campos.cod_tarifa_equipo}`)
            .update({
                TARIFAEQUIPO_ID     : campos.cod_tarifa_equipo, 
                EQUIPO_ID           : campos.cod_equipo, 
                METODO_ID           : campos.cod_metodo, 
                TARIFAEQUIPO_COSTO  : campos.costo, 
                TARIFAEQUIPO_VENTA  : campos.venta, 
                MONEDA_COSTO_ID     : campos.cod_moneda_costo, 
                MONEDA_VENTA_ID     : campos.cod_moneda_venta, 
                ESTADO_ID           : campos.cod_estado, 
            }).then(() => {
                insertar_tarifa_bitacora({ 
                    metodo_id: campos.cod_metodo, 
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "TARIFA_EQUIPO"
                })
                console.log('Tarifa equipo actualizada', campos.cod_tarifa_equipo);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Tarifa equipo actualizado correctamente',
                    'cod_tarifa_equipo' : campos.cod_tarifa_equipo};
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

module.exports.eliminar_tarifa_equipo = async (campos) => {
    if(('cod_tarifa_equipo' in campos)){
        try {
            var getTarifaEquipo = await azureSqlClient({TE:"TARIFA_EQUIPO"})
                .where("TE.TARIFAEQUIPO_ID", `${campos.cod_tarifa_equipo}`)
                .first();
            if(getTarifaEquipo){
                let eliminar = await azureSqlClient('TARIFA_EQUIPO')
                .where('TARIFAEQUIPO_ID', `${campos.cod_tarifa_equipo}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        metodo_id: getTarifaEquipo.METODO_ID, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'D', 
                        data: getTarifaEquipo, 
                        tabla: "TARIFA_EQUIPO"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Tarifa Equipo no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
    }
}