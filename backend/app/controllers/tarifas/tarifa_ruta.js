const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_ruta = async (campos) => {
    const estructuraConsulta =  azureSqlClient({TR:"TARIFA_RUTA"})
    .leftJoin({ P: "PAIS" }, function () {
        this.on( 'P.PAIS_ID', '=', 'TR.PAIS_ID');
    }) 
    .leftJoin({ C: "CONTINENTE" }, function () {
        this.on( 'TR.CONTINENTE_ID', '=', 'C.CONTINENTE_ID');
    }) 
    .leftJoin({ PE: "PUNTO_ENLACE" }, function () {
        this.on( 'PE.PUNTOENLACE_ID', '=', 'TR.PUNTOENLACE_ID');
    }) 
    .leftJoin({CI:"CIUDAD"}, function () {
        this.on( 'CI.CIUDAD_ID', '=', 'TR.CIUDAD_ID');
    }) 
    .leftJoin({ TI: "TIPO" }, function () {
        this.on( 'TI.TIPO_ID', '=', 'TR.TIPO_RUTA_ID');
    })
    .leftJoin({ TI2: "TIPO" }, function () {
        this.on( 'TI2.TIPO_ID', '=', 'PE.TIPO_ID');
    })

    if(('cod_tarifa_ruta' in campos)){
        estructuraConsulta.where('TR.TARIFARUTA_ID',`${campos.cod_tarifa_ruta}`)
    }
    if(('cod_metodo' in campos)){
        estructuraConsulta.where('TR.METODO_ID',`${campos.cod_metodo}`)
    }
    if(('cod_pais' in campos)){
        estructuraConsulta.where('TR.PAIS_ID',`${campos.cod_pais}`)
    }
    if(('cod_continente' in campos)){
        estructuraConsulta.where('C.CONTINENTE_ID',`${campos.cod_continente}`)
    }
    if(('cod_ciudad' in campos)){
        estructuraConsulta.where('CI.CIUDAD_ID',`${campos.cod_ciudad}`)
    }
    if(('cod_puntoenlace' in campos)){
        estructuraConsulta.where('TR.PUNTOENLACE_ID',`${campos.cod_puntoenlace}`)
    }
    if(('cod_tipo_ruta' in campos)){
        estructuraConsulta.where('TR.TIPO_RUTA_ID',`${campos.cod_tipo_ruta}`)
    }
    if(('ruta_aplica' in campos)){
        estructuraConsulta.where('TR.TARIFARUTA_APLICA',`${campos.ruta_aplica}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('TR.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'TR.TARIFARUTA_ID AS COD_TARIFA_RUTA', 
        'TR.METODO_ID AS COD_METODO', 

        'TR.PAIS_ID AS COD_PAIS', 
        "P.PAIS_NOMBRE AS NOMBRE_PAIS",
        "P.PAIS_CODIGO AS REF_PAIS",

        'C.CONTINENTE_ID AS COD_CONTINENTE',
        'C.CONTINENTE_NOMBRE AS NOMBRE_CONTINENTE',

        'TR.PUNTOENLACE_ID AS COD_PUNTOENLACE', 
        'PE.PUNTOENLACE_NOMBRE AS NOMBRE', 
        'PE.TIPO_ID AS COD_TIPO_PUNTOENLACE', 
        'TI2.TIPO_DESCRIPCION AS TIPO_PUNTOENLACE_DESC',

        "CI.CIUDAD_ID AS COD_CIUDAD",
        "CI.CIUDAD_NOMBRE AS NOMBRE_CIUDAD",
        "CI.CIUDAD_SIGLAS AS SIGLAS_CIUDAD", 
        
        'TR.TIPO_RUTA_ID AS COD_TIPO_RUTA', 
        'TI.TIPO_DESCRIPCION AS TIPO_DESC',

        'TR.ESTADO_ID AS COD_ESTADO', 
    )
    return data;
}

module.exports.insertar_ruta = async (campos) => {
    if(('cod_metodo' in campos) && ('cod_tipo_ruta' in campos)){

        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_RUTA'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("TARIFA_RUTA")
                .insert({
                    TARIFARUTA_ID       : idnuevo, 
                    METODO_ID           : campos.cod_metodo, 
                    CONTINENTE_ID       : campos.cod_continente, 
                    PAIS_ID             : campos.cod_pais, 
                    PUNTOENLACE_ID      : campos.cod_puntoenlace, 
                    TIPO_RUTA_ID        : campos.cod_tipo_ruta, 
                    CIUDAD_ID           : campos.cod_ciudad,
                    ESTADO_ID           : campos.cod_estado || 1, 
                }).then(async () => {
                    insertar_tarifa_bitacora({
                        metodo_id: campos.cod_metodo, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'C', 
                        data: { cod_tarifa_ruta: idnuevo, ...campos }, 
                        tabla: "TARIFA_RUTA"
                    })
                    console.log('Nuevo ruta creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Ruta creada correctamente' ,
                            'cod_tarifa_ruta' : idnuevo.toString()};
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

module.exports.actualizar_ruta = async (campos) => {
    if(('cod_tarifa_ruta' in campos) && ('cod_metodo' in campos) && ('cod_tipo_ruta' in campos) 
        && ('cod_estado' in campos)
    ){
        try {
            let dataActualiza = await azureSqlClient("TARIFA_RUTA")
            .where('TARIFARUTA_ID', `${campos.cod_tarifa_ruta}`)
            .update({
                TARIFARUTA_ID       : campos.cod_tarifa_ruta, 
                METODO_ID           : campos.cod_metodo, 
                CONTINENTE_ID       : campos.cod_continente, 
                PAIS_ID             : campos.cod_pais, 
                PUNTOENLACE_ID      : campos.cod_puntoenlace, 
                TIPO_RUTA_ID        : campos.cod_tipo_ruta, 
                CIUDAD_ID           : campos.cod_ciudad,
                ESTADO_ID           : campos.cod_estado, 
            }).then(() => {
                insertar_tarifa_bitacora({ 
                    metodo_id: campos.cod_metodo, 
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U  ', 
                    data: campos, 
                    tabla: "TARIFA_RUTA"
                })
                console.log('Ruta actualizada', campos.cod_tarifa_ruta);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Ruta actualizado correctamente',
                    'cod_tarifa_ruta' : campos.cod_tarifa_ruta};
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

module.exports.eliminar_ruta = async (campos) => {
    if(('cod_tarifa_ruta' in campos)){
        try {
            var getRuta = await azureSqlClient({TR:"TARIFA_RUTA"})
                .where("TR.TARIFARUTA_ID", `${campos.cod_tarifa_ruta}`)
                .first();
            if(getRuta){
                let eliminar = await azureSqlClient('TARIFA_RUTA')
                .where('TARIFARUTA_ID', `${campos.cod_tarifa_ruta}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        metodo_id: getRuta.METODO_ID, 
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: campos.cod_estado || 1, 
                        accion: 'D', 
                        data: getRuta, 
                        tabla: "TARIFA_RUTA"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Ruta no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}