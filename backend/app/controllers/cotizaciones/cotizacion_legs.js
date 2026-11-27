
module.exports.listar_cotizacion_legs = async (campos) =>{

    const estructuraConsulta = azureSqlClient({COL: "COTIZACION_LEGS"})
        .leftJoin({ CD: "COTIZACION_DETALLE" }, function () {
            this.on( 'CD.COTIZACIONDETALLE_ID', '=', 'COL.COTIZACIONDETALLE_ID');
        })
        .leftJoin({ TIE: "TIPO" }, function () {
                this.on( 'TIE.TIPO_ID', '=', 'COL.TIPO_ID_TRANSPORTE');                    
        })
        .leftJoin({ PUO: "PUNTO_ENLACE" }, function () {
            this.on( 'PUO.PUNTOENLACE_ID', '=', 'COL.PUNTOENLACE_ID_ORIGEN');
        })
        .leftJoin({ PUD: "PUNTO_ENLACE" }, function () {
            this.on( 'PUD.PUNTOENLACE_ID', '=', 'COL.PUNTOENLACE_ID_DESTINO');
        })
        .leftJoin({ PAO: "PAIS" }, function () {
            this.on( 'PAO.PAIS_ID', '=', 'PUO.PAIS_ID');
        })
        .leftJoin({ PAD: "PAIS" }, function () {
            this.on( 'PAD.PAIS_ID', '=', 'PUD.PAIS_ID');
        })
        .leftJoin({ ESTCO: "ESTADO" }, function () {
            this.on( 'ESTCO.ESTADO_ID', '=', 'COL.ESTADO_ID');
        })

    if("cot_legs_id" in campos){
        estructuraConsulta.where("COL.COT_LEGS_ID", `${campos.cot_legs_id}`)
    }

    if('cod_cotizaciondetalle' in campos){
        estructuraConsulta.where("COL.COTIZACIONDETALLE_ID", `${campos.cod_cotizaciondetalle}`)
    }

    if('cod_cotizacion_cabecera' in campos){
        estructuraConsulta.where("CD.COTIZACIONCABECERA_ID", `${campos.cod_cotizacion_cabecera}`)
    }

    if('cod_estado' in campos){
        estructuraConsulta.where("COL.ESTADO_ID", `${campos.cod_estado}`)
    }

    const data = await estructuraConsulta.select(
        "COL.COT_LEGS_ID",
        'CD.COTIZACIONDETALLE_ID AS COD_COTIZACIONDETALLE',
        'CD.COTIZACIONCABECERA_ID AS COD_COTIZACION_CABECERA',
        "COL.ORDEN",

        "COL.ENTIDAD_ID_PROV_TRANS AS ENTIDAD_ID",
       
        "COL.TIPO_ID_TRANSPORTE AS COD_TIPO_TRANSPORTE",
        "TIE.TIPO_DESCRIPCION AS TIPO_DESCRIPCION_TRANSPORTE",

        "PUO.PAIS_ID AS COD_PAIS_ORIGEN",
        "PAO.PAIS_NOMBRE AS NOMBRE_PAIS_ORIGEN",                
        "PUD.PAIS_ID AS COD_PAIS_DESTINO",
        "PAD.PAIS_NOMBRE AS NOMBRE_PAIS_DESTINO",   

        "COL.PUNTOENLACE_ID_ORIGEN AS COD_PUNTOENLACE_ORIGEN",
        "PUO.PUNTOENLACE_NOMBRE AS PUNTOENLACE_NOMBRE_ORIGEN",
        "COL.PUNTOENLACE_ID_DESTINO AS COD_PUNTOENLACE_DESTINO",
        "PUD.PUNTOENLACE_NOMBRE AS PUNTOENLACE_NOMBREE_DESTINO",  

        "COL.RATE",
        "COL.COSTO",

        "COL.ESTADO_ID AS COD_ESTADO",    
        "ESTCO.ESTADO_DESCRIPCION",
    )

    return data
}

module.exports.crear_cotizacion_legs = async (campos) => {
    if( ('cod_cotizaciondetalle' in campos) && ('cod_tipo_transporte' in campos) && ('cod_puntoenlace_origen' in campos) && ('cod_puntoenlace_destino' in campos)
        && ('rate' in campos) && ('costo' in campos)){

        const resultado_crea = await azureSqlClient("COTIZACION_LEGS")
        .insert({                
            COTIZACIONDETALLE_ID: campos.cod_cotizaciondetalle,
            ENTIDAD_ID_PROV_TRANS: campos.entidad_id,
            ORDEN: campos.orden,
            TIPO_ID_TRANSPORTE: campos.cod_tipo_transporte,
            PUNTOENLACE_ID_ORIGEN: campos.cod_puntoenlace_origen,
            PUNTOENLACE_ID_DESTINO: campos.cod_puntoenlace_destino,
            RATE: campos.rate,
            COSTO: campos.costo,
            ESTADO_ID: campos.cod_estado || 1,
        })
        .returning("COT_LEGS_ID")
        .then(async (id_cot_legs) => {
            console.log('Nueva Cotizacion legs ID:' , id_cot_legs);
            return {'success' : true,
                    "cod_mensaje" : 1041,
                    'mensaje' : 'Cotizacion legs creada correctamente' ,
                    'cot_legs_id' : id_cot_legs[0]["COT_LEGS_ID"].toString()
                };
        }).catch((e) => {
            console_log(e.toString());
            return {"success" : false, "cod_mensaje" : 1042,"error" : e.toString()};
        });

        return resultado_crea

    }else{
        return {
            "success" : false,
            "cod_mensaje" : 1043,
            "mensaje" : "Faltan parametros requeridos, revisa tu documentacion"
        };
    }

}

module.exports.actualizar_cotizacion_legs = async (campos) => {
    if( ('cot_legs_id' in campos) && ('cod_cotizaciondetalle' in campos) && ('cod_tipo_transporte' in campos) 
        && ('cod_puntoenlace_origen' in campos) && ('cod_puntoenlace_destino' in campos)
        && ('rate' in campos) && ('costo' in campos) ){

        const fila_consulta_cot = await azureSqlClient("COTIZACION_LEGS")
        .where({ "COT_LEGS_ID": campos.cot_legs_id })        
        .first();

        if(fila_consulta_cot){         
           const resultado_crea = await azureSqlClient("COTIZACION_LEGS")
           .where({ "COT_LEGS_ID": campos.cot_legs_id })
            .update({
                COTIZACIONDETALLE_ID: campos.cod_cotizaciondetalle,
                ENTIDAD_ID_PROV_TRANS: campos.entidad_id,
                ORDEN: campos.orden,
                TIPO_ID_TRANSPORTE: campos.cod_tipo_transporte,
                PUNTOENLACE_ID_ORIGEN: campos.cod_puntoenlace_origen,
                PUNTOENLACE_ID_DESTINO: campos.cod_puntoenlace_destino,
                RATE: campos.rate,
                COSTO: campos.costo,   
                ESTADO_ID: campos.cod_estado,    
            })            
            .then(async (id_cot_legs) => {
                console.log('Cotizacion legs ID actualizada:' , id_cot_legs);
                return {'success' : true,
                        "cod_mensaje" : 1041,
                        'mensaje' : 'Cotizacion legs actualizada correctamente',
                        'cot_legs_id': campos.cot_legs_id
                    };
            }).catch((e) => {
                console_log(e.toString());
                return {"success" : false, "cod_mensaje" : 1042,"error" : e.toString()};
            });
    
            return resultado_crea;       
        }else{
            return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'No fue localizada la cotizacion, valide los parametros enviados.'};
        }
        
    }else{
        return {
            "success" : false,
            "cod_mensaje" : 1043,
            "mensaje" : "Faltan parametros requeridos, revisa tu documentacion"
        };
    }

}

