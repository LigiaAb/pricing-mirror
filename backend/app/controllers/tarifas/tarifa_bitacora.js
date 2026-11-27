const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal");


module.exports.listar_tarifa_bitacora = async (campos) => {
     //Parametros para paginar datos
     const pagina = ('nopagina' in campos) && campos.nopagina > 0  ? parseInt(campos.nopagina) : 1;
     const datosxpagina = ('datosxpagina' in campos) && campos.datosxpagina > 0  ? parseInt(campos.datosxpagina) : 2000;

     try {
        const estructuraConsulta =  azureSqlClient({TB:"TARIFA_BITACORA"})
        .leftJoin({ USU: "USUARIO" }, function () {
            this.on( 'USU.USUARIO_ID', '=', 'TB.USUARIO_ID');
        })
        .leftJoin({ ES: "ESTADO" }, function () {
            this.on( 'ES.ESTADO_ID', '=', 'TB.ESTADO_ID');
        });

        if(('tarifa_id' in campos)){
            estructuraConsulta.where('TB.TARIFA_ID',`${campos.tarifa_id}`)
        }
        if(('rubro_id' in campos)){
            estructuraConsulta.where('TB.RUBRO_ID',`${campos.rubro_id}`)
        }
        if(('servicio_id' in campos)){
            estructuraConsulta.where('TB.SERVICIO_ID',`${campos.servicio_id}`)
        }
        if(('metodo_id' in campos)){
            estructuraConsulta.where('TB.METODO_ID',`${campos.metodo_id}`)
        }
        if(('cod_usuario' in campos)){
            estructuraConsulta.where('TB.USUARIO_ID',`${campos.cod_usuario}`)
        }
        if(('tarifabitacora_tabla' in campos)){
            estructuraConsulta.where('TB.TARIFABITACORA_TABLA',`${campos.tarifabitacora_tabla}`)
        }
        if(('fecha_registro' in campos)){
            estructuraConsulta.whereRaw("CONVERT(DATE,TB.TARIFABITACORA_FECHA)= ?'",`${campos.fecha_registro}`)
        }
        if(('cod_estado' in campos)){
            estructuraConsulta.where('TB.ESTADO_ID',`${campos.cod_estado}`)
        }

        // Calcula el total de páginas
        const total = await estructuraConsulta.clone().count('TB.TARIFABITACORA_ID as total');

        // Obtiene datos
        const data = await estructuraConsulta.select(
            'TB.TARIFABITACORA_ID', 
            'TB.TARIFA_ID', 
            'TB.RUBRO_ID', 
            'TB.SERVICIO_ID', 
            'TB.METODO_ID', 
            'TB.USUARIO_ID AS COD_USUARIO', 
            'USU.USUARIO_CORREO',
            'TB.ESTADO_ID AS COD_ESTADO', 
            'ES.ESTADO_DESCRIPCION AS ESTADO_DESC',
            'TB.TARIFABITACORA_FECHA AS FECHA_REGISTRO', 
            'TB.TARIFABITACORA_ACCION', 
            'TB.TARIFABITACORA_ESTADO_ANTERIOR', 
            'TB.TARIFABITACORA_TABLA'
        )
        .offset((pagina - 1) * datosxpagina)
            .limit(datosxpagina);

        const totalPages = Math.ceil(total[0].total / datosxpagina);                        
        return {"total_paginas" : totalPages, 'total_registros' : total[0].total  ,"data" : data};

     } catch (error) {
        return {"success" : false, "error" : error.toString()};
     }
}

module.exports.insertar_tarifa_bitacora = async ({
    tarifa_id, rubro_id, servicio_id, metodo_id, usuario_id, estado_id, accion, data, tabla
}) => {
    const idregistro = await recuperaAcualizaCorrelativoTabla({'tabla' : 'TARIFA_BITACORA'});
    if(idregistro){
        const proceso_inserta = await azureSqlClient("TARIFA_BITACORA")
            .insert({
                TARIFABITACORA_ID               : idregistro,
                TARIFA_ID                       : tarifa_id,
                RUBRO_ID                        : rubro_id,
                SERVICIO_ID                     : servicio_id,
                METODO_ID                       : metodo_id,
                USUARIO_ID                      : usuario_id,
                ESTADO_ID                       : estado_id,
                TARIFABITACORA_ACCION           : accion,
                TARIFABITACORA_FECHA            : await cropa_fecha_hora_actual(),
                TARIFABITACORA_ESTADO_ANTERIOR  : data,
                TARIFABITACORA_TABLA            : tabla
            }).then(async () => {
                console.log('TARIFA_BITACORA ID:' , idregistro);
                    return true;
                
            }).catch((e) => {
                console_log(e.toString());
                    return false;
            });
        return proceso_inserta;
    }{
        console_log("no existe el correlativo para bitacora");
    }
}