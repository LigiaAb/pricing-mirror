const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_tarifa_costoventa = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TCV:"TARIFA_COSTOVENTA"})
    if(('cod_tarifa_costoventa' in campos)){
        estructuraConsulta.where('TCV.COSTOVENTA_ID',`${campos.cod_tarifa_costoventa}`)
    }
    if(('cod_metodo' in campos)){
        estructuraConsulta.where('TCV.METODO_ID',`${campos.cod_metodo}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('TCV.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'TCV.COSTOVENTA_ID AS COD_TARIFA_COSTOVENTA', 
        'TCV.METODO_ID AS COD_METODO', 
        'TCV.COSTOVENTA_COSTO AS COSTO', 
        'TCV.COSTOVENTA_VENTA AS VENTA', 
        'TCV.MONEDA_COSTO_ID AS COD_MONEDA_COSTO', 
        'TCV.MONEDA_VENTA_ID AS COD_MONEDA_VENTA', 
        'TCV.ESTADO_ID AS COD_ESTADO', 
    )
    return data;
}

module.exports.insertar_tarifa_costoventa = async (campos) => {
    if(('cod_metodo' in campos) && ('costo' in campos) && ('venta' in campos) 
        && ('cod_moneda_costo' in campos) && ('cod_moneda_venta' in campos) 
    ){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_COSTOVENTA'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("TARIFA_COSTOVENTA")
                .insert({
                    COSTOVENTA_ID       : idnuevo, 
                    METODO_ID           : campos.cod_metodo, 
                    COSTOVENTA_COSTO    : campos.costo, 
                    COSTOVENTA_VENTA    : campos.venta, 
                    MONEDA_COSTO_ID     : campos.cod_moneda_costo, 
                    MONEDA_VENTA_ID     : campos.cod_moneda_venta, 
                    ESTADO_ID           : campos.cod_estado || 1, 
                }).then(async () => {
                    insertar_tarifa_bitacora({
                        metodo_id: campos.cod_metodo, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'C', 
                        data: { cod_tarifa_costoventa: idnuevo, ...campos }, 
                        tabla: "TARIFA_COSTOVENTA"
                    })
                    console.log('Nuevo tarifa Costo/Venta creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Tarifa Costo/Venta creada correctamente' ,
                            'cod_tarifa_costoventa' : idnuevo.toString()};
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

module.exports.actualizar_tarifa_costoventa = async (campos) => {
    if(('cod_tarifa_costoventa' in campos) && ('cod_metodo' in campos) && ('costo' in campos) && ('venta' in campos) 
        && ('cod_moneda_costo' in campos) && ('cod_moneda_venta' in campos) && ('cod_estado' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_COSTOVENTA")
            .where('COSTOVENTA_ID', `${campos.cod_tarifa_costoventa}`)
            .update({
                COSTOVENTA_ID       : campos.cod_tarifa_costoventa, 
                METODO_ID           : campos.cod_metodo, 
                COSTOVENTA_COSTO    : campos.costo, 
                COSTOVENTA_VENTA    : campos.venta, 
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
                    tabla: "TARIFA_COSTOVENTA"
                })
                console.log('Tarifa Costo/Venta actualizada', campos.cod_tarifa_costoventa);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Tarifa Costo/Venta actualizado correctamente',
                    'cod_tarifa_costoventa' : campos.cod_tarifa_costoventa};
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

module.exports.eliminar_tarifa_costoventa = async (campos) => {
    if(('cod_tarifa_costoventa' in campos)){
        try {
            var getTarifaCV = await azureSqlClient({TCV:"TARIFA_COSTOVENTA"})
                .where("TCV.COSTOVENTA_ID", `${campos.cod_tarifa_costoventa}`)
                .first();
            if(getTarifaCV){
                let eliminar = await azureSqlClient('TARIFA_COSTOVENTA')
                .where('COSTOVENTA_ID', `${campos.cod_tarifa_costoventa}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        metodo_id: getTarifaCV.METODO_ID, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'D', 
                        data: getTarifaCV, 
                        tabla: "TARIFA_COSTOVENTA"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Tarifa Costo/Venta no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}