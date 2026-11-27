const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_tarifa_cobertura = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TP:"TARIFA_COBERTURA"})
    if(('cod_tarifa_cobertura' in campos)){
        estructuraConsulta.where('TP.TARIFACOBERTURA_ID',`${campos.cod_tarifa_cobertura}`)
    }
    if(('cod_metodo' in campos)){
        estructuraConsulta.where('TP.METODO_ID',`${campos.cod_metodo}`)
    }
    if(('cod_rubro' in campos)){
        estructuraConsulta.where('TP.RUBRO_ID',`${campos.cod_rubro}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('TP.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'TP.TARIFACOBERTURA_ID AS COD_TARIFA_COBERTURA', 
        'TP.METODO_ID AS COD_METODO', 
        'TP.RUBRO_ID AS COD_RUBRO', 
        'TP.TARIFACOBERTURA_COSTO_MINIMO AS MINIMO_COSTO',
        'TP.TARIFACOBERTURA_VENTA_MINIMO AS MINIMO_VENTA',
        'TP.TARIFACOBERTURA_PORCENTAJE_COSTO AS PORCENTAJE_COSTO', 
        'TP.TARIFACOBERTURA_PORCENTAJE_VENTA AS PORCENTAJE_VENTA', 
        'TP.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
        'TP.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
        'TP.ESTADO_ID AS COD_ESTADO', 
    )
    return data;
}

module.exports.insertar_tarifa_cobertura = async (campos) => {
    if(('cod_metodo' in campos) && ('cod_rubro' in campos) && ('porcentaje_costo' in campos) && ('porcentaje_venta' in campos) 
        && ('cod_moneda_costo' in campos) && ('cod_moneda_venta' in campos) && ('minimo_costo' in campos) && ('minimo_venta' in campos)
    ){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_COBERTURA'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("TARIFA_COBERTURA")
                .insert({
                    TARIFACOBERTURA_ID                  : idnuevo, 
                    METODO_ID                           : campos.cod_metodo, 
                    RUBRO_ID                            : campos.cod_rubro, 
                    TARIFACOBERTURA_COSTO_MINIMO        : campos.minimo_costo,
                    TARIFACOBERTURA_VENTA_MINIMO        : campos.minimo_venta,
                    TARIFACOBERTURA_PORCENTAJE_COSTO    : campos.porcentaje_costo, 
                    TARIFACOBERTURA_PORCENTAJE_VENTA    : campos.porcentaje_venta, 
                    MONEDA_COSTO_ID                     : campos.cod_moneda_costo, 
                    MONEDA_VENTA_ID                     : campos.cod_moneda_venta, 
                    ESTADO_ID                           : campos.cod_estado || 1, 
                }).then(async () => {
                    insertar_tarifa_bitacora({
                        metodo_id: campos.cod_metodo, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'C', 
                        data: { cod_tarifa_cobertura: idnuevo, ...campos }, 
                        tabla: "TARIFA_COBERTURA"
                    })
                    console.log('Nuevo tarifa Porcentaje creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Tarifa Porcentaje creada correctamente' ,
                            'cod_tarifa_cobertura' : idnuevo.toString()};
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

module.exports.actualizar_tarifa_cobertura = async (campos) => {
    if(('cod_tarifa_cobertura' in campos) &&  ('cod_metodo' in campos) && ('cod_rubro' in campos) && ('porcentaje_costo' in campos) 
        && ('porcentaje_venta' in campos)  && ('cod_moneda_costo' in campos) && ('cod_moneda_venta' in campos) && ('minimo_costo' in campos) && ('minimo_venta' in campos)
    ){ 
        try {
            let dataActualiza = await azureSqlClient("TARIFA_COBERTURA")
            .where('TARIFACOBERTURA_ID', `${campos.cod_tarifa_cobertura}`)
            .update({
                METODO_ID                           : campos.cod_metodo, 
                RUBRO_ID                            : campos.cod_rubro, 
                TARIFACOBERTURA_PORCENTAJE_COSTO    : campos.porcentaje_costo, 
                TARIFACOBERTURA_PORCENTAJE_VENTA    : campos.porcentaje_venta, 
                TARIFACOBERTURA_COSTO_MINIMO        : campos.minimo_costo,
                TARIFACOBERTURA_VENTA_MINIMO        : campos.minimo_venta,
                MONEDA_COSTO_ID                     : campos.cod_moneda_costo, 
                MONEDA_VENTA_ID                     : campos.cod_moneda_venta, 
                ESTADO_ID                           : campos.cod_estado || 1, 
            }).then(() => {
                insertar_tarifa_bitacora({ 
                    metodo_id: campos.cod_metodo, 
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "TARIFA_COBERTURA"
                })
                console.log('Tarifa Porcentaje actualizada', campos.cod_tarifa_cobertura);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Tarifa Porcentaje actualizado correctamente',
                    'cod_tarifa_cobertura' : campos.cod_tarifa_cobertura};
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

module.exports.eliminar_tarifa_cobertura = async (campos) => {
    if(('cod_tarifa_cobertura' in campos)){
        try {
            var getTarifaCV = await azureSqlClient({TP:"TARIFA_COBERTURA"})
                .where("TP.TARIFACOBERTURA_ID", `${campos.cod_tarifa_cobertura}`)
                .first();
            if(getTarifaTP){
                let eliminar = await azureSqlClient('TARIFA_COBERTURA')
                .where('TARIFACOBERTURA_ID', `${campos.cod_tarifa_cobertura}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        metodo_id: getTarifaTP.METODO_ID, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'D', 
                        data: getTarifaTP, 
                        tabla: "TARIFA_COBERTURA"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Tarifa Porcentaje no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}