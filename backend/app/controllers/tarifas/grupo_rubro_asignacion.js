const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")

module.exports.getlista_grupo_rubro_asignacion = async (campos) => {
    const estructuraConsulta =  azureSqlClient({GRA:"GRUPO_RUBRO_ASIGNACION"})
    .leftJoin({R:"RUBRO"}, function () {
        this.on( 'R.RUBRO_ID', '=', 'GRA.RUBRO_ID');
    }) 
    .leftJoin({GR:"GRUPO_RUBRO"}, function () {
        this.on( 'GR.GRUPORUBRO_ID', '=', 'GRA.GRUPORUBRO_ID');
    }) 

    if(('cod_asignacion_grupo_rubro' in campos)){
        estructuraConsulta.where('GRA.GRUPORUBROASIGNACION_ID',`${campos.cod_asignacion_grupo_rubro}`)
    }
    if(('cod_rubro' in campos)){
        estructuraConsulta.where('GRA.RUBRO_ID',`${campos.cod_rubro}`)
    }
    if(('cod_grupo_rubro' in campos)){
        estructuraConsulta.where('GRA.GRUPORUBRO_ID',`${campos.cod_grupo_rubro}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('GRA.ESTADO_ID',`${campos.cod_estado}`)
    }
    if(('cod_empresa' in campos)){
        estructuraConsulta.where('GR.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('GR.CENCO_ID',`${campos.cod_cc}`)
    }
    if(('cod_tipo_transporte' in campos)){
        estructuraConsulta.where('GR.TIPO_TRANSPORTE_ID',`${campos.cod_tipo_transporte}`)
    }
    if(('cod_tipo_servicio' in campos)){
        estructuraConsulta.where('GR.TIPO_SERVICIO_ID',`${campos.cod_tipo_servicio}`)
    }

    const data = await estructuraConsulta.select(
        'GRA.GRUPORUBROASIGNACION_ID',
        'GR.GRUPORUBRO_ID AS COD_GRUPO_RUBRO', 
        'GR.GRUPORUBRO_NOMBRE AS GRUPO_NOMBRE', 
        'R.RUBRO_ID AS COD_RUBRO', 
        'R.RUBRO_NOMBRE AS RUBRO_NOMBRE', 
        'GRA.ESTADO_ID AS COD_ESTADO'
    )
    return data;
}

module.exports.insertar_grupo_rubro_asignacion = async (campos) => {
    if(('cod_rubro' in campos) && ('cod_grupo_rubro' in campos)){

        const busqueda = await azureSqlClient({GRA:"GRUPO_RUBRO_ASIGNACION"})
        .where('GRA.RUBRO_ID',`${campos.cod_rubro}`)
        .where('GRA.ESTADO_ID', 1)
        .first()

        if(!busqueda){
            let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'GRUPO_RUBRO_ASIGNACION'});
            if(idnuevo>0){
                try {
                    let resinsert = await azureSqlClient("GRUPO_RUBRO_ASIGNACION")
                    .insert({
                        GRUPORUBROASIGNACION_ID : idnuevo, 
                        RUBRO_ID                : campos.cod_rubro, 
                        GRUPORUBRO_ID           : campos.cod_grupo_rubro, 
                        ESTADO_ID               : campos.cod_estado || 1, 
                    }).then(async () => {
                        console.log('Nuevo asignacion a grupo rubro realizada:' , idnuevo);
                        return {'success' : true,
                                "cod_mensaje" : 1041,
                                'mensaje' : 'Rubro asignado a grupo correctamente' ,
                                'cod_asignacion_grupo_rubro' : idnuevo.toString()};
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
            return {"success" : false, "cod_mensaje" : 1042, 'mensaje' : `El rubro ya pertenece al grupo: ${busqueda?.GRUPORUBRO_ID}`};
        }


        
 
    }else{
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.traslado_asignacion_grupos_rubro = async (campos) => {
    if(('cod_grupo_rubro' in campos) && ('asignaciones' in campos && 'anuladas' in campos)){

        let successes = 0
        let errors = 0

        let dataGrupo = await azureSqlClient("GRUPO_RUBRO")
        .where('GRUPORUBRO_ID', `${campos.cod_grupo_rubro}`)
        .first()

        if(dataGrupo){
            if(Array.isArray(campos.anuladas)){
                for await(let rubro of campos.anuladas){
                    try {
                        let dataActualiza = await azureSqlClient("GRUPO_RUBRO_ASIGNACION")
                        .where('GRUPORUBRO_ID', `${campos.cod_grupo_rubro}`)
                        .where('RUBRO_ID',`${rubro}`)
                        .update({
                            ESTADO_ID: 2
                        }).then(() => {
                            console.log('Asignacion anulada', rubro);
                            
                        }).catch((e) => {
                            console_log(e.toString());
                        });
                    } catch (error) { 
                        console_log(error.toString());             
                    }
                }  
            } 
            if(Array.isArray(campos.asignaciones)){
                for await(let rubro of campos.asignaciones){
                    const busqueda = await azureSqlClient({GRA:"GRUPO_RUBRO_ASIGNACION"})
                    .leftJoin({GR:"GRUPO_RUBRO"}, function () {
                        this.on( 'GR.GRUPORUBRO_ID', '=', 'GRA.GRUPORUBRO_ID');
                    }) 
                    .where('GR.TARIFAPLANTILLA_ID',`${dataGrupo.TARIFAPLANTILLA_ID}`)
                    .where('GRA.RUBRO_ID',`${rubro}`)
                    .where('GRA.ESTADO_ID', 1)
                    .first()
    
                    if(!busqueda){
                        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'GRUPO_RUBRO_ASIGNACION'});
                        if(idnuevo>0){
                            try {
                                let resinsert = await azureSqlClient("GRUPO_RUBRO_ASIGNACION")
                                .insert({
                                    GRUPORUBROASIGNACION_ID : idnuevo, 
                                    RUBRO_ID                : rubro, 
                                    GRUPORUBRO_ID           : campos.cod_grupo_rubro, 
                                    ESTADO_ID               : campos.cod_estado || 1, 
                                }).then(async () => {
                                    console.log('Nuevo asignacion a grupo rubro realizada:' , idnuevo);
                                    successes += 1
                                }).catch((e) => {
                                    console_log(e.toString());
                                    errors += 1
                                }
                                );
                            } catch (error) {
                                console_log(error.toString());
                                errors += 1
                            }
                        }else{
                            errors += 1
                        }
                    } else {
                        errors += 1
                    }
                }
            }
            return {'success' : true,
                "cod_mensaje" : 1041,
                'mensaje' : `${successes} rubros asignados, ${errors} con error`
            }

        } else {
            return {'success' : false,"cod_mensaje" : 1042, 'mensaje' : 'El grupo seleccionado no existe o esta inactivo'};
        }
    }else{
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.actualizar_grupo_rubro_asignacion = async (campos) => {
    if(('cod_asignacion_grupo_rubro' in campos) &&  ('cod_rubro' in campos) && ('cod_grupo_rubro' in campos)){

        const busqueda =  await azureSqlClient({GRA:"GRUPO_RUBRO_ASIGNACION"})
        .where('GRA.RUBRO_ID',`${campos.cod_rubro}`)
        .whereNot('GRA.GRUPORUBROASIGNACION_ID', `${campos.cod_asignacion_grupo_rubro}`)
        .where('GRA.ESTADO_ID', 1)
        .first()

        if(!busqueda){
            try {
                let dataActualiza = await azureSqlClient("GRUPO_RUBRO_ASIGNACION")
                .where('GRUPORUBROASIGNACION_ID', `${campos.cod_asignacion_grupo_rubro}`)
                .update({
                    GRUPORUBROASIGNACION_ID : campos.cod_asignacion_grupo_rubro, 
                    RUBRO_ID                : campos.cod_rubro, 
                    GRUPORUBRO_ID           : campos.cod_grupo_rubro, 
                    ESTADO_ID               : campos.cod_estado
                }).then(() => {
                    console.log('Asignacion realizada correctamente', campos.cod_asignacion_grupo_rubro);
                    return {'success' : true,
                        "cod_mensaje" : 1031,
                        'mensaje' : 'Asignacion realizada correctamente' ,
                        'cod_asignacion_grupo_rubro' : campos.cod_asignacion_grupo_rubro};
                }).catch((e) => {
                    console_log(e.toString());
                    return {"success" : false, "cod_mensaje" : 1042,"error" : e.toString()};
                }
                );
                return dataActualiza;
            } catch (error) {
                return {"success" : false, "cod_mensaje" : 1044,"error" : error.toString()};                
            }
        } else {
            return {"success" : false, "cod_mensaje" : 1032,'mensaje' : `El rubro ya pertenece al grupo: ${busqueda?.GRUPORUBRO_ID}`};     
        }
    }else{
        return {'success' : false, "cod_mensaje" : 1043,'mensaje' : 'faltan parametros requeridos, verifique'};
        
    }
}

module.exports.eliminar_grupo_rubro_asignacion = async (campos) => {
    if(('cod_asignacion_grupo_rubro' in campos)){
        try {
            var getGrupo = await azureSqlClient({GR:"GRUPO_RUBRO_ASIGNACION"})
                .where("GR.GRUPORUBROASIGNACION_ID", `${campos.cod_asignacion_grupo_rubro}`)
                .first();
            if(getGrupo){
                let eliminar = await azureSqlClient('GRUPO_RUBRO_ASIGNACION')
                .where('GRUPORUBROASIGNACION_ID', `${campos.cod_asignacion_grupo_rubro}`)
                .del()
                .then(async result => {
                    console.log(result);
                    return {'success' : true,"cod_mensaje" : 1051, 'mensaje' :'Eliminado correctamente'};
                }).catch((e) => {
                    console_log(e.toString());                    
                    return {"success" : false, "cod_mensaje" : 1052, "error" : e.toString()};
                }
                );

                return eliminar;
            }else{
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Asignacion no fue localizada'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}