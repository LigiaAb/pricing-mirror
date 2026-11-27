const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")
const { insertar_tarifa_bitacora } = require("./tarifa_bitacora")

module.exports.getlista_rubros = async (campos) => {
    const estructuraConsulta =  azureSqlClient({R:"RUBRO"})
    if(('cod_rubro' in campos)){
        estructuraConsulta.where('R.RUBRO_ID',`${campos.cod_rubro}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('R.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'R.RUBRO_ID AS COD_RUBRO', 
        'R.RUBRO_NOMBRE AS NOMBRE', 
        'R.ESTADO_ID AS COD_ESTADO',
        'R.RUBRO_FECHA_INICIO AS FECHA_INICIO', 
        'R.RUBRO_FECHA_FINAL AS FECHA_FINAL',
        'R.ES_FLETE'
    )
    return data;
}

module.exports.insertar_rubros = async (campos) => {
    if(('nombre' in campos) && ('cod_estado' in campos)){

        let check_rubros = await azureSqlClient({R : "RUBRO"})
            .where('R.RUBRO_NOMBRE',`${campos.nombre}`)
            .where('R.ESTADO_ID', 1)
            .first()

        if(!check_rubros){
            let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'RUBRO'});
            if(idnuevo>0){
                try {
                    let resinsert = await azureSqlClient("RUBRO")
                    .insert({
                        RUBRO_ID            : idnuevo,
                        RUBRO_NOMBRE        : campos.nombre,
                        RUBRO_FECHA_INICIO  : campos.fecha_inicio || await cropa_fecha_hora_actual(),
                        RUBRO_FECHA_FINAL   : campos.fecha_final,
                        ESTADO_ID           : campos.cod_estado || 1,
                        ES_FLETE            : campos.es_flete
                    }).then(async () => {
                        insertar_tarifa_bitacora({
                            rubro_id: idnuevo,
                            usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                            estado_id: campos.cod_estado || 1, 
                            accion: 'C', 
                            data: campos, 
                            tabla: "RUBRO"
                        })
                        console.log('Nuevo rubro creado ID:' , idnuevo);
                        return {'success' : true,
                                "cod_mensaje" : 1041,
                                'mensaje' : 'Rubro creado correctamente' ,
                                'cod_rubro' : idnuevo.toString()};
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
        } else {
            return {'success' : false, "cod_mensaje" : 1043,'mensaje' : 'Ya existe un rubro con esos datos en el mismo periodo'};
        }
    }else{
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.actualizar_rubro = async (campos) => {
    if(('nombre' in campos) && ('cod_rubro' in campos) && ('cod_estado' in campos) & ('fecha_inicio' in campos)){
        try {
            let dataActualiza = await azureSqlClient("RUBRO")
            .where('RUBRO_ID', `${campos.cod_rubro}`)
            .update({
                RUBRO_ID            : campos.cod_rubro,
                RUBRO_NOMBRE        : campos.nombre,
                RUBRO_FECHA_INICIO  : campos.fecha_inicio,
                RUBRO_FECHA_FINAL   : campos.fecha_final,
                ESTADO_ID           : campos.cod_estado,
                ES_FLETE            : campos.es_flete
            }).then(() => {
                insertar_tarifa_bitacora({
                    rubro_id: campos.cod_rubro,
                    usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                    estado_id: campos.cod_estado || 1, 
                    accion: 'U', 
                    data: campos, 
                    tabla: "RUBRO"
                })
                console.log('Rubro actualizado', campos.cod_rubro);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Rubro actualizado correctamente',
                    'cod_rubro' : campos.cod_rubro};
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

module.exports.eliminar_rubro = async (campos) => {
    if(('cod_rubro' in campos)){
        try {
            var getRubro = await azureSqlClient({R:"RUBRO"})
                .where("R.RUBRO_ID", `${campos.cod_rubro}`)
                .first();
            if(getRubro){
                let eliminar = await azureSqlClient('RUBRO')
                .where('RUBRO_ID', `${campos.cod_rubro}`)
                .del()
                .then(async result => {
                    insertar_tarifa_bitacora({
                        rubro_id: campos.cod_rubro,
                        usuario_id: global.usuario?.USUARIO_ID || "ERP", 
                        estado_id: 4, 
                        accion: 'D', 
                        data: getRubro, 
                        tabla: "RUBRO"
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Rubr no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}

module.exports.recupera_informacion_rubro = async (campos) => {

    if(('cod_rubro' in campos)){

        //Recupera la cabecera de la entidad
        const estructuraConsulta =  azureSqlClient({R:"RUBRO"})
        .leftJoin({ ES: "ESTADO" }, function () {
            this.on( 'ES.ESTADO_ID', '=', 'R.ESTADO_ID');
        })
        .where('R.RUBRO_ID',`${campos.cod_rubro}`)
    
        const data_rubro = await estructuraConsulta.select(
            'R.RUBRO_ID AS COD_RUBRO', 
            'R.RUBRO_NOMBRE AS NOMBRE', 
            "ES.ESTADO_ID AS COD_ESTADO",
            "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
            'R.RUBRO_FECHA_INICIO AS FECHA_INICIO', 
            'R.RUBRO_FECHA_FINAL AS FECHA_FINAL',
            'R.ES_FLETE'
        );

        // Recupera nombres para la entidad
        const estructuraConsultaNombres =  azureSqlClient({RUN:"RUBRO_NOMBRE"})
            .leftJoin({ ES: "ESTADO" }, function () {
                this.on( 'ES.ESTADO_ID', '=', 'RUN.ESTADO_ID');
            })
            .where('RUN.RUBRO_ID',`${campos.cod_rubro}`)

        const data_nombres = await estructuraConsultaNombres.select(
            "RUN.RUBRONOMBRE_ID AS COD_RUBRONOMBRE",
            "RUN.RUBRONOMBRE_NOMBRE AS NOMBRE",
            "RUN.RUBRO_ID AS COD_RUBRO",
            "RUN.ESTADO_ID AS COD_ESTADO",
            "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
        );
            
        // Data para identificaciones
        const estructuraConsultaIdentificaciones =  azureSqlClient({RUI:"RUBRO_IDENTIFICACION"})
            .leftJoin({ ES: "ESTADO" }, function () {
                this.on( 'ES.ESTADO_ID', '=', 'RUI.ESTADO_ID');
            })
            .leftJoin({ TI: "TIPO" }, function () {
                this.on( 'TI.TIPO_ID', '=', 'RUI.TIPO_ID');
            })
            .where('RUI.RUBRO_ID',`${campos.cod_rubro}`)

        const data_identificaciones = await estructuraConsultaIdentificaciones.select(
            "RUI.RUBROIDENTIFICACION_ID AS COD_RUBROIDENTIFICACION",
            "RUI.RUBROIDENTIFICACION_CODIGO AS CODIGO",
            "RUI.RUBRO_ID AS COD_RUBRO",
            "TI.TIPO_ID AS COD_TIPO",
            "TI.TIPO_DESCRIPCION",
            "RUI.ESTADO_ID AS COD_ESTADO",
            "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
        );


        // Data para rubro x cc
        const estructuraConsultaCenco =  azureSqlClient({RCC:"RUBRO_CENTRO_COSTO"})
            .leftJoin({ ES: "ESTADO" }, function () {
                this.on( 'ES.ESTADO_ID', '=', 'RCC.ESTADO_ID');
            })
            .where('RCC.RUBRO_ID',`${campos.cod_rubro}`)

        const data_cencos = await estructuraConsultaCenco.select(
            "RCC.RUBROCENCO_ID AS COD_RUBRO_CENCO",
            "RCC.RUBRO_ID AS COD_RUBRO",
            "RCC.EMPRESA_ID AS COD_EMPRESA",
            "RCC.CENCO_ID AS COD_CC",
            "RCC.ESTADO_ID AS COD_ESTADO",
            "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
        );


        // respuesta de peticiones
        return {
            "success" : true,
            "cod_mensaje" : 1049,
            "data": {
                ...data_rubro[0],
                "NOMBRES": data_nombres,
                "IDENTIFICACIONES": data_identificaciones,
                "CENTROS_COSTO": data_cencos
            }
        };



    }else{
        return {'success' : false,"cod_mensaje" : 1048, 'mensaje' : 'Debe enviar los atributos requeridos'};
    }
    

}
