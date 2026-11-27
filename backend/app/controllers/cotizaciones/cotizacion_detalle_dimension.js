module.exports.getlista_cotizacion_detalle_dimension = async (campos) => {
    const estructuraConsulta = azureSqlClient({ CDD: "COTIZACION_DETALLE_DIMENSION" });

    if ('cod_cotdetdim' in campos) {
        estructuraConsulta.where('CDD.COTDETDIM_ID', `${campos.cod_cotdetdim}`);
    }
    if ('cod_cotizaciondetalle' in campos) {
        estructuraConsulta.where('CDD.COTIZACIONDETALLE_ID', `${campos.cod_cotizaciondetalle}`);
    }

    const data = await estructuraConsulta.select(
        "CDD.COTDETDIM_ID AS COD_COTDETDIM",
        "CDD.COTIZACIONDETALLE_ID AS COD_COTIZACIONDETALLE",
        "CDD.COTDETDIM_ANCHO AS COTDETDIM_ANCHO",
        "CDD.COTDETDIM_LARGO AS COTDETDIM_LARGO",
        "CDD.COTDETDIM_ALTO AS COTDETDIM_ALTO",
        "CDD.COTDETDIM_PESO_UNITARIO AS COTDETDIM_PESO_UNITARIO",
        "CDD.COTDETDIM_CANTIDAD AS COTDETDIM_CANTIDAD",
        "CDD.COTDETDIM_UNIDAD_MEDIDA AS COTDETDIM_UNIDAD_MEDIDA",
        "CDD.COTDETDIM_UNIDAD_PESO AS COTDETDIM_UNIDAD_PESO",

        "CDD.COTDETDIM_TOTAL_PESO AS TOTAL_PESO",
        "CDD.COTDETDIM_TOTAL_VOLUMEN AS TOTAL_VOLUMEN",
        "CDD.COTDETDIM_TOTAL_CW AS TOTAL_CW"
    );

    return data;
}


module.exports.insertar_cotizacion_detalle_dimension = async (campos) => {
    if(('cod_cotizaciondetalle' in campos)){
        try {
            let resinsert = await azureSqlClient("COTIZACION_DETALLE_DIMENSION")
            .insert({
                COTIZACIONDETALLE_ID : campos.cod_cotizaciondetalle,
                COTDETDIM_ANCHO : campos.cotdetdim_ancho,
                COTDETDIM_LARGO : campos.cotdetdim_largo,
                COTDETDIM_ALTO : campos.cotdetdim_alto,
                COTDETDIM_PESO_UNITARIO : campos.cotdetdim_peso_unitario,
                COTDETDIM_CANTIDAD : campos.cotdetdim_cantidad,
                COTDETDIM_UNIDAD_MEDIDA : campos.cotdetdim_unidad_medida,
                COTDETDIM_UNIDAD_PESO : campos.cotdetdim_unidad_peso,
                COTDETDIM_TOTAL_PESO: campos.total_peso 
                    || ((campos.cotdetdim_peso_unitario || 0) * (campos.cotdetdim_cantidad || 0)),
                COTDETDIM_TOTAL_VOLUMEN: campos.total_volumen 
                    || ((campos.cotdetdim_ancho || 0) * (campos.cotdetdim_largo || 0) * (campos.cotdetdim_alto || 0)),
                COTDETDIM_TOTAL_CW: campos.total_cw
            })
            .returning('COTDETDIM_ID')
            .then(async (key) => {
                console.log("Nuevo COTIZACION_DETALLE_DIMENSION creado ID:", key[0]['COTDETDIM_ID']);
                return { 'success': true,
                            "cod_mensaje": 1041,
                            'mensaje': 'COTIZACION_DETALLE_DIMENSION creado correctamente',
                            'cod_cotdetdim': key[0]['COTDETDIM_ID'].toString() };
            }).catch((e) => {
                console_log(e.toString());
                return { "success": false, "cod_mensaje": 1042, "error": e.toString() };
            });

            return resinsert;

        } catch (error) {
            return { 'success': false, "cod_mensaje": 1044, 'error': error.toString() };
        }


    } else {
        return { 'success': false, "cod_mensaje": 1043, 'mensaje': 'faltan parametros requeridos, verifique' };
    }
}


module.exports.actualizar_cotizacion_detalle_dimension = async (campos) => {
    if(('cod_cotdetdim' in campos) && ('cod_cotizaciondetalle' in campos)){
        try {
            let dataActualiza = await azureSqlClient("COTIZACION_DETALLE_DIMENSION")
            .where('COTDETDIM_ID', `${campos.cod_cotdetdim}`)
            .update({
                COTIZACIONDETALLE_ID : campos.cod_cotizaciondetalle,
                COTDETDIM_ANCHO : campos.cotdetdim_ancho,
                COTDETDIM_LARGO : campos.cotdetdim_largo,
                COTDETDIM_ALTO : campos.cotdetdim_alto,
                COTDETDIM_PESO_UNITARIO : campos.cotdetdim_peso_unitario,
                COTDETDIM_CANTIDAD : campos.cotdetdim_cantidad,
                COTDETDIM_UNIDAD_MEDIDA : campos.cotdetdim_unidad_medida,
                COTDETDIM_UNIDAD_PESO : campos.cotdetdim_unidad_peso,
                COTDETDIM_TOTAL_PESO: campos.total_peso,
                COTDETDIM_TOTAL_VOLUMEN: campos.total_volumen,
                COTDETDIM_TOTAL_CW: campos.total_cw
            }).then(() => {
                console.log("COTIZACION_DETALLE_DIMENSION actualizado", campos.cod_cotdetdim);
                return { 'success': true,
                         "cod_mensaje": 1031,
                         'mensaje': 'COTIZACION_DETALLE_DIMENSION actualizado correctamente',
                         'cod_cotdetdim': campos.cod_cotdetdim };
            }).catch((e) => {
                console_log(e.toString());
                return { "success": false, "cod_mensaje": 1042, "error": e.toString() };
            });
            return dataActualiza;

        } catch (error) {
            return { "success": false, "cod_mensaje": 1044, "error": error.toString() };
        }

    } else {
        return { 'success': false, "cod_mensaje": 1043, 'mensaje': 'faltan parametros requeridos, verifique' };
    }
}


module.exports.eliminar_cotizacion_detalle_dimension = async (campos) => {
    if('cod_cotdetdim' in campos){
        try {
            var busqueda = await azureSqlClient({ CDD: "COTIZACION_DETALLE_DIMENSION" })
                .where("CDD.COTDETDIM_ID", `${campos.cod_cotdetdim}`)
                .first();

            if(busqueda){
                let eliminar = await azureSqlClient("COTIZACION_DETALLE_DIMENSION")
                .where('COTDETDIM_ID', `${campos.cod_cotdetdim}`)
                .del()
                .then(async result => {
                    console.log(result);
                    return { 'success': true, "cod_mensaje": 1051, 'mensaje': 'COTIZACION_DETALLE_DIMENSION eliminado correctamente' };
                }).catch((e) => {
                    console_log(e.toString());
                    return { "success": false, "cod_mensaje": 1052, "error": e.toString() };
                });

                return eliminar;

            } else {
                return { 'success': false, "cod_mensaje": 1054, 'mensaje': 'COTIZACION_DETALLE_DIMENSION no fue localizado' };
            }

        } catch (error) {
            return { "success": false, "cod_mensaje": 1052, "error": error.toString() };
        }

    } else {
        return { 'success': false, "cod_mensaje": 1053, 'mensaje': 'Debe enviar el parámetro' };
    }
}