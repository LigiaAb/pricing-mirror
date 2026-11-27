const { crear_coordinacion_cotizacion } = require("../admon/embarques/coordinacion_embarque");
const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")
const moment = require("moment");

module.exports.getlista_tarifa_spot = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TS:"TARIFA_SPOT"})

    if(('cod_tarifa_spot' in campos)){
        estructuraConsulta.where('TS.TARIFASPOT_ID',`${campos.cod_tarifa_spot}`)
    }
    if(('cod_cotizaciondetalle' in campos)){
        estructuraConsulta.where('TS.COTIZACIONDETALLE_ID',`${campos.cod_cotizaciondetalle}`)
    }
    if(('cod_usuario_tarifaspot' in campos)){
        estructuraConsulta.where('TS.TARIFASPOT_USUARIO_ID',`${campos.cod_usuario_tarifaspot}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('TS.ESTADO_ID',`${campos.cod_estado}`)
    }

    const data = await estructuraConsulta.select(
        "TARIFASPOT_ID AS COD_TARIFA_SPOT",
        "COTIZACIONDETALLE_ID AS COD_COTIZACIONDETALLE" ,
        "TARIFASPOT_VENTA AS VENTA" ,
        "TARIFASPOT_COSTO AS COSTO" ,
        "TARIFASPOT_DOCUMENTO AS URL_DOCUMENTO" ,
        "TARIFASPOT_USUARIO_ID AS COD_USUARIO_TARIFASPOT" ,
        "TARIFASPOT_USUARIO_AUTORIZA_ID AS COD_USUARIO_AUTORIZA_TARIFASPOT",
        "ESTADO_ID AS COD_ESTADO" ,
        "TARIFASPOT_VENTA_ORIGINAL AS VENTA_ORIGINAL" ,
        "TARIFASPOT_COSTO_ORIGINAL AS COSTO_ORIGINAL" ,
        "TARIFASPOT_FLETE AS FLETE",
        "TARIFASPOT_REASON_CODE AS REASON_CODE" ,
        "TARIFASPOT_JUSTIFICACION AS JUSIFICACION"
    )
    return data;
}

module.exports.insertar_tarifa_spot = async (campos) => {
    if(('cod_cotizaciondetalle' in campos) && ('venta' in campos) && ('costo' in campos) && ('cod_estado' in campos)
    ){

        try {
            let resinsert = await azureSqlClient("TARIFA_SPOT")
            .insert({
                COTIZACIONDETALLE_ID: campos.cod_cotizaciondetalle ,
                TARIFASPOT_VENTA: campos.venta ,
                TARIFASPOT_COSTO: campos.costo ,
                TARIFASPOT_DOCUMENTO: campos.url_documento ,
                TARIFASPOT_USUARIO_ID: campos.cod_usuario_tarifaspot ,
                TARIFASPOT_USUARIO_AUTORIZA_ID: campos.cod_usuario_autoriza_tarifaspot,
                TARIFASPOT_VENTA_ORIGINAL: campos.venta_original,
                TARIFASPOT_COSTO_ORIGINAL: campos.costo_original,
                TARIFASPOT_FLETE: campos.flete,
                TARIFASPOT_REASON_CODE: campos.reason_code,
                TARIFASPOT_JUSTIFICACION: campos.jusificacion,
                ESTADO_ID: campos.cod_estado ,
            })
            .returning("TARIFASPOT_ID")
            .then(async (tarifa) => {
                console.log('Nueva Tarifa Spot creado ID:' , tarifa[0]["TARIFASPOT_ID"].toString());
                return {'success' : true,
                        "cod_mensaje" : 1041,
                        'mensaje' : 'Tarifa Spot creada correctamente' ,
                        'cod_tarifa_spot' : tarifa[0]["TARIFASPOT_ID"].toString()};
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
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.actualizar_tarifa_spot = async (campos) => {
    if(('cod_tarifa_spot' in campos) && ('cod_cotizaciondetalle' in campos) && ('venta' in campos) && ('costo' in campos) && ('cod_estado' in campos)){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_SPOT")
            .where('TARIFASPOT_ID', `${campos.cod_tarifa_spot}`)
            .update({
                COTIZACIONDETALLE_ID: campos.cod_cotizaciondetalle ,
                TARIFASPOT_VENTA: campos.venta ,
                TARIFASPOT_COSTO: campos.costo ,
                TARIFASPOT_DOCUMENTO: campos.url_documento ,
                TARIFASPOT_USUARIO_ID: campos.cod_usuario_tarifaspot ,
                TARIFASPOT_USUARIO_AUTORIZA_ID: campos.cod_usuario_autoriza_tarifaspot,
                TARIFASPOT_VENTA_ORIGINAL: campos.venta_original,
                TARIFASPOT_COSTO_ORIGINAL: campos.costo_original,
                TARIFASPOT_FLETE: campos.flete,
                TARIFASPOT_REASON_CODE: campos.reason_code,
                TARIFASPOT_JUSTIFICACION: campos.jusificacion,
                ESTADO_ID: campos.cod_estado ,
            })
            .then((tarifa) => {
                console.log('Tarifa Spot actualizada', campos.cod_tarifa_spot);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Tarifa Spot actualizada correctamente',
                    'cod_tarifa_spot' : campos.cod_tarifa_spot};
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

module.exports.eliminar_tarifa_spot = async (campos) => {
    if(('cod_tarifa_spot' in campos)){          
        try {
            var getRuta = await azureSqlClient({TS:"TARIFA_SPOT"})
                .where("TS.TARIFASPOT_ID", `${campos.cod_tarifa_spot}`)
                .first();
            if(getRuta){
                let eliminar = await azureSqlClient('TARIFA_SPOT')
                .where('TARIFASPOT_ID', `${campos.cod_tarifa_spot}`)
                .del()
                .then(async result => {
                    return {'success' : true,"cod_mensaje" : 1051, 'mensaje' :'Eliminado correctamente'};
                }).catch((e) => {
                    console_log(e.toString());                    
                    return {"success" : false, "cod_mensaje" : 1052, "error" : e.toString()};
                });
                return eliminar;
            }else{
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Tarifa Spot no fue localizada'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}

module.exports.cargar_archivo_spot = async (campos) => {
    if(!campos.files){
        return {
            'success' : false, 
            "cod_mensaje" : 1090,
            'mensaje' : 'No se envio un archivo, verifique'
        };            
    }

    const archivo = campos.files.archivo;

    if('cod_tarifa_spot' in campos.body){

        const tarifa = await azureSqlClient({TS: "TARIFA_SPOT"})
        .leftJoin({ CD: "COTIZACION_DETALLE" }, function () {
            this.on( 'CD.COTIZACIONDETALLE_ID', '=', 'TS.COTIZACIONDETALLE_ID');
        })
        .leftJoin({ CC: "COTIZACION_CABECERA" }, function () {
            this.on( 'CC.COTIZACIONCABECERA_ID', '=', 'CD.COTIZACIONCABECERA_ID');
        })
        .where("TS.TARIFASPOT_ID", `${campos.body.cod_tarifa_spot}`)
        .first(
            "TS.TARIFASPOT_ID",
            "TS.COTIZACIONDETALLE_ID",
            "CD.COTIZACIONCABECERA_ID",
            "CC.ENTIDAD_ID",
            "CD.COTIZACIONDETALLE_VERSION"
        )

        if(!tarifa) return { 'success' : false, "cod_mensaje" : 1090, 'mensaje' : 'No se localizado la tarifa spot o la cotización.' };  

        try {
        //Procesar Archivo
            const ruta = `/cropa/cotizaciones/entidad_${tarifa.ENTIDAD_ID}/${tarifa.COTIZACIONCABECERA_ID}/359/VERSION_${tarifa.COTIZACIONDETALLE_VERSION}/`;
            let nombre_a_registrar = `${moment().unix()}_tarifa_spot.pdf`;
            let ruta_destino = `${ruta}`.replace(" ", "_");

            await sftpAzure_.writeFile(
                {
                    dir: `${ruta_destino}`,
                    file: archivo.data,
                    nombre: `${ruta_destino}${nombre_a_registrar}`,
                },
                false
            );

            await azureSqlClient("TARIFA_SPOT")
            .where('TARIFASPOT_ID', `${campos.body.cod_tarifa_spot}`)
            .update({ TARIFASPOT_DOCUMENTO: `${ruta_destino}${nombre_a_registrar}`})

            await crear_coordinacion_cotizacion({
                cod_cotizacion_cabecera: tarifa.COTIZACIONCABECERA_ID,
                cod_cotizaciondetalle: tarifa.COTIZACIONDETALLE_ID,
                cod_tip_doc: 359,
                url_documento: `${ruta_destino}${nombre_a_registrar}`
            })  
            
            return {
                success: true,
                cod_mensaje: 1041,
                mensaje: 'Documento cargado correctamente',
                cod_tarifa_spot: campos.body.cod_tarifa_spot,
                url_documento: `${ruta_destino}${nombre_a_registrar}`
            }
            
        } catch (error) {
            console.error(error);            
            return {"success" : false, "error" : error.toString()};            
        }   
    }         
}