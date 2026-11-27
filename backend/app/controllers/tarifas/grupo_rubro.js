const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal")

module.exports.getlista_grupos_rubro = async (campos) => {
    const estructuraConsulta =  azureSqlClient({GR:"GRUPO_RUBRO"})
    if(('cod_tarifaplantilla' in campos)){
        estructuraConsulta.where('GR.TARIFAPLANTILLA_ID',`${campos.cod_tarifaplantilla}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('GR.ESTADO_ID',`${campos.cod_estado}`)
    }
    const data = await estructuraConsulta.select(
        'GR.GRUPORUBRO_ID AS COD_GRUPO_RUBRO', 
        'GR.GRUPORUBRO_NOMBRE AS NOMBRE', 
        'GR.ESTADO_ID AS COD_ESTADO', 
        'GR.TARIFAPLANTILLA_ID AS COD_TARIFAPLANTILLA',
    )
    return data;
}

module.exports.insertar_grupos_rubro = async (campos) => {
    if(('nombre' in campos) && ('cod_tarifaplantilla' in campos)){
        let idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'GRUPO_RUBRO'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("GRUPO_RUBRO")
                .insert({
                    GRUPORUBRO_ID       : idnuevo, 
                    GRUPORUBRO_NOMBRE   : campos.nombre, 
                    TARIFAPLANTILLA_ID  : campos.cod_tarifaplantilla, 
                    ESTADO_ID           : campos.cod_estado || 1, 
                }).then(async () => {
                    console.log('Nuevo grupo rubro creado ID:' , idnuevo);
                    return {'success' : true,
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Grupo rubro creado correctamente' ,
                            'cod_grupo_rubro' : idnuevo.toString()};
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

module.exports.actualizar_grupos_rubro = async (campos) => {
    if(('cod_grupo_rubro' in campos) &&  ('nombre' in campos) && ('cod_tarifaplantilla' in campos)){
        try {
            let dataActualiza = await azureSqlClient("GRUPO_RUBRO")
            .where('GRUPORUBRO_ID', `${campos.cod_grupo_rubro}`)
            .update({
                GRUPORUBRO_ID       : campos.cod_grupo_rubro, 
                GRUPORUBRO_NOMBRE   : campos.nombre, 
                TARIFAPLANTILLA_ID  : campos.cod_tarifaplantilla, 
                ESTADO_ID           : campos.cod_estado, 
            }).then(() => {
                console.log('Grupo rubro actualizado', campos.cod_grupo_rubro);
                return {'success' : true,
                    "cod_mensaje" : 1031,
                    'mensaje' : 'Grupo rubro actualizado correctamente',
                    'cod_grupo_rubro' : campos.cod_grupo_rubro};
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

module.exports.eliminar_grupos_rubro = async (campos) => {
    if(('cod_grupo_rubro' in campos)){
        try {
            var getGrupo = await azureSqlClient({GR:"GRUPO_RUBRO"})
                .where("GR.GRUPORUBRO_ID", `${campos.cod_grupo_rubro}`)
                .first();
            if(getGrupo){
                let eliminar = await azureSqlClient('GRUPO_RUBRO')
                .where('GRUPORUBRO_ID', `${campos.cod_grupo_rubro}`)
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
                return {'success': false, "cod_mensaje" : 1054,'mensaje' : 'Grupo no fue localizado'};
            }  
        } catch (error) {
            return {"success" : false, "cod_mensaje" : 1052, "error" : error.toString()};
        }
              
            
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar el parametro'};
        
    }
}

module.exports.recupera_datos_grupos_rubro = async (campos) => {
    const estructuraConsulta =  azureSqlClient({GR:"GRUPO_RUBRO"})
    if(('cod_tarifaplantilla' in campos)){
        estructuraConsulta.where('GR.TARIFAPLANTILLA_ID',`${campos.cod_tarifaplantilla}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('GR.ESTADO_ID',`${campos.cod_estado}`)
    }
    let data = await estructuraConsulta.select(
        'GR.GRUPORUBRO_ID AS COD_GRUPO_RUBRO', 
        'GR.GRUPORUBRO_NOMBRE AS NOMBRE', 
        'GR.ESTADO_ID AS COD_ESTADO', 
        'GR.TARIFAPLANTILLA_ID AS COD_TARIFAPLANTILLA',
    )

    for await(let grupo of data){
        const rubros = await azureSqlClient({GRA:"GRUPO_RUBRO_ASIGNACION"})
        .leftJoin({R:"RUBRO"}, function () {
            this.on( 'R.RUBRO_ID', '=', 'GRA.RUBRO_ID');
        }) 
        .leftJoin({GR:"GRUPO_RUBRO"}, function () {
            this.on( 'GR.GRUPORUBRO_ID', '=', 'GRA.GRUPORUBRO_ID');
        }) 
        .where('GRA.GRUPORUBRO_ID',`${grupo.COD_GRUPO_RUBRO}`)
        .where('GRA.ESTADO_ID', 1)
        .select(
            'GRA.GRUPORUBROASIGNACION_ID',
            'GR.GRUPORUBRO_ID AS COD_GRUPO_RUBRO', 
            'GR.GRUPORUBRO_NOMBRE AS GRUPO_NOMBRE', 
            'R.RUBRO_ID AS COD_RUBRO', 
            'R.RUBRO_NOMBRE AS RUBRO_NOMBRE', 
            'GRA.ESTADO_ID AS COD_ESTADO'
        )
        grupo["RUBROS"] = rubros || []
    }

    return data;
}