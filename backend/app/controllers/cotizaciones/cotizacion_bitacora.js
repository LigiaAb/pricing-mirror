module.exports.listar_bitacora_cotizacion = async (campos) => {
    //Parametros para paginar datos
    const pagina = ('nopagina' in campos) && campos.nopagina>0  ? parseInt(campos.nopagina) : 1;
    const datosxpagina = ('datosxpagina' in campos) && campos.datosxpagina>0  ? parseInt(campos.datosxpagina) : 2000;

    try {

        const estructuraConsulta =  azureSqlClient({CB:"COTIZACION_BITACORA"})                
        .leftJoin({ USUA: "USUARIO" }, function () {
            this.on( 'USUA.USUARIO_ID', '=', 'CB.USUARIO_ID');
        });

        if ('cod_cotizaciondetalle' in campos) {
            estructuraConsulta.where('CD.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`);
        }
        if ('cod_cotizacion_cabecera' in campos) {
            estructuraConsulta.where('CD.COTIZACIONCABECERA_ID', `${campos.cod_cotizacion_cabecera}`);
        }
        if ('cod_usuario' in campos) {
            estructuraConsulta.where('CD.USUARIO_ID', `${campos.cod_usuario}`);
        }

        const total = await estructuraConsulta.clone()
        .count('CH.HISTORICO_EMB_ID as total');
        const totalPages = Math.ceil(total[0].total / datosxpagina);   

        var data = [];
        data = await estructuraConsulta.select(
            "CB.COTIZACIONCABECERA_ID",
            "CB.COTIZACIONDETALLE_ID",
            "CB.TIPO",
            "CB.FECHA_REGISTRO",
            "CB.USUARIO_ID",
            "USUA.USUARIO_CORREO",
            "CB.JSON_PREVIO",
            "CB.JSON_MODIFICACIONES",
            "CB.COTBITACORA_TABLA AS TABLA"
        )
        .offset((pagina - 1) * datosxpagina)
        .limit(datosxpagina);

        return {
            "total_paginas" : totalPages, 
            "total_registros": total[0].total,
            "data" : data
        };
    } catch (error) {
        return {"success" : false, "error" : error.toString()};
    }

}

module.exports.registrar_bitacora_cotizacion = async(campos) => {
    if(('cod_cotizacion_cabecera' in campos) && ('cod_tipo' in campos) && ('json_modificacion' in campos)){

        const resultado_crea = await azureSqlClient("COTIZACION_BITACORA")
        .insert({
            "COTIZACIONCABECERA_ID" : campos.cod_cotizacion_cabecera,
            "COTIZACIONDETALLE_ID"  : campos.cod_cotizaciondetalle,
            "TIPO"                  : campos.cod_tipo,
            "FECHA_REGISTRO"        : await cropa_fecha_hora_actual(),
            "USUARIO_ID"            : global.usuario.USUARIO_ID,
            "JSON_PREVIO"           : 'json_previo' in campos ? campos.json_previo : {},
            "JSON_MODIFICACIONES"   : campos.json_modificacion,
            "COTBITACORA_TABLA"     : campos.tabla,
        })
        .then(async (res) => {
            return {'success' : true,
                    "cod_mensaje" : 1041,
                    'mensaje' : 'Historico cotizacion creado correctamente' ,
                    'cod_cotizacion_cabecera': campos.cod_cotizacion_cabecera
                };
        }).catch((e) => {
            console_log(e.toString());
            return {"success" : false, "cod_mensaje" : 1042,"error" : e.toString()};
        });

        return resultado_crea;
    }else{
        return { success: false, cod_mensaje: 1043, mensaje: 'faltan parametros requeridos, verifique' };
    }
}