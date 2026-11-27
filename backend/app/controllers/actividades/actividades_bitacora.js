const { recuperaAcualizaCorrelativoTabla } = require("../admon/obtienerCorrelativoGlobal");

module.exports.insertar_actividad_bitacora = async (usuario_id, estado_id, data, tipo_id) => {
    const  idnuevo = await recuperaAcualizaCorrelativoTabla({'tabla' : 'ACTIVIDAD_BITACORA'});

   if(idnuevo > 0) {
        await azureSqlClient("ACTIVIDAD_BITACORA")
        .insert({
            "ACTIVIDAD_BITACORA_ID"                 : idnuevo,
            "ACTIVIDAD_BITACORA_FECHA"              : await cropa_fecha_actual(),
            "ACTIVIDAD_BITACORA_ESTADO_ANTERIOR"    : data,
            "USUARIO_ID"                            : usuario_id,
            "ESTADO_ID"                             : estado_id,
            "TIPO_ID"                               : tipo_id, 
        })
        .then(async () => {
            console.log('ACTIVIDAD_BITACORA ID:' , idnuevo);
            return true;
        })
        .catch((error) => {
            console.log('Error al insertar en la tabla ACTIVIDAD_BITACORA', error);
            return false;
        })

        return false;
   } else {
         return false;
   }
}