const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { obtener_criterios, obtener_criterios_especificos } = require("./tarifa")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_plantillas = async (campos) => {

    const estructuraConsulta = azureSqlClient({ TP: "TARIFA_PLANTILLA" })
    .leftJoin({ PEO: "PUNTO_ENLACE" }, function () {
        this.on( 'PEO.PUNTOENLACE_ID', '=', 'TP.PUNTOENLACE_ORIGEN_ID');
    }) 
    .leftJoin({ PED: "PUNTO_ENLACE" }, function () {
        this.on( 'PED.PUNTOENLACE_ID', '=', 'TP.PUNTOENLACE_DESTINO_ID');
    }) 

    if ('cod_cotizacion_cabecera' in campos) {
        estructuraConsulta.where('TP.COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`);
    }
    if(('cod_empresa' in campos)){
        estructuraConsulta.where('TP.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('TP.CENCO_ID',`${campos.cod_cc}`)
    }
    if ('entidad_id' in campos) {
        estructuraConsulta.where('TP.ENTIDAD_ID', `${campos.entidad_id}`);
    }
    if ('cod_estado' in campos) {
        estructuraConsulta.where('TP.ESTADO_ID', `${campos.cod_estado}`);
    }

    if ('cod_puntoenlace_origen' in campos) {
        estructuraConsulta.where('TP.PUNTOENLACE_ORIGEN_ID', `${campos.cod_puntoenlace_origen}`);
    }
    if ('cod_pais_origen' in campos) {
        estructuraConsulta.where('PEO.PAIS_ID', `${campos.cod_pais_origen}`);
    }

    if ('cod_puntoenlace_destino' in campos) {
        estructuraConsulta.where('TP.PUNTOENLACE_DESTINO_ID', `${campos.cod_puntoenlace_destino}`);
    }
    if ('cod_pais_destino' in campos) {
        estructuraConsulta.where('PED.PAIS_ID', `${campos.cod_pais_destino}`);
    }


    if ('cod_tipo_transporte' in campos) {
        estructuraConsulta.where('TP.TIPO_TRANSPORTE_ID', `${campos.cod_tipo_transporte}`);
    }
    if ('cod_tipo_servicio' in campos) {
        estructuraConsulta.where('TP.TIPO_SERVICIO_ID', `${campos.cod_tipo_servicio}`);
    }
    if ('cod_clasificacion_carga' in campos) {
        estructuraConsulta.where('TP.CLASIFICACION_CARGA_ID', `${campos.cod_clasificacion_carga}`);
    }
    if ('incoterm_id' in campos) {
        estructuraConsulta.where('TP.INCOTERM_ID', `${campos.incoterm_id}`);
    }
    if ('cod_tipo_pago' in campos) {
        estructuraConsulta.where('TP.TIPO_PAGO_ID', `${campos.cod_tipo_pago}`);
    }

    const data = await estructuraConsulta.select(
        'TP.TARIFAPLANTILLA_ID AS COD_TARIFAPLANTILLA',
        'TP.TARIFAPLANTILLA_DESCRIPCION AS DESCRIPCION',
        'TP.EMPRESA_ID AS COD_EMPRESA',
        'TP.CENCO_ID AS COD_CC',
        'TP.TIPO_SERVICIO_ID AS COD_TIPO_SERVICIO', 
        'TP.TIPO_TRANSPORTE_ID AS COD_TIPO_TRANSPORTE', 
        'TP.ESTADO_ID AS COD_ESTADO',
        'TP.TIPO_CARGA_ID AS COD_TIPO_CARGA',
        'TP.CLASIFICACION_CARGA_ID AS COD_CLASIFICACION_CARGA',
        'TP.INCOTERM_ID',
        'TP.TIPO_PAGO_ID AS COD_TIPO_PAGO',
        'TP.ENTIDAD_ID',
        'TP.PUNTOENLACE_ORIGEN_ID AS COD_PUNTOENLACE_ORIGEN',
        'PEO.PAIS_ID AS COD_PAIS_ORIGEN', 
        'PEO.TIPO_ID AS COD_TIPO_PUNTOENLACE_ORIGEN', 
        'TP.PUNTOENLACE_DESTINO_ID AS COD_PUNTOENLACE_DESTINO',
        'PED.PAIS_ID AS COD_PAIS_DESTINO', 
        'PED.TIPO_ID AS COD_TIPO_PUNTOENLACE_DESTINO', 
        'TP.CARRIER_ID',
        'TP.ENTIDADCONTACTO_ID AS ENTIDADCONTACTO_ID',
        'TP.ENTIDAD_ID_ESTACION AS ENTIDAD_ID_ESTACION'
    );

    return data;
}

module.exports.insertar_plantilla = async (campos) => {
    if(('cod_tipo_servicio' in campos) && ('cod_tipo_transporte' in campos) && ('cod_empresa' in campos)
        && ('cod_cc' in campos) && ('descripcion' in campos)
    ){

        try {
            let resinsert = await azureSqlClient("TARIFA_PLANTILLA")
            .insert({
                TARIFAPLANTILLA_DESCRIPCION: campos.descripcion,
                EMPRESA_ID : campos.cod_empresa,
                CENCO_ID : campos.cod_cc,
                TIPO_SERVICIO_ID : campos.cod_tipo_servicio, 
                TIPO_TRANSPORTE_ID : campos.cod_tipo_transporte, 
                ESTADO_ID : campos.cod_estado,
                TIPO_CARGA_ID : campos.cod_tipo_carga,
                CLASIFICACION_CARGA_ID : campos.cod_clasificacion_carga,
                TIPO_PAGO_ID : campos.cod_tipo_pago,
                PUNTOENLACE_ORIGEN_ID : campos.cod_puntoenlace_origen,
                PUNTOENLACE_DESTINO_ID : campos.cod_puntoenlace_destino,
                ENTIDAD_ID: campos.entidad_id,
                INCOTERM_ID: campos.incoterm_id,
                CARRIER_ID: campos.carrier_id,
                ENTIDADCONTACTO_ID: campos.entidadcontacto_id,
                ENTIDAD_ID_ESTACION: campos.entidad_id_estacion
            })
            .returning('TARIFAPLANTILLA_ID')
            .then(async (key) => {
                console.log('Nueva plantilla creado ID:' , key[0]['TARIFAPLANTILLA_ID'].toString());
                return {'success' : true,
                        "cod_mensaje" : 1041,
                        'mensaje' : 'Plantilla creada correctamente' ,
                        'cod_tarifaplantilla': key[0]['TARIFAPLANTILLA_ID'].toString() }
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
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.actualizar_plantilla = async (campos) => {
    if(('cod_tarifaplantilla' in campos) && ('cod_tipo_servicio' in campos) && ('cod_tipo_transporte' in campos) 
        && ('cod_empresa' in campos) && ('cod_cc' in campos) && ('descripcion' in campos) && ('cod_estado' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_PLANTILLA")
            .where('TARIFAPLANTILLA_ID', `${campos.cod_tarifaplantilla}`)
            .update({
                TARIFAPLANTILLA_DESCRIPCION: campos.descripcion,
                EMPRESA_ID : campos.cod_empresa,
                CENCO_ID : campos.cod_cc,
                TIPO_SERVICIO_ID : campos.cod_tipo_servicio, 
                TIPO_TRANSPORTE_ID : campos.cod_tipo_transporte, 
                ESTADO_ID : campos.cod_estado,
                TIPO_CARGA_ID : campos.cod_tipo_carga,
                CLASIFICACION_CARGA_ID : campos.cod_clasificacion_carga,
                TIPO_PAGO_ID : campos.cod_tipo_pago,
                PUNTOENLACE_ORIGEN_ID : campos.cod_puntoenlace_origen,
                PUNTOENLACE_DESTINO_ID : campos.cod_puntoenlace_destino,
                ENTIDAD_ID: campos.entidad_id,
                INCOTERM_ID: campos.incoterm_id,
                CARRIER_ID: campos.carrier_id,
                ENTIDADCONTACTO_ID: campos.entidadcontacto_id,
                ENTIDAD_ID_ESTACION: campos.entidad_id_estacion
            }).then(() => {
                console.log('Plantilla actualizada', campos.cod_tarifaplantilla );
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Plantilla actualizada correctamente',
                    'cod_tarifaplantilla' : campos.cod_tarifaplantilla};
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

module.exports.eliminar_plantilla = async (campos) => {
    if(('cod_tarifaplantilla' in campos)){
        try {
            var getPlantilla = await azureSqlClient({TP:"TARIFA_PLANTILLA"})
                .where("TP.TARIFAPLANTILLA_ID", `${campos.cod_tarifaplantilla}`)
                .first();
            if(getPlantilla){
                let eliminar = await azureSqlClient('TARIFA_PLANTILLA')
                .where('TARIFAPLANTILLA_ID', `${campos.cod_tarifaplantilla}`)
                .del()
                .then(async result => {
                    return {'success' : true,"cod_mensaje" : 1051, 'mensaje' :'Eliminado correctamente'};
                }).catch((e) => {
                    insertar_tarifa_bitacora({
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: 4, 
                        accion: 'D', 
                        data: getPlantilla, 
                        tabla: "TARIFA_PLANTILLA"
                    })
                    console_log(e.toString());                    
                    return {"success" : false, "cod_mensaje" : 1052, "error" : e.toString()};
                }
                );
                return eliminar;
            }else{
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Plantilla no fue localizada'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }   
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}

module.exports.recupera_plantilla = async (campos) => {
    if(('cod_tipo_transporte' in campos) && ('cod_empresa' in campos) && ('cod_cc' in campos)
    ){

        const consultaRubros =  azureSqlClient({R:"RUBRO"})
        // .whereIn('R.RUBRO_ID', Array.isArray(campos.cod_rubro) ? campos.cod_rubro : [campos.cod_rubro])
        .where('R.ESTADO_ID', 1)

        let rubros_validos = []
        let criterios_validos = []
        
        const rubros = await consultaRubros.select(
            'R.RUBRO_ID AS COD_RUBRO', 
            'R.RUBRO_NOMBRE AS NOMBRE_RUBRO', 
            'R.ESTADO_ID AS COD_ESTADO'
        )

        for await (let rubro of rubros) {

            const consultaServicios =  azureSqlClient({S:"SERVICIO"})
            .leftJoin({ TS: "TIPO" }, function () {
                this.on( 'TS.TIPO_ID', '=', 'S.TIPO_SERVICIO_ID');
            })
            .leftJoin({ TTR: "TIPO" }, function () {
                this.on( 'TTR.TIPO_ID', '=', 'S.TIPO_TRANSPORTE_ID');
            })
            .leftJoin({ TC: "TIPO" }, function () {
                this.on( 'TC.TIPO_ID', '=', 'S.TIPO_CALCULO_ID');
            })
            .leftJoin({ TA: "TIPO" }, function () {
                this.on( 'TA.TIPO_ID', '=', 'S.TIPO_APLICACION_ID');
            })
            .leftJoin({ TCA: "TIPO" }, function () {
                this.on( 'TCA.TIPO_ID', '=', 'S.TIPO_CARGA_ID');
            })
            .leftJoin({ CLA: "TIPO" }, function () {
                this.on( 'CLA.TIPO_ID', '=', 'S.CLASIFICACION_CARGA_ID');
            })
            .leftJoin({ TP: "TIPO" }, function () {
                this.on( 'TP.TIPO_ID', '=', 'S.TIPO_PAGO_ID');
            })
            .leftJoin({E:"ENTIDAD"}, function () {
                this.on( 'E.ENTIDAD_ID', '=', 'S.ENTIDAD_ID');
            })
            .leftJoin({IT:"INCOTERM"}, function () {
                this.on( 'IT.INCOTERM_ID', '=', 'S.INCOTERM_ID');
            })
            .where('S.RUBRO_ID', rubro.COD_RUBRO)
            .where('S.ESTADO_ID', 1)
            // .where('S.TIPO_SERVICIO_ID',`${campos.cod_tipo_servicio}`)
            .where('S.TIPO_TRANSPORTE_ID',`${campos.cod_tipo_transporte}`)
            .where('S.EMPRESA_ID',`${campos.cod_empresa}`)
            .where('S.CENCO_ID',`${campos.cod_cc}`)

            if('cod_tipo_servicio' in campos && !!campos.cod_tipo_servicio){
                consultaServicios.where(function() {
                    this.where('S.TIPO_SERVICIO_ID',`${campos.cod_tipo_servicio}`)
                    .orWhereNull('S.TIPO_SERVICIO_ID')
                })

            } else {
                const tipo_servicio_posible = await azureSqlClient({ TR: "TIPO_RELACION" })
                .leftJoin({ T: "TIPO" }, function () {
                    this.on( 'T.TIPO_ID', '=', 'TR.TIPO_ID');
                })
                .leftJoin({ TP: "TIPO" }, function () {
                    this.on( 'TP.TIPO_ID', '=', 'TR.TIPO_PADRE_ID');
                })
                .where('TR.TIPO_PADRE_ID', `${campos.cod_tipo_transporte}`)
                .where('T.TIPO_TABLA', `SERVICIO`)
                .where('T.ESTADO_ID', 1)
                .where('TP.ESTADO_ID', 1)
                .where('TR.ESTADO_ID', 1)
                .select(
                    "TR.TIPO_ID",
                );
                consultaServicios.where(function() {
                    this.whereIn('S.TIPO_SERVICIO_ID', tipo_servicio_posible.map(tipo => tipo.TIPO_ID))
                    .orWhereNull('S.TIPO_SERVICIO_ID')
                })
            }

            if('cod_tipo_carga' in campos){
                consultaServicios.where(function() {
                    this.where('S.TIPO_CARGA_ID',`${campos.cod_tipo_carga}`)
                    .orWhere('S.TIPO_CARGA_ID', 119)
                    .orWhereNull('S.TIPO_CARGA_ID')
                })
            }

            if('cod_clasificacion_carga' in campos){
                consultaServicios.where(function() {
                    this.where('S.CLASIFICACION_CARGA_ID',`${campos.cod_clasificacion_carga}`)
                    .orWhere('S.CLASIFICACION_CARGA_ID', 123)
                    .orWhereNull('S.CLASIFICACION_CARGA_ID')
                })
            }

            if(('incoterm_id' in campos)){
                console.log(campos.incoterm_id)
                consultaServicios.where(function() {
                    this.where('S.INCOTERM_ID',`${campos.incoterm_id}`)
                    .orWhereNull('S.INCOTERM_ID')
                })
            }       
            
            if('cod_tipo_pago' in campos){
                consultaServicios.where(function() {
                    this.where('S.TIPO_PAGO_ID',`${campos.cod_tipo_pago}`)
                    .orWhere('S.TIPO_PAGO_ID', 131)
                    .orWhereNull('S.TIPO_PAGO_ID')
                })
            }

            if('cod_proveedor' in campos){
                consultaServicios.where('S.ENTIDAD_ID',`${campos.cod_proveedor}`)
            }

            let servicios = await consultaServicios.select(
                'S.SERVICIO_ID', 
            )

            if(servicios.length > 0){
                rubros_validos.push(rubro)
                criterios_validos = [
                    ...criterios_validos, 
                    ...await obtener_criterios_especificos({cod_servicio: servicios.map(servicio => servicio.SERVICIO_ID)})
                ]
            }
        }

        return [{
            COD_TARIFAPLANTILLA: 0,
            DESCRIPCION: "",
            COD_EMPRESA: campos.cod_empresa,
            COD_CC: campos.cod_cc,
            COD_TIPO_SERVICIO: campos.cod_tipo_servicio,
            COD_TIPO_TRANSPORTE: campos.cod_tipo_transporte,
            COD_TIPO_CARGA: campos.cod_tipo_carga,
            COD_CLASIFICACION_CARGA: campos.cod_clasificacion_carga,
            INCOTERM_ID: campos.incoterm_id,
            COD_TIPO_PAGO: campos.cod_tipo_pago,
            COD_ESTADO: 1,
            RUBROS: rubros_validos,
            CRITERIOS: eliminarCriteriosRepetidos(criterios_validos)
        }];

        
    } else {
        return {'success' : false, "cod_mensaje" : 1048, 'mensaje' : 'Debe enviar los atributos requeridos'};
    }
}

function eliminarCriteriosRepetidos(criterios){
    const agregados = new Set();
    return criterios.filter(item => {
        if (!agregados.has(item.DESCRIPCION)) {
        agregados.add(item.DESCRIPCION);
        return true; 
        }
        return false;
    });
}