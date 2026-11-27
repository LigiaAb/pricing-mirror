const { insert_entidad_identificacion, insertar_entidad_identificacion } = require("../admon/entidad/entidad_identificacion");
const { inserta_entidad, inserta_entidad_transaction } = require("../admon/entidad/entidades");
const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal");
const { api_validar_token_larabel } = require("../servicios_externos/rutas_externas");
const { insertar_actividad_bitacora } = require("./actividades_bitacora");
const  axios = require("axios");

module.exports.getdatos_actividad = async (campos) => {
    const estructuraConsulta =  azureSqlClient({"AC": "ACTIVIDAD"})  
    .leftJoin({ CL: "ENTIDAD" }, function () {
        this.on( 'CL.ENTIDAD_ID', '=', 'AC.ENTIDAD_ID');
    }) 
    .leftJoin({ ES: "ESTADO" }, function () {
        this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
    })
    .leftJoin({ TI: "TIPO" }, function () {
        this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
    })
    .leftJoin({ TO: "TIPO" }, function () {
        this.on( 'TO.TIPO_ID', '=', 'AC.OBJETIVO_TIPO_ID');
    })
    .leftJoin({ EI: "ENTIDAD_IDENTIFICACION" }, function () {
        this.on( 'EI.ENTIDAD_ID', '=', 'AC.ENTIDAD_ID');
        this.on( 'EI.IDENTIFICACION_ID', '=', 12)
        this.on( 'EI.ESTADO_ID', '=', 1)
    })

    if(('cod_actividad' in campos)){
        estructuraConsulta.where('AC.ACTIVIDAD_ID',`${campos.cod_actividad}`)
    }
    if(('cod_tipo' in campos)){
        estructuraConsulta.where('AC.TIPO_ID',`${campos.cod_tipo}`)
    }
    if(('cod_empresa' in campos)){
        estructuraConsulta.where('AC.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('AC.CENCOS_ID',`${campos.cod_cc}`)
    }
    if(('cod_asesor' in campos)){
        estructuraConsulta.where('AC.USUARIO_ID',`${campos.cod_asesor}`)
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('AC.ESTADO_ID',`${campos.cod_estado}`)
    }
    if(('fecha_programada' in campos)){
        const date = new Date(campos.fecha_programada);
        const formattedDate = date.toISOString().split('T')[0];
        estructuraConsulta.whereRaw('CAST(AC.ACTIVIDAD_FECHA_PROGRAMACION AS DATE) = ?', [formattedDate])
    }
    if(('cod_documento' in campos)){
        estructuraConsulta.whereLike('AC.ACTIVIDAD_COD_DOCUMENTO',`%${campos.cod_documento}%`)
    }
    if(('lista_cod_actividades' in campos)){
        estructuraConsulta.whereIn('AC.ACTIVIDAD_ID', campos.lista_cod_actividades)
    }

    estructuraConsulta.whereNot('AC.TIPO_ID', 37)

    const data = await estructuraConsulta.select(
        "AC.ACTIVIDAD_ID AS COD_ACTIVIDAD",
        "AC.ACTIVIDAD_FECHA AS FECHA_CREADA",
        "AC.ACTIVIDAD_ASUNTO AS ASUNTO", 
        "AC.ACTIVIDAD_DESCRIPCION AS DESCRIPCION",
        "AC.TIPO_ID AS COD_TIPO",
        "TI.TIPO_DESCRIPCION AS NOM_TIPO",
        "AC.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMADA",
        "AC.ENTIDAD_ID AS COD_CLIENTE",
        "EI.ENTIDADIDENTIFICACIO_NUMERO AS COD_CROPA",
        "CL.ENTIDAD_NOMBRE AS NOMBRE_CLIENTE",
        "AC.EMPRESA_ID AS COD_EMP",
        "AC.CENCOS_ID AS COD_CC",
        "AC.ESTADO_ID AS COD_ESTADO",
        "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
        "AC.USUARIO_ID AS COD_ASESOR",
        "AC.USUARIO_CREADOR_ID AS COD_CREADOR",
        "AC.CAMPANA_ID AS COD_CAMPANA",
        "AC.ACTIVIDAD_COD_DOCUMENTO AS COD_DOCUMENTO",
        "AC.OBJETIVO_TIPO_ID AS COD_OBJETIVO_ACTIVIDAD",
        "TO.TIPO_DESCRIPCION AS OBJETIVO_ACTIVIDAD_DESC",
    );
    return data;
}

module.exports.getdatos_actividades_vencidas = async (campos) => {
    const estructuraConsulta =  azureSqlClient({"AC": "ACTIVIDAD"})   
    .leftJoin({ CL: "ENTIDAD" }, function () {
        this.on( 'CL.ENTIDAD_ID', '=', 'AC.ENTIDAD_ID');
    }) 
    .leftJoin({ ES: "ESTADO" }, function () {
        this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
    })
    .leftJoin({ TI: "TIPO" }, function () {
        this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
    })
    .leftJoin({ TO: "TIPO" }, function () {
        this.on( 'TO.TIPO_ID', '=', 'AC.OBJETIVO_TIPO_ID');
    })

    if(('cod_empresa' in campos)){
        estructuraConsulta.where('AC.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('AC.CENCOS_ID',`${campos.cod_cc}`)
    }
    if(('cod_asesor' in campos)){
        estructuraConsulta.where('AC.USUARIO_ID',`${campos.cod_asesor}`)
    }
    
    const endOfDay = new Date();
    endOfDay.setDate(endOfDay.getDate() - 1);

    estructuraConsulta.whereIn('AC.ESTADO_ID', [23, 25, 35, 36])
    estructuraConsulta.where('AC.ACTIVIDAD_FECHA_PROGRAMACION', '<', endOfDay)

    const data = await estructuraConsulta.select(
        "AC.ACTIVIDAD_ID AS COD_ACTIVIDAD",
        "AC.ACTIVIDAD_FECHA AS FECHA_CREADA",
        "AC.ACTIVIDAD_ASUNTO AS ASUNTO", 
        "AC.ACTIVIDAD_DESCRIPCION AS DESCRIPCION",
        "AC.TIPO_ID AS COD_TIPO",
        "CL.ENTIDAD_NOMBRE AS NOMBRE_CLIENTE",
        "TI.TIPO_DESCRIPCION AS NOM_TIPO",
        "AC.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMADA",
        "AC.ENTIDAD_ID AS COD_CLIENTE",
        "AC.EMPRESA_ID AS COD_EMP",
        "AC.CENCOS_ID AS COD_CC",
        "AC.ESTADO_ID AS COD_ESTADO",
        "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
        "AC.USUARIO_ID AS COD_ASESOR",
        "AC.CAMPANA_ID AS COD_CAMPANA",
        "AC.ACTIVIDAD_COD_DOCUMENTO AS COD_DOCUMENTO",
        "AC.OBJETIVO_TIPO_ID AS COD_OBJETIVO_ACTIVIDAD",
        "TO.TIPO_DESCRIPCION AS OBJETIVO_ACTIVIDAD_DESC",
        "AC.USUARIO_CREADOR_ID AS COD_CREADOR",
    );
    return data;
}

module.exports.getdatos_actividades_en_curso = async (campos) => {
    const estructuraConsulta =  azureSqlClient({"AC": "ACTIVIDAD"})   
    .leftJoin({ CL: "ENTIDAD" }, function () {
        this.on( 'CL.ENTIDAD_ID', '=', 'AC.ENTIDAD_ID');
    }) 
    .leftJoin({ ES: "ESTADO" }, function () {
        this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
    })
    .leftJoin({ TI: "TIPO" }, function () {
        this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
    })
    .leftJoin({ TO: "TIPO" }, function () {
        this.on( 'TO.TIPO_ID', '=', 'AC.OBJETIVO_TIPO_ID');
    })

    if(('cod_empresa' in campos)){
        estructuraConsulta.where('AC.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('AC.CENCOS_ID',`${campos.cod_cc}`)
    }
    if(('cod_asesor' in campos)){
        estructuraConsulta.where('AC.USUARIO_ID',`${campos.cod_asesor}`)
    }

    estructuraConsulta.whereIn('AC.ESTADO_ID', [23, 25, 36])

    const endOfDay = new Date();
    endOfDay.setDate(endOfDay.getDate()-1);
    estructuraConsulta.where('AC.ACTIVIDAD_FECHA_PROGRAMACION', '>', endOfDay)

    const data = await estructuraConsulta.select(
        "AC.ACTIVIDAD_ID AS COD_ACTIVIDAD",
        "AC.ACTIVIDAD_FECHA AS FECHA_CREADA",
        "AC.ACTIVIDAD_ASUNTO AS ASUNTO", 
        "AC.ACTIVIDAD_DESCRIPCION AS DESCRIPCION",
        "CL.ENTIDAD_NOMBRE AS NOMBRE_CLIENTE",
        "AC.TIPO_ID AS COD_TIPO",
        "TI.TIPO_DESCRIPCION AS NOM_TIPO",
        "AC.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMADA",
        "AC.ENTIDAD_ID AS COD_CLIENTE",
        "AC.EMPRESA_ID AS COD_EMP",
        "AC.CENCOS_ID AS COD_CC",
        "AC.ESTADO_ID AS COD_ESTADO",
        "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
        "AC.USUARIO_ID AS COD_ASESOR",
        "AC.CAMPANA_ID AS COD_CAMPANA",
        "AC.ACTIVIDAD_COD_DOCUMENTO AS COD_DOCUMENTO",
        "AC.OBJETIVO_TIPO_ID AS COD_OBJETIVO_ACTIVIDAD",
        "TO.TIPO_DESCRIPCION AS OBJETIVO_ACTIVIDAD_DESC",
        "AC.USUARIO_CREADOR_ID AS COD_CREADOR",
    );
    return data;
}

module.exports.getdatos_actividades_finalizadas = async (campos) => {
    const estructuraConsulta =  azureSqlClient({"AC": "ACTIVIDAD"})   
    .leftJoin({ CL: "ENTIDAD" }, function () {
        this.on( 'CL.ENTIDAD_ID', '=', 'AC.ENTIDAD_ID');
    }) 
    .leftJoin({ ES: "ESTADO" }, function () {
        this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
    })
    .leftJoin({ TI: "TIPO" }, function () {
        this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
    })
    .leftJoin({ TO: "TIPO" }, function () {
        this.on( 'TO.TIPO_ID', '=', 'AC.OBJETIVO_TIPO_ID');
    })

    if(('cod_empresa' in campos)){
        estructuraConsulta.where('AC.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('AC.CENCOS_ID',`${campos.cod_cc}`)
    }
    if(('cod_asesor' in campos)){
        estructuraConsulta.where('AC.USUARIO_ID',`${campos.cod_asesor}`)
    }
   
    estructuraConsulta.whereIn('AC.ESTADO_ID', [24, 35, 26])

    const data = await estructuraConsulta.select(
        "AC.ACTIVIDAD_ID AS COD_ACTIVIDAD",
        "AC.ACTIVIDAD_FECHA AS FECHA_CREADA",
        "AC.ACTIVIDAD_ASUNTO AS ASUNTO", 
        "AC.ACTIVIDAD_DESCRIPCION AS DESCRIPCION",
        "CL.ENTIDAD_NOMBRE AS NOMBRE_CLIENTE",
        "AC.TIPO_ID AS COD_TIPO",
        "TI.TIPO_DESCRIPCION AS NOM_TIPO",
        "AC.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMADA",
        "AC.ENTIDAD_ID AS COD_CLIENTE",
        "AC.EMPRESA_ID AS COD_EMP",
        "AC.CENCOS_ID AS COD_CC",
        "AC.ESTADO_ID AS COD_ESTADO",
        "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
        "AC.USUARIO_ID AS COD_ASESOR",
        "AC.CAMPANA_ID AS COD_CAMPANA",
        "AC.ACTIVIDAD_COD_DOCUMENTO AS COD_DOCUMENTO",
        "AC.OBJETIVO_TIPO_ID AS COD_OBJETIVO_ACTIVIDAD",
        "TO.TIPO_DESCRIPCION AS OBJETIVO_ACTIVIDAD_DESC",
        "AC.USUARIO_CREADOR_ID AS COD_CREADOR",
    );
    return data;
}

module.exports.getdatos_actividad_sin_asignar = async (campos) => {
    const estructuraConsulta =  azureSqlClient({"AC": "ACTIVIDAD"})  
    .leftJoin({ CL: "ENTIDAD" }, function () {
        this.on( 'CL.ENTIDAD_ID', '=', 'AC.ENTIDAD_ID');
    })  
    .leftJoin({ ES: "ESTADO" }, function () {
        this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
    })
    .leftJoin({ TI: "TIPO" }, function () {
        this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
    }).leftJoin({ TO: "TIPO" }, function () {
        this.on( 'TO.TIPO_ID', '=', 'AC.OBJETIVO_TIPO_ID');
    })

    if(('cod_cc' in campos)){
        estructuraConsulta.where('AC.CENCOS_ID',`${campos.cod_cc}`)
    }

    estructuraConsulta.where('AC.USUARIO_ID', null)

    const data = await estructuraConsulta.select(
        "AC.ACTIVIDAD_ID AS COD_ACTIVIDAD",
        "AC.ACTIVIDAD_FECHA AS FECHA_CREADA",
        "AC.ACTIVIDAD_ASUNTO AS ASUNTO", 
        "AC.ACTIVIDAD_DESCRIPCION AS DESCRIPCION",
        "CL.ENTIDAD_NOMBRE AS NOMBRE_CLIENTE",
        "AC.TIPO_ID AS COD_TIPO",
        "TI.TIPO_DESCRIPCION AS NOM_TIPO",
        "AC.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMADA",
        "AC.ENTIDAD_ID AS COD_CLIENTE",
        "AC.EMPRESA_ID AS COD_EMP",
        "AC.CENCOS_ID AS COD_CC",
        "AC.ESTADO_ID AS COD_ESTADO",
        "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
        "AC.USUARIO_ID AS COD_ASESOR",
        "AC.CAMPANA_ID AS COD_CAMPANA",
        "AC.ACTIVIDAD_COD_DOCUMENTO AS COD_DOCUMENTO",
        "AC.OBJETIVO_TIPO_ID AS COD_OBJETIVO_ACTIVIDAD",
        "TO.TIPO_DESCRIPCION AS OBJETIVO_ACTIVIDAD_DESC",
        "AC.USUARIO_CREADOR_ID AS COD_CREADOR",
    );
    return data;
}

module.exports.insertar_actividad = async (campos) => {
    if('fecha_programada' in campos && 'asunto' in campos && 'descripcion' in campos && 'cod_tipo' in campos 
        && 'cod_emp' in campos && 'cod_cc' in campos 
        // && "contactos" in campos && 'cod_cliente' in campos
    ){
        const  idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'ACTIVIDAD'});
        if(idnuevo>0){
            try {
                let resinsert = await azureSqlClient("ACTIVIDAD")
                 .insert({
                    "ACTIVIDAD_ID"                  : idnuevo,
                    "ACTIVIDAD_FECHA"               : await cropa_fecha_hora_actual(),
                    "ACTIVIDAD_ASUNTO"              : campos.asunto, 
                    "ACTIVIDAD_DESCRIPCION"         : campos.descripcion, 
                    "TIPO_ID"                       : campos.cod_tipo, 
                    "ACTIVIDAD_FECHA_PROGRAMACION"  : campos.fecha_programada, 
                    "ENTIDAD_ID"                    : campos.cod_cliente, 
                    "EMPRESA_ID"                    : campos.cod_emp, 
                    "CENCOS_ID"                     : campos.cod_cc, 
                    "USUARIO_ID"                    : campos.cod_asesor,
                    "ESTADO_ID"                     : campos.cod_estado || 23,
                    "CAMPANA_ID"                    : campos.cod_campana,
                    "ACTIVIDAD_COD_DOCUMENTO"       : campos.cod_documento,
                    "OBJETIVO_TIPO_ID"              : campos.cod_objetivo_actividad,
                    "USUARIO_CREADOR_ID"            : global.usuario?.USUARIO_ID
                 }).then(async () => {
                    console_log('Nueva actividad creado ID:' , idnuevo);
                    if(global.usuario){
                        await insertar_actividad_bitacora(global.usuario?.USUARIO_ID || null, campos.cod_estado || 23, {...campos, "cod_actividad": idnuevo}, 42);
                    }
                    await this.agregar_contactos_actividad({contactos:campos.contactos || [], cod_actividad: idnuevo})
                    
                    return {'success' : true, 
                            "cod_mensaje" : 1041,
                            'mensaje' : 'Actividad creada correctamente' ,
                            'cod_actividad' : idnuevo.toString()};   

                 }).catch((e) => {
                     console_log(e);                    
                     return { "success" : false, "cod_mensaje" : 1042,"error" : e.toString() };
                 });
                 return resinsert;
                 
            } catch (error) {
                 return {
                    'success'       : false, 
                    'cod_mensaje'   : 1044,
                    'mensaje'       : error
                };                        
            }  
        }else{
            return {'success' : false, "cod_mensaje" : 1047,'mensaje' : 'No existe un correlativo valido para la tabla, consulta con IT'};    
        }


    } else {
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.agregar_contactos_actividad = async (campos) => {
    let agregados = []
    let lista_contactos = campos.contactos;
    if(!Array.isArray(campos.contactos)){
        lista_contactos = [campos.contactos]
    }

    for(let i in lista_contactos){
        const busqueda_actual = await azureSqlClient("ACTIVIDAD_CONTACTO")
                                        .where("ACTIVIDAD_ID", campos.cod_actividad)
                                        .where("ENTIDADCONTACTO_ID", lista_contactos[i])
                                        .first();

        if(busqueda_actual){
            console_log(`El contacto: "${lista_contactos[i]}" ya esta asociado a la actividad "${campos.cod_actividad}"`);
            continue
        }

        // Desactivar contactos antiguos
        await azureSqlClient("ACTIVIDAD_CONTACTO")
                                .where("ACTIVIDAD_ID",  campos.cod_actividad)
                                .update({"ESTADO_ID" : 2,})

        const  idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'ACTIVIDAD_CONTACTO'});
        await azureSqlClient("ACTIVIDAD_CONTACTO")
        .insert({
            "ACTIVIDAD_CONTACTO_ID"     : idnuevo,
            "ACTIVIDAD_ID"              : campos.cod_actividad,
            "ACTIVIDAD_CONTACTO_FECHA"  : await cropa_fecha_actual(),
            "ENTIDADCONTACTO_ID"        : lista_contactos[i], 
            "USUARIO_ID"                : global.usuario.USUARIO_ID,
            "ESTADO_ID"                 : 1,
        })
        .then(async () => {
            console_log(`Se agrego el contacto: "${lista_contactos[i]}" a la actividad "${campos.cod_actividad}"`);
            agregados.push(lista_contactos[i])
        })
    }
    return {'success' : true, "cod_mensaje" : 1041,'mensaje' : `Contactos agregados correctamente.`, 'contactos_agregados' : agregados};    
}

module.exports.lista_contactos_actividad = async (campos) => {
    if("cod_actividad" in campos){
        const estructuraConsulta = azureSqlClient({AC: "ACTIVIDAD_CONTACTO"})
        .leftJoin({ EC: "ENTIDAD_CONTACTO" }, function () {
            this.on( 'EC.ENTIDADCONTACTO_ID', '=', 'AC.ENTIDADCONTACTO_ID');
        })
        .leftJoin({ EN: "ENTIDAD" }, function () {
            this.on( 'EN.ENTIDAD_ID', '=', 'EC.ENTIDAD_ID');
        })
        .leftJoin({ E: "EMPRESA" }, function () {
            this.on( 'E.EMPRESA_ID', '=', 'EC.EMPRESA_ID');
        })
        .leftJoin({ CC: "CENTRO_COSTO" }, function () {
            this.on( 'CC.CENCOS_ID', '=', 'EC.CENCOS_ID');
        })
        // .leftJoin({ ENI: "ENTIDAD_IDENTIFICACION" }, function () {
        //     this.on( 'ENI.ENTIDAD_ID', '=', 'EC.ENTIDAD_ID');
        // })
        // .leftJoin({ IDE: "IDENTIFICACION" }, function () {
        //     this.on( 'IDE.IDENTIFICACION_ID', '=', 'ENI.IDENTIFICACION_ID');
        // })
        .leftJoin({ ES: "ESTADO" }, function () {
            this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
        });

        estructuraConsulta.where("AC.ACTIVIDAD_ID", campos.cod_actividad)

        const data = await estructuraConsulta.select(
            "EC.ENTIDADCONTACTO_ID",
            // "ENI.ENTIDADIDENTIFICACIO_NUMERO AS CODIGO_ENTIDAD",
            "EN.ENTIDAD_NOMBRE",
            "EC.ENTIDAD_ID",
            "EC.EMPRESA_ID AS COD_EMP",
            "EC.CENCOS_ID AS COD_CC",
            "E.EMPRESA_NOMBRE AS NOMBRE_EMP",
            "CC.CENCOD_NOMBRE AS NOMBRE_CC", 
            "EC.ENTIDADCONTACTO_NOMBRE",
            "EC.ENTIDADCONTACTO_EMAIL",
            "EC.ENTIDADCONTACTO_TELEFONO",
            "ES.ESTADO_ID AS COD_ESTADO",
            "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
            azureSqlClient.raw(`
                (
                    SELECT ect.ENTDADCONTACTO_ID, ect.TIPO_ID AS COD_TIPO, t.TIPO_DESCRIPCION FROM ENTIDAD_CONTACTO_TIPO ect 
                    LEFT JOIN  TIPO t ON t.TIPO_ID = ect.TIPO_ID 
                    WHERE ect.ENTDADCONTACTO_ID = EC.ENTIDADCONTACTO_ID
                    FOR JSON PATH
                ) AS data_entidad_contacto_tipo`
            )
        );
        return data;
    } else {
        return {'success' : false,"cod_mensaje" : 1048, 'mensaje' : 'Debe enviar el cod_actividad, retornado al consultar lista actividad'};
    } 
}

module.exports.actualizar_actividad = async (campos) => {
    if('cod_actividad' in campos, 'fecha_programada' in campos && 'asunto' in campos && 'descripcion' in campos && 'cod_tipo' in campos
        && 'cod_emp' in campos && 'cod_cc' in campos
        // && 'cod_cliente' in campos
    ){
        let busqueda = await azureSqlClient("ACTIVIDAD")
        .where("ACTIVIDAD_ID",  campos.cod_actividad)  

        if(busqueda){
            try {
                let resinsert = await azureSqlClient("ACTIVIDAD")
                .where("ACTIVIDAD_ID",  campos.cod_actividad)  
                 .update({
                    "ACTIVIDAD_ASUNTO"              : campos.asunto, 
                    "ACTIVIDAD_DESCRIPCION"         : campos.descripcion, 
                    "TIPO_ID"                       : campos.cod_tipo, 
                    "ACTIVIDAD_FECHA_PROGRAMACION"  : campos.fecha_programada, 
                    "ENTIDAD_ID"                    : campos.cod_cliente, 
                    "EMPRESA_ID"                    : campos.cod_emp, 
                    "CENCOS_ID"                     : campos.cod_cc, 
                    "USUARIO_ID"                    : campos.cod_asesor,
                    "ESTADO_ID"                     : campos.cod_estado,
                    "CAMPANA_ID"                    : campos.cod_campana,
                    "ACTIVIDAD_COD_DOCUMENTO"       : campos.cod_documento || busqueda.ACTIVIDAD_COD_DOCUMENTO,
                    "OBJETIVO_TIPO_ID"              : campos.cod_objetivo_actividad
                 }).then(async () => {
                    console_log('Actividad actualizada ID:' , campos.cod_actividad);
                    await insertar_actividad_bitacora(global.usuario.USUARIO_ID, campos.cod_estado || 23, {...campos}, 43);
                    return {'success' : true, 
                            "cod_mensaje" : 1031,
                            'mensaje' : 'Actividad actualizada correctamente' ,
                            'cod_actividad' : campos.cod_actividad.toString()};   

                 }).catch((e) => {
                     console_log(e);                    
                     return { "success" : false, "cod_mensaje" : 1042,"error" : e.toString() };
                 });
                 return resinsert;
            } catch (error) {
                 return {
                    'success'       : false, 
                    'cod_mensaje'   : 1032,
                    'mensaje'       : error
                };                        
            }  
        }else{
            return {'success' : false, "cod_mensaje" : 1034,'mensaje' : 'No se ha podido localizar la actividad'};    
        }
    } else {
        return {'success' : false,"cod_mensaje" : 1033, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.cambiar_estado_actividad = async (campos) => {

    if('cod_actividad' in campos){
        let busqueda = await azureSqlClient("ACTIVIDAD")
        .where("ACTIVIDAD_ID",  campos.cod_actividad)  

        if(busqueda){
            try {
                let resinsert = await azureSqlClient("ACTIVIDAD")
                .where("ACTIVIDAD_ID",  campos.cod_actividad)  
                 .update({
                    "ESTADO_ID" : campos.cod_estado || 24 
                 }).then(async () => {
                    console_log('Actividad actualizada ID:' , campos.cod_actividad);
                    await insertar_actividad_bitacora(global.usuario.USUARIO_ID, campos.cod_estado || 23, {...campos}, 43);
                    return {'success' : true, 
                            "cod_mensaje" : 1031,
                            'mensaje' : 'Actividad actualizada correctamente' ,
                            'cod_actividad' : campos.cod_actividad.toString()};   

                 }).catch((e) => {
                     console_log(e);                    
                     return { "success" : false, "cod_mensaje" : 1042,"error" : e.toString() };
                 });
                 return resinsert;
            } catch (error) {
                 return {
                    'success'       : false, 
                    'cod_mensaje'   : 1032,
                    'mensaje'       : error
                };                        
            }  
        }else{
            return {'success' : false, "cod_mensaje" : 1034,'mensaje' : 'No se ha podido localizar la actividad'};    
        }
    } else {
        return {'success' : false,"cod_mensaje" : 1033, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}

module.exports.cerrar_actividades_vencidas = async (campos) => {

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const estructuraConsulta =  azureSqlClient("ACTIVIDAD")   
    estructuraConsulta.whereIn('ESTADO_ID', [23, 25, 36])
    estructuraConsulta.where('ACTIVIDAD_FECHA_PROGRAMACION', '<', endOfDay)
    await estructuraConsulta.update({
        "ESTADO_ID": 35
    });

    return {'success' : true, 
        "cod_mensaje" : 1031,
        'mensaje' : 'Se han cerrado las actidades'};
}

module.exports.eliminar_actividad = async (campos) => {
    if('actividad_id' in campos){
        const busqueda_actividad =  azureSqlClient({"AC": "ACTIVIDAD"})   
        .where("AC.ACTIVIDAD_ID", campos.actividad_id)
        .first();
        if(busqueda_actividad){
            const delregistro = await azureSqlClient("ACTIVIDAD")
            .where("ACTIVIDAD_ID", campos.actividad_id)
            .del()
            return {'success' : true, "cod_mensaje" : 1052,'mensaje' : 'Eliminado'};
        }else{
            return {'success' : false, "cod_mensaje" : 1052,'mensaje' : 'No fue localizado la actividad, verifique'};
        }
    }else{
        return {'success' : false, "cod_mensaje" : 1053,'mensaje' : 'Debe de enviar los parametros necesarios'};
    }
}

module.exports.insertar_resultado = async (campos) => {
   try {
        if('actividad_padre' in campos, 'fecha_programada' in campos && 'asunto' in campos && 'descripcion' in campos && 'cod_tipo' in campos 
            && 'cod_emp' in campos && 'cod_cc' in campos
        ){

            let nuevaActividad = {}
            if(!!campos.crear_seguimiento){
                nuevaActividad = await this.insertar_actividad(campos)
            }

            if((nuevaActividad && 'cod_actividad' in nuevaActividad ) || !campos.crear_seguimiento){

                const  idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'ACTIVIDAD_RESULTADO'});

                if(idnuevo > 0){
                    let res_insert = await azureSqlClient("ACTIVIDAD_RESULTADO")
                    .insert({
                        "ACTIVIDAD_RESULTADO_ID"            : idnuevo,
                        "ACTIVIDAD_RESULTADO_FECHA"         : await cropa_fecha_hora_actual(),
                        "TIPO_ID"                           : campos.cod_tipo,
                        "ESTADO_ID"                         : campos.cod_estado || 23,
                        "ACTIVIDAD_ID"                      : campos.actividad_padre,
                        "ACTIVIDAD_RESULTADO_DESCRIPCION"   : campos.descripcion,
                        "ACTIVIDAD_RESULTADO_REFERENCIA"    : campos.referencia,
                        "ACTIVIDAD_RESULTADO_ACTIVIDAD"     : campos.crear_seguimiento ? nuevaActividad.cod_actividad : null,
                        "ACTIVIDAD_RESULTADO_REASON_CODE"   : campos.reason_code
                    }).then(async () => {
                        console_log('Nuevo resultado creado ID:' , idnuevo);

                        if(campos.cod_tipo == 65){
                            await this.resultado_seguimiento({
                                "cod_actividad_padre": campos.actividad_padre,
                                "cod_actividad_res": nuevaActividad.cod_actividad,
                            })
                        }

                        return {'success' : true, 
                                "cod_mensaje" : 1041,
                                'mensaje' : 'Resultado creado correctamente' ,
                                'cod_actividad' : nuevaActividad.cod_actividad ? nuevaActividad.cod_actividad.toString() : null
                            };   

                    }).catch((e) => {
                        console_log(e);                    
                        return { "success" : false, "cod_mensaje" : 1042, "error" : e.toString() };
                    });
                    return res_insert; 
                } else {
                    return {'success' : false, "cod_mensaje" : 1047,'mensaje' : 'No existe un correlativo valido para la tabla, consulta con IT'};    
                }
            } else {
                return nuevaActividad // Error desde insertar_actividad
            }
        } else {
            return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
        }
    }
    catch (e) {
        console_error(e.message);
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'Error al guardar el resultado'};
    }
}

module.exports.getdatos_resultados = async (campos) => { 

    if(('cod_actividad' in campos)){
        
        // RESULTADOS CON SEGUIMIENTO
        const estructuraConsulta =  azureSqlClient({"AR": "ACTIVIDAD_RESULTADO "})   
        .leftJoin({ AC: "ACTIVIDAD " }, function () {
            this.on( 'AC.ACTIVIDAD_ID', '=', 'AR.ACTIVIDAD_RESULTADO_ACTIVIDAD ');
        })
        .leftJoin({ ES: "ESTADO" }, function () {
            this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
        })
        .leftJoin({ TI: "TIPO" }, function () {
            this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
        })
        .leftJoin({ TO: "TIPO" }, function () {
            this.on( 'TO.TIPO_ID', '=', 'AC.OBJETIVO_TIPO_ID');
        })

        estructuraConsulta.where('AR.ACTIVIDAD_ID',`${campos.cod_actividad}`)
        estructuraConsulta.whereNotNull('AR.ACTIVIDAD_RESULTADO_ACTIVIDAD')

        const data = await estructuraConsulta.select(
            "AR.ACTIVIDAD_RESULTADO_ID AS COD_ACTIVIDAD_RESULTADO",
            "AC.ACTIVIDAD_ID AS COD_ACTIVIDAD",
            "AC.ACTIVIDAD_FECHA AS FECHA_CREADA",
            "AC.ACTIVIDAD_ASUNTO AS ASUNTO", 
            "AC.ACTIVIDAD_DESCRIPCION AS DESCRIPCION",
            "AC.TIPO_ID AS COD_TIPO",
            "TI.TIPO_DESCRIPCION AS NOM_TIPO",
            "AC.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMADA",
            "AC.ENTIDAD_ID AS COD_CLIENTE",
            "AC.EMPRESA_ID AS COD_EMP",
            "AC.CENCOS_ID AS COD_CC",
            "AC.ESTADO_ID AS COD_ESTADO",
            "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
            "AC.USUARIO_ID AS COD_ASESOR",
            "AR.ACTIVIDAD_RESULTADO_REFERENCIA AS REFERENCIA",
            "AC.ACTIVIDAD_COD_DOCUMENTO AS COD_DOCUMENTO",
            "AR.ACTIVIDAD_RESULTADO_REASON_CODE AS REASON_CODE",
            "AC.OBJETIVO_TIPO_ID AS COD_OBJETIVO_ACTIVIDAD",
            "TO.TIPO_DESCRIPCION AS OBJETIVO_ACTIVIDAD_DESC",
            "AC.USUARIO_CREADOR_ID AS COD_CREADOR",
        );

        // RESULTADOS SIN SEGUIMIENTOs
        const estructuraConsulta2 =  azureSqlClient({"AR": "ACTIVIDAD_RESULTADO "})   
        .leftJoin({ AC: "ACTIVIDAD " }, function () {
            this.on( 'AC.ACTIVIDAD_ID', '=', 'AR.ACTIVIDAD_ID');
        })
        .leftJoin({ ES: "ESTADO" }, function () {
            this.on( 'ES.ESTADO_ID', '=', 'AR.ESTADO_ID');
        })
        .leftJoin({ TI: "TIPO" }, function () {
            this.on( 'TI.TIPO_ID', '=', 'AR.TIPO_ID');
        })
        .leftJoin({ TO: "TIPO" }, function () {
            this.on( 'TO.TIPO_ID', '=', 'AC.OBJETIVO_TIPO_ID');
        })
        estructuraConsulta2.where('AR.ACTIVIDAD_ID',`${campos.cod_actividad}`)
        estructuraConsulta2.whereNull('AR.ACTIVIDAD_RESULTADO_ACTIVIDAD')

        const data2 = await estructuraConsulta2.select(
            "AR.ACTIVIDAD_RESULTADO_ID AS COD_ACTIVIDAD_RESULTADO",
            "AR.ACTIVIDAD_RESULTADO_ACTIVIDAD AS COD_ACTIVIDAD",
            "AR.ACTIVIDAD_RESULTADO_FECHA AS FECHA_CREADA",
            "AR.ACTIVIDAD_RESULTADO_DESCRIPCION AS DESCRIPCION",
            "AR.TIPO_ID AS COD_TIPO",
            "TI.TIPO_DESCRIPCION AS NOM_TIPO",
            "AR.ACTIVIDAD_RESULTADO_FECHA AS FECHA_PROGRAMADA",
            "AC.ENTIDAD_ID AS COD_CLIENTE",
            "AC.EMPRESA_ID AS COD_EMP",
            "AC.CENCOS_ID AS COD_CC",
            "AR.ESTADO_ID AS COD_ESTADO",
            "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
            "AC.USUARIO_ID AS COD_ASESOR",
            "AR.ACTIVIDAD_RESULTADO_REFERENCIA AS REFERENCIA",
            "AR.ACTIVIDAD_RESULTADO_REASON_CODE AS REASON_CODE",
            "AC.OBJETIVO_TIPO_ID AS COD_OBJETIVO_ACTIVIDAD",
            "TO.TIPO_DESCRIPCION AS OBJETIVO_ACTIVIDAD_DESC",
            "AC.USUARIO_CREADOR_ID AS COD_CREADOR",
        );

        return [...data, ...data2];
    } else {
        return {'success' : false,"cod_mensaje" : 1048, 'mensaje' : 'Debe enviar el cod_actividad, retornado al consultar lista actividad'};
    }
}

module.exports.getdatos_actividad_2 = async (campos) => {
    const estructuraConsulta =  azureSqlClient({"AC": "ACTIVIDAD"})  
    .leftJoin({ CL: "ENTIDAD" }, function () {
        this.on( 'CL.ENTIDAD_ID', '=', 'AC.ENTIDAD_ID');
    }) 
    .leftJoin({ ES: "ESTADO" }, function () {
        this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
    })
    .leftJoin({ TI: "TIPO" }, function () {
        this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
    })
    .leftJoin({ TO: "TIPO" }, function () {
        this.on( 'TO.TIPO_ID', '=', 'AC.OBJETIVO_TIPO_ID');
    })

    if(('cod_asesor' in campos)){
        estructuraConsulta.where('AC.USUARIO_ID',`${campos.cod_asesor}`)
    }

    if(('fecha_programada' in campos)){
        const date = new Date(campos.fecha_programada);
        const formattedDate = date.toISOString().split('T')[0];
        estructuraConsulta.whereRaw('CAST(AC.ACTIVIDAD_FECHA_PROGRAMACION AS DATE) = ?', [formattedDate])
    }
    if(('cod_estado' in campos)){
        estructuraConsulta.where('AC.ESTADO_ID',`${campos.cod_estado}`)
    }
    if(('cod_tipo' in campos)){
        estructuraConsulta.where('AC.TIPO_ID',`${campos.cod_tipo}`)
    }
    if(('cod_empresa' in campos)){
        estructuraConsulta.where('AC.EMPRESA_ID',`${campos.cod_empresa}`)
    }
    if(('cod_cc' in campos)){
        estructuraConsulta.where('AC.CENCOS_ID',`${campos.cod_cc}`)
    }

    const data = await estructuraConsulta.select(
        "AC.ACTIVIDAD_ID AS COD_ACTIVIDAD",
        "AC.ACTIVIDAD_FECHA AS FECHA_CREADA",
        "AC.ACTIVIDAD_ASUNTO AS ASUNTO", 
        "AC.ACTIVIDAD_DESCRIPCION AS DESCRIPCION",
        "AC.TIPO_ID AS COD_TIPO",
        "TI.TIPO_DESCRIPCION AS NOM_TIPO",
        "AC.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMADA",
        
        "AC.EMPRESA_ID AS COD_EMP",
        "AC.CENCOS_ID AS COD_CC",
        "AC.ESTADO_ID AS COD_ESTADO",
        "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
        "AC.USUARIO_ID AS COD_ASESOR",
       
        "AC.ENTIDAD_ID AS COD_CLIENTE",
        "CL.ENTIDAD_NOMBRE AS NOMBRE_CLIENTE",

        "AC.ACTIVIDAD_COD_DOCUMENTO AS COD_DOCUMENTO",
        "AC.OBJETIVO_TIPO_ID AS COD_OBJETIVO_ACTIVIDAD",
        "TO.TIPO_DESCRIPCION AS OBJETIVO_ACTIVIDAD_DESC",
        "AC.USUARIO_CREADOR_ID AS COD_CREADOR",

        azureSqlClient.raw(`
            (
                SELECT TOP 1 EC.ENTIDADCONTACTO_ID, EC.ENTIDADCONTACTO_NOMBRE, EC.ENTIDADCONTACTO_EMAIL, EC.ENTIDADCONTACTO_TELEFONO FROM ACTIVIDAD_CONTACTO ACO 
                LEFT JOIN ENTIDAD_CONTACTO AS EC ON EC.ENTIDADCONTACTO_ID = ACO.ENTIDADCONTACTO_ID
                WHERE ACO.ACTIVIDAD_ID = AC.ACTIVIDAD_ID AND ACO.ESTADO_ID = 1
                FOR JSON PATH
            ) AS CONTACTO`
        ),
        azureSqlClient.raw(`
            (
                SELECT * FROM (
                    SELECT 
                        AC2.ACTIVIDAD_ID AS COD_ACTIVIDAD, 
                        AC2.ACTIVIDAD_DESCRIPCION AS DESCRIPCION, 
                        AC2.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMADA,
                        AC2.TIPO_ID AS COD_TIPO, 
                        T2.TIPO_DESCRIPCION AS NOM_TIPO, 
                        CONF.ABREVIATURA AS ABREVIATURA,
                        NULL AS REFERENCIA
                    FROM ACTIVIDAD AC2 
                        LEFT JOIN ACTIVIDAD_RESULTADO AR ON AC2.ACTIVIDAD_ID = AR.ACTIVIDAD_RESULTADO_ACTIVIDAD
                        LEFT JOIN TIPO T2 ON AC2.TIPO_ID = T2.TIPO_ID
                        LEFT JOIN CONFIGURACION_ACTIVIDAD CONF ON AC2.TIPO_ID = CONF.TIPO_ACTIVIDAD_ID AND CONF.ESTADO_ID = 1
                        WHERE AR.ACTIVIDAD_ID = AC.ACTIVIDAD_ID
                        GROUP BY AC2.ACTIVIDAD_ID, AC2.ACTIVIDAD_DESCRIPCION, AC2.ACTIVIDAD_FECHA_PROGRAMACION, AC2.TIPO_ID, T2.TIPO_DESCRIPCION, CONF.ABREVIATURA
                    UNION ALL
                    SELECT 
                        AR2.ACTIVIDAD_RESULTADO_ACTIVIDAD AS COD_ACTIVIDAD, 
                        AR2.ACTIVIDAD_RESULTADO_DESCRIPCION AS DESCRIPCION, 
                        AR2.ACTIVIDAD_RESULTADO_FECHA AS FECHA_PROGRAMADA,
                        AR2.TIPO_ID AS COD_TIPO, 
                        T3.TIPO_DESCRIPCION AS NOM_TIPO, 
                        CONF2.ABREVIATURA AS ABREVIATURA,
                        AR2.ACTIVIDAD_RESULTADO_REFERENCIA AS REFERENCIA
                    FROM ACTIVIDAD_RESULTADO AR2
                        LEFT JOIN TIPO T3 ON AR2.TIPO_ID = T3.TIPO_ID
                        LEFT JOIN CONFIGURACION_ACTIVIDAD CONF2 ON AR2.TIPO_ID = CONF2.TIPO_ACTIVIDAD_ID AND CONF2.ESTADO_ID = 1
                        WHERE AR2.ACTIVIDAD_ID = AC.ACTIVIDAD_ID  AND AR2.ACTIVIDAD_RESULTADO_ACTIVIDAD IS NULL
                        GROUP BY AR2.ACTIVIDAD_RESULTADO_ACTIVIDAD, AR2.ACTIVIDAD_RESULTADO_REFERENCIA, AR2.ACTIVIDAD_RESULTADO_DESCRIPCION, 
                            AR2.ACTIVIDAD_RESULTADO_FECHA, AR2.TIPO_ID, T3.TIPO_DESCRIPCION, CONF2.ABREVIATURA
                ) AS CombinedData
                FOR JSON PATH
            ) AS RESULTADO`
        )   
    )
    
    return data;
}

module.exports.conteo_actividades = async (campos) => {
    const estructuraConsulta =  azureSqlClient({"AC": "ACTIVIDAD"})  
    .leftJoin({ ES: "ESTADO" }, function () {
        this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
    })
    .leftJoin({ TI: "TIPO" }, function () {
        this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
    })

    if(('cod_usuario' in campos)){
        estructuraConsulta.where('AC.USUARIO_ID',`${campos.cod_usuario}`)
    }

    if(('fecha_inicial' in campos)){
        const date = new Date(campos.fecha_inicial);
        const formattedDate = date.toISOString().split('T')[0];
        estructuraConsulta.whereRaw('CAST(AC.ACTIVIDAD_FECHA_PROGRAMACION AS DATE) >= ?', [formattedDate])
    }

    if(('fecha_final' in campos)){
        const date = new Date(campos.fecha_final);
        const formattedDate = date.toISOString().split('T')[0];
        estructuraConsulta.whereRaw('CAST(AC.ACTIVIDAD_FECHA_PROGRAMACION AS DATE) <= ?', [formattedDate])
    }

    const data = await estructuraConsulta.select(
        "AC.ACTIVIDAD_ID",
        "AC.ESTADO_ID",
        "ES.ESTADO_DESCRIPCION",
        "AC.TIPO_ID",
        "TI.TIPO_DESCRIPCION",
    )

    const total = data.length
    const tipos = {}
    const estados = {}

    data.map(actividad => {
        if(!!tipos[actividad["TIPO_DESCRIPCION"]]){
            tipos[actividad["TIPO_DESCRIPCION"]] += 1
        } else {
            tipos[actividad["TIPO_DESCRIPCION"]] = 1
        }

        if(!!estados[actividad["ESTADO_DESCRIPCION"]]){
            estados[actividad["ESTADO_DESCRIPCION"]] += 1
        } else {
            estados[actividad["ESTADO_DESCRIPCION"]] = 1
        }
    })

    return {total, tipos, estados}
}

module.exports.listaactividades_historico = async (campos) => {

    if(('cod_actividad' in campos)){

        const predecesores = await azureSqlClient.raw(`
            WITH PREDECESOR AS (
            -- Base case: start at the given task
            SELECT A.ACTIVIDAD_ID, AR.ACTIVIDAD_ID AS ACTIVIDAD_PADRE_ID, 
                0 AS NIVEL
            FROM ACTIVIDAD A
            LEFT JOIN ACTIVIDAD_RESULTADO AR ON A.ACTIVIDAD_ID = AR.ACTIVIDAD_RESULTADO_ACTIVIDAD
            WHERE A.ACTIVIDAD_ID = ?

            UNION ALL

            -- Recursive case: join to parent
            SELECT 
                A.ACTIVIDAD_ID,
                (SELECT ACTIVIDAD_ID 
                FROM ACTIVIDAD_RESULTADO 
                WHERE ACTIVIDAD_RESULTADO_ACTIVIDAD = A.ACTIVIDAD_ID) AS ACTIVIDAD_PADRE_ID,
                P.NIVEL - 1
            FROM ACTIVIDAD A
            INNER JOIN PREDECESOR P ON A.ACTIVIDAD_ID = P.ACTIVIDAD_PADRE_ID
            WHERE P.ACTIVIDAD_PADRE_ID IS NOT NULL
            )
            SELECT ACTIVIDAD_ID, NIVEL FROM PREDECESOR
            WHERE ACTIVIDAD_ID != ?
            ORDER BY NIVEL ASC;
        `, [campos.cod_actividad, campos.cod_actividad])

        const sucesores = await azureSqlClient.raw(`
            WITH SUCESOR AS (
                -- Base case: start at the given task
                SELECT A.ACTIVIDAD_ID, 0 AS NIVEL
                FROM ACTIVIDAD A
                WHERE A.ACTIVIDAD_ID = ?

                UNION ALL

                -- Recursive case: join to children
                SELECT A.ACTIVIDAD_ID, S.NIVEL + 1
                FROM ACTIVIDAD A
                INNER JOIN ACTIVIDAD_RESULTADO AR ON A.ACTIVIDAD_ID = AR.ACTIVIDAD_RESULTADO_ACTIVIDAD
                INNER JOIN SUCESOR S ON AR.ACTIVIDAD_ID = S.ACTIVIDAD_ID
            )
            SELECT ACTIVIDAD_ID, NIVEL FROM SUCESOR
            WHERE ACTIVIDAD_ID != ?
            ORDER BY NIVEL ASC;    
        `, [campos.cod_actividad, campos.cod_actividad])

        let actividades = await this.getdatos_actividad_padre({lista_cod_actividades: [...[...predecesores, ...sucesores].map(i => i.ACTIVIDAD_ID), campos.cod_actividad]})
        for(let actividad of (actividades || [])){

            let predecesor = predecesores.find(i => i.ACTIVIDAD_ID == actividad.COD_ACTIVIDAD)
            let sucesor = sucesores.find(i => i.ACTIVIDAD_ID == actividad.COD_ACTIVIDAD)

            if(!!predecesor){
                actividad["NIVEL"] = predecesor["NIVEL"]
            } else if(!!sucesor){
                actividad["NIVEL"] = sucesor["NIVEL"]
            } else {
                actividad["NIVEL"] = 0
            }
        }
        return actividades
    }

    return  {'success' : false,"cod_mensaje" : 1048, 'mensaje' : 'Debe enviar el cod_actividad'};
}

module.exports.getdatos_actividad_padre = async (campos) => {
    const estructuraConsulta =  azureSqlClient({"AC": "ACTIVIDAD"})  
    .leftJoin({ CL: "ENTIDAD" }, function () {
        this.on( 'CL.ENTIDAD_ID', '=', 'AC.ENTIDAD_ID');
    }) 
    .leftJoin({ ES: "ESTADO" }, function () {
        this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
    })
    .leftJoin({ TI: "TIPO" }, function () {
        this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
    })
    .leftJoin({ TO: "TIPO" }, function () {
        this.on( 'TO.TIPO_ID', '=', 'AC.OBJETIVO_TIPO_ID');
    })
    .leftJoin({ AR: "ACTIVIDAD_RESULTADO " }, function () {
        this.on( 'AC.ACTIVIDAD_ID', '=', 'AR.ACTIVIDAD_RESULTADO_ACTIVIDAD');
    })
    .whereIn('AC.ACTIVIDAD_ID', campos.lista_cod_actividades)

    estructuraConsulta.whereNot('AC.TIPO_ID', 37)

    const data = await estructuraConsulta.select(
        "AC.ACTIVIDAD_ID AS COD_ACTIVIDAD",
        "AC.ACTIVIDAD_FECHA AS FECHA_CREADA",
        "AC.ACTIVIDAD_ASUNTO AS ASUNTO", 
        "AC.ACTIVIDAD_DESCRIPCION AS DESCRIPCION",
        "AC.TIPO_ID AS COD_TIPO",
        "TI.TIPO_DESCRIPCION AS NOM_TIPO",
        "AC.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMADA",
        "AC.ENTIDAD_ID AS COD_CLIENTE",
        "CL.ENTIDAD_NOMBRE AS NOMBRE_CLIENTE",
        "AC.EMPRESA_ID AS COD_EMP",
        "AC.CENCOS_ID AS COD_CC",
        "AC.ESTADO_ID AS COD_ESTADO",
        "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
        "AC.USUARIO_ID AS COD_ASESOR",
        "AC.CAMPANA_ID AS COD_CAMPANA",
        "AC.ACTIVIDAD_COD_DOCUMENTO AS COD_DOCUMENTO",
        "AC.OBJETIVO_TIPO_ID AS COD_OBJETIVO_ACTIVIDAD",
        "TO.TIPO_DESCRIPCION AS OBJETIVO_ACTIVIDAD_DESC",
        "AR.ACTIVIDAD_ID AS ACTIVIDAD_PADRE_ID",
        "AC.USUARIO_CREADOR_ID AS COD_CREADOR",
    );
    return data;
}

module.exports.getreporte_actividad_externo = async (campos) => {

    const year = !!campos.year ? campos.year : new Date().getFullYear()

    const query = azureSqlClient({"AC": "ACTIVIDAD"})
        .leftJoin({ TI: "TIPO" }, function () {
            this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
        })
        .leftJoin({ EM: "EMPRESA" }, function () {
            this.on( 'EM.EMPRESA_ID', '=', 'AC.EMPRESA_ID');
        }) 
        .leftJoin({ CC: "CENTRO_COSTO" }, function () {
            this.on( 'CC.CENCOS_ID', '=', 'AC.CENCOS_ID');
        }) 
        .whereIn("TI.TIPO_DESCRIPCION", ["CORREO", "LLAMADA", "VISITA"])
        .whereIn(azureSqlClient.raw('DATEPART(YEAR, ACTIVIDAD_FECHA)'), [year-1, year])

    if(('cod_empresa' in campos)){
        query.where('EM.COD_CROPA',`${campos.cod_empresa}`)
    }
    if(('cod_cencos' in campos)){
        query.where('CC.CENCOS_CODCROPA',`${campos.cod_cencos}`)
    }

    let datos = await query.select(
      azureSqlClient.raw('DATEPART(ISO_WEEK, ACTIVIDAD_FECHA) AS SEMANA'),
      azureSqlClient.raw('DATEPART(YEAR, ACTIVIDAD_FECHA) AS ANIO'),
      "TI.TIPO_DESCRIPCION AS ACTIVIDAD_TIPO",
      azureSqlClient.raw('COUNT(*) AS CONTEO')
    )
    .groupByRaw('DATEPART(ISO_WEEK, ACTIVIDAD_FECHA), DATEPART(YEAR, ACTIVIDAD_FECHA), TI.TIPO_DESCRIPCION')
    .orderByRaw('DATEPART(YEAR, ACTIVIDAD_FECHA), DATEPART(ISO_WEEK, ACTIVIDAD_FECHA), TI.TIPO_DESCRIPCION');

    return datos;
}


//SEGUIMIENTOS
module.exports.generar_seguimientos = async () => { 
    console_log("Inicia funcion para crear seguimientos en oracle");
    //Consumir API de Node que reemplaza proceso de insertar en diferentes DB

    //url del servicio; se concatena la api a consultar
    const url_servicio = `${process.env.URL_NODE_CLIENTE}/api/azureapp/crear-seguimiento`;

    //confir basica de la peticion
     const config = {
            headers: {
                'Content-Type': 'application/json',
            }
        };

     const resultado_peticion = await axios.post(url_servicio, {}, config)
        .then(async response => {
            console_log("Respuesta de peticion de la api");
            console_log(JSON.stringify(response.data));
            return (response.data.data);
        })
        .catch(async error => {                            
            console.error('Error al realizar la petición de la api :', url_servicio , error);
             return {'success' : false,"cod_mensaje" : 1060, 'mensaje' : `Error al consumir servicio api. ${url_servicio}`};
        })

    return resultado_peticion;

    console_log("COLA SEGUIMIENTO DE COTIZACION:")

    let actividades = []

    const estructuraConsulta =  oracleClient({TC:"CROPA.TEMP_COTIZACION_ACTIVIDAD"})
    estructuraConsulta.where('TC.CREADO_SEGUIMIENTO',0)

    const cotizaciones = await estructuraConsulta.select("*")

    for(const cotizacion of cotizaciones){

        // BUSCAR SI EL USUARIO QUE CREO LA COTIZACIÓN TIENE USUARIO EN EL ERP
        const usuario = await azureSqlClient({U: 'USUARIO'})
        .leftJoin({ UEP: "USUARIO_EMPLEADO_PUESTO" }, function () {
            this.on( 'U.USUARIO_ID', '=', 'UEP.USUARIO_ID');
        }) 
        .leftJoin({ P: "PUESTO" }, function () {
            this.on( 'P.PUESTO_ID', '=', 'UEP.PUESTO_ID');
        }) 
        .whereILike('U.ORACLE_ID', cotizacion.AUSRID.trim())
        // .where('UEP.USUEMPPUE_DEFAULT', "S") //Obtener solo el puesto default
        .select('U.USUARIO_ID', 'P.EMPRESA_ID', 'P.CENCOS_ID')
        .first();

        if(usuario){
            let entidad = null
            if(cotizacion.CABCOT_CLICOD && cotizacion.CABCOT_CLICOD != " "){
                let entidad_azure = await azureSqlClient({EN: 'ENTIDAD'})
                .leftJoin({ EI: "ENTIDAD_IDENTIFICACION" }, function () {
                    this.on( 'EN.ENTIDAD_ID', '=', 'EI.ENTIDAD_ID');
                }) 
                .where('EI.IDENTIFICACION_ID', 12) //COD_CROPA
                .where('EI.ENTIDADIDENTIFICACIO_NUMERO', cotizacion.CABCOT_CLICOD.trim())
                .select("EN.ENTIDAD_ID")
                .first()
                entidad = entidad_azure?.ENTIDAD_ID
            } 
            
            if(cotizacion.CABCOT_PRECLICOD && cotizacion.CABCOT_PRECLICOD != " "){

                let entidad_azure = await azureSqlClient({EN: 'ENTIDAD'})
                .leftJoin({ EI: "ENTIDAD_IDENTIFICACION" }, function () {
                    this.on( 'EN.ENTIDAD_ID', '=', 'EI.ENTIDAD_ID');
                }) 
                .where('EI.IDENTIFICACION_ID', 14) //COD_CROPA
                .where('EI.ENTIDADIDENTIFICACIO_NUMERO', cotizacion.CABCOT_PRECLICOD)
                .select("EN.ENTIDAD_ID")
                .first()
                entidad = entidad_azure?.ENTIDAD_ID
            }

            if(!entidad) continue

            const actividad = await this.insertar_actividad({
                "fecha_programada": new Date(cotizacion.CABCOT_FECHA),
                "descripcion": `SEGUIMIENTO COTIZACIÓN #${cotizacion.CABCOT_NUMERO}`,
                "asunto": `SEGUIMIENTO COTIZACIÓN #${cotizacion.CABCOT_NUMERO}`,
                "cod_tipo": 65,
                "cod_cliente": entidad,
                "cod_emp": usuario.EMPRESA_ID,
                "cod_cc": usuario.CENCOS_ID,
                "cod_asesor": usuario.USUARIO_ID,
                "contactos": [],
                "cod_estado": 23
            })
         
            if(actividad.success){
                actividades.push(actividad.cod_actividad)

                await azureSqlClient("ACTIVIDAD_COTIZACION") // INGRESAR ACTIVIDAD COTIZACION
                .insert({
                    "EMP_CODIGO": cotizacion.EMP_CODIGO,
                    "CABCOT_NUMERO": cotizacion.CABCOT_NUMERO,
                    "DEPORG_CODIGO": cotizacion.DEPORG_CODIGO,
                    "TIPDOC_CODIGO": cotizacion.TIPDOC_CODIGO,
                    "ACTIVIDAD_ID": actividad.cod_actividad
                })
                await oracleClient("CROPA.TEMP_COTIZACION_ACTIVIDAD")
                    .where("CABCOT_NUMERO", cotizacion.CABCOT_NUMERO)
                    .where("DEPORG_CODIGO", cotizacion.DEPORG_CODIGO)
                    .where("TIPDOC_CODIGO", cotizacion.TIPDOC_CODIGO)
                    .where("EMP_CODIGO", cotizacion.EMP_CODIGO)
                    .del()   
            } else {
                console_log("Error al crear la actividad: ", actividad?.mensaje)
            }
        } else {
            // USUARIO NO ENCONTRADO
            console_log("No se encontro el usuario: ", cotizacion.AUSRID.trim())
        }
    }

    return {'success' : true, 'mensaje' : `Se han creado ${actividades.length} actividades de seguimiento`, "data": actividades};
}

module.exports.resultado_seguimiento = async (campos) => {
    if("cod_actividad_padre" in campos && "cod_actividad_res" in campos){
        const cotizacion = await azureSqlClient("ACTIVIDAD_COTIZACION")
        .where("ACTIVIDAD_ID", campos.cod_actividad_padre)
        .select(
            "EMP_CODIGO", 
            "CABCOT_NUMERO",
            "DEPORG_CODIGO",
            "TIPDOC_CODIGO",
            "ACTIVIDAD_ID"
        ).first()

        if(cotizacion){
            await azureSqlClient("ACTIVIDAD_COTIZACION") // INGRESAR ACTIVIDAD COTIZACION
            .insert({
                "EMP_CODIGO": cotizacion.EMP_CODIGO,
                "CABCOT_NUMERO": cotizacion.CABCOT_NUMERO,
                "DEPORG_CODIGO": cotizacion.DEPORG_CODIGO,
                "TIPDOC_CODIGO": cotizacion.TIPDOC_CODIGO,
                "ACTIVIDAD_ID": campos.cod_actividad_res
            })
            .then(() => {
                return {'success' : false, 'mensaje' : `Creado resultado cotizacion`};
            })
            .catch((e) => {
                return { "success" : false, "cod_mensaje" : 1042, "error" : e.toString() };
            }) 
        }   
        return {'success' : false, 'mensaje' : `No se encontro la cotizacion`};
    } 

    return {'success' : false, 'mensaje' : `Faltan parametros`};
}

module.exports.gethistorial_cliente = async (campos) => {
    if("entidad_id" in campos){

        // CONSULTA AZURE
        const estructuraConsulta =  azureSqlClient({"AC": "ACTIVIDAD"})  
        .leftJoin({ CC: "CENTRO_COSTO" }, function () {
            this.on( 'CC.CENCOS_ID', '=', 'AC.CENCOS_ID');
        })
        .leftJoin({ E: "EMPRESA" }, function () {
            this.on( 'E.EMPRESA_ID', '=', 'AC.EMPRESA_ID');
        })
        .leftJoin({ CL: "ENTIDAD" }, function () {
            this.on( 'CL.ENTIDAD_ID', '=', 'AC.ENTIDAD_ID');
        }) 
        .leftJoin({ ES: "ESTADO" }, function () {
            this.on( 'ES.ESTADO_ID', '=', 'AC.ESTADO_ID');
        })
        .leftJoin({ TI: "TIPO" }, function () {
            this.on( 'TI.TIPO_ID', '=', 'AC.TIPO_ID');
        })
        .where('AC.ENTIDAD_ID',`${campos.entidad_id}`)

        const listaAzure = await estructuraConsulta.select(
            "AC.ACTIVIDAD_ID AS COD_ACTIVIDAD",
            "AC.ACTIVIDAD_FECHA AS FECHA_CREADA",
            "AC.ACTIVIDAD_ASUNTO AS ASUNTO", 
            "AC.ACTIVIDAD_DESCRIPCION AS DESCRIPCION",
            "TI.TIPO_DESCRIPCION AS NOM_TIPO",
            "AC.ACTIVIDAD_FECHA_PROGRAMACION AS FECHA_PROGRAMADA",
            "AC.CENCOS_ID AS COD_CENCO",
            "CC.CENCOD_NOMBRE AS NOMBRE_CENCO",
            "AC.EMPRESA_ID AS COD_EMPRESA",
            "E.EMPRESA_NOMBRE AS NOMBRE_EMPRESA",
            "ES.ESTADO_DESCRIPCION AS ESTADO_DESC",
            "AC.USUARIO_CREADOR_ID AS COD_CREADOR",
            azureSqlClient.raw(`
                (
                    SELECT TOP 1 CONCAT(EMP.EMPLEADO_NOMBRES, ' ', EMP.EMPLEADO_APELLIDOS) 
                    FROM USUARIO_EMPLEADO_PUESTO UEP
                        LEFT JOIN EMPLEADO EMP ON UEP.EMPLEADO_ID = EMP.EMPLEADO_ID
                    WHERE UEP.USUARIO_ID = AC.USUARIO_ID 
                ) AS NOMBRE_USUARIO`
            ),
            azureSqlClient.raw(`
                (
                    SELECT TOP 1 * FROM (
                        SELECT 
                            AC2.ACTIVIDAD_DESCRIPCION AS DESCRIPCION
                        FROM ACTIVIDAD AC2 
                            LEFT JOIN ACTIVIDAD_RESULTADO AR ON AC2.ACTIVIDAD_ID = AR.ACTIVIDAD_RESULTADO_ACTIVIDAD
                            WHERE AR.ACTIVIDAD_ID = AC.ACTIVIDAD_ID
                            GROUP BY AC2.ACTIVIDAD_ID, AC2.ACTIVIDAD_DESCRIPCION
                        UNION ALL
                        SELECT 
                            AR2.ACTIVIDAD_RESULTADO_DESCRIPCION AS DESCRIPCION
                        FROM ACTIVIDAD_RESULTADO AR2
                            LEFT JOIN TIPO T3 ON AR2.TIPO_ID = T3.TIPO_ID
                            WHERE AR2.ACTIVIDAD_ID = AC.ACTIVIDAD_ID  AND AR2.ACTIVIDAD_RESULTADO_ACTIVIDAD IS NULL
                            GROUP BY AR2.ACTIVIDAD_RESULTADO_ACTIVIDAD, AR2.ACTIVIDAD_RESULTADO_DESCRIPCION
                    ) AS DESCRIPCION
                ) AS RESULTADO`
            )   
        )
        .groupBy(
            "AC.ACTIVIDAD_ID",
            "AC.ACTIVIDAD_FECHA",
            "AC.ACTIVIDAD_ASUNTO", 
            "AC.ACTIVIDAD_DESCRIPCION",
            "TI.TIPO_DESCRIPCION",
            "AC.ACTIVIDAD_FECHA_PROGRAMACION",
            "AC.CENCOS_ID",
            "CC.CENCOD_NOMBRE",
            "AC.EMPRESA_ID",
            "E.EMPRESA_NOMBRE",
            "ES.ESTADO_DESCRIPCION",
            "AC.USUARIO_ID",
            "AC.USUARIO_CREADOR_ID",
        )


        // CONSULTA ORACLE
        const entidad =  await azureSqlClient({"E": "ENTIDAD"}) 
        .leftJoin({ EI: "ENTIDAD_IDENTIFICACION" }, function () {
            this.on( 'E.ENTIDAD_ID', '=', 'EI.ENTIDAD_ID');
        }) 
        .where('E.ENTIDAD_ID',`${campos.entidad_id}`) 
        .where('EI.IDENTIFICACION_ID', 12) 
        .first('EI.ENTIDADIDENTIFICACIO_NUMERO AS COD_CROPA')

        const empresas =  await azureSqlClient("EMPRESA") 
        .whereNotNull("COD_CROPA")
        .select("EMPRESA_ID", "COD_CROPA")
        
        const empresasObj = empresas.reduce((obj, empresa) => {
            obj[empresa.COD_CROPA] = empresa.EMPRESA_ID;
            return obj;
        }, {})

        const cencos =  await azureSqlClient("CENTRO_COSTO") 
        .whereNotNull("CENCOS_CODCROPA")
        .select("CENCOS_ID", "CENCOS_CODCROPA")
        
        const cencosObj = cencos.reduce((obj, cenco) => {
            obj[cenco.CENCOS_CODCROPA] = cenco.CENCOS_ID;
            return obj;
        }, {})

        let listaOracle = [] 

        if(entidad){
            const estadosOracle = {
                "1"     : "ACTIVA",
                "14"    : "INGRESADO",
                "2"     : "RECHAZADA",
                "3"     : "CERRADA POR OTRA FIGURA",
                "4"     : "EN SEGUIMIENTO",
                "5"     : "PROYECTO",
                "15"    : "CONFIRMADA",
                "20"    : "FILE GENERADO",
                "21"    : "FILE OPERACIONES",
            }

            const url_servicio = `${process.env.URL_NODE_CLIENTE}/api/azureapp/lista-historico-cliente-actividades`;

            //confir basica de la peticion
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            const consultaOracle = await axios.get(url_servicio, {
                    params: {"cod_cropa": entidad["COD_CROPA"]}
                }, config
            )
            .then(async response => {
                // console_log("Respuesta de peticion de la api");
                // console_log(JSON.stringify(response.data));
                return (response.data.data);
            })
            .catch(async error => {                            
                console.error('Error al realizar la petición de la api :', url_servicio , error);
                return {'success' : false,"cod_mensaje" : 1060, 'mensaje' : `Error al consumir servicio api. ${url_servicio}`};
            })

            listaOracle = consultaOracle.map(actividad => ({
                ...actividad,
                "COD_EMPRESA": empresasObj[actividad.COD_EMPRESA] || null,
                "COD_CENCO": cencosObj[actividad.COD_CENCO] || null,
                "ESTADO_DESC": estadosOracle[actividad.ESTADO_ID] || ""
            }))
        }
    
        return [...listaAzure, ...listaOracle];

    } else {
        return {'success' : false,"cod_mensaje" : 1043, 'mensaje' : 'faltan parametros requeridos, verifique'};
    }
}