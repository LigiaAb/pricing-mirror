const { extraetokenheader } = require("./apiFormatResponse");
const jwt = require('jsonwebtoken');

/*
Middleware de autenticación token

-- Funcion encargada que permite verificar si el token y version de app enviada
en cada peticio es valida.

*/
async function authenticateToken(req, res, next) {
    let token = await extraetokenheader(req);    
    if(global.versionapp !=''){       
      let versionapp = await azureSqlClient({V:"VERSION_APP"})
                    .where('V.APP_VERSION', `${global.versionapp}`)
                    .where('V.APP_ESTADO',1)
                    .first();
      if(!versionapp){
        return res.apiResponse({'success' : false, "cod_mensaje" : 1062,'mensaje' : 'Version Desactualizada, Ctrl+shift+r y cierre sesion. '});  
      }
    }else{
      return res.apiResponse({'success' : false, "cod_mensaje" : 1062,'mensaje' : 'Debe de enviar la version valida'});
    }
    if (token == null || token == '') {
      return res.apiResponse({'success' : false, "cod_mensaje" : 1001,'mensaje' : 'token invalido'});
    }

    const { valido, datos } = validaTokenUsuario(token)

    if(valido){       
      const getusuario = await azureSqlClient({U:"USUARIO"})
        .where('U.USUARIO_ID',`${datos.cod_usuario}`)
        .first();

      if(getusuario.ESTADO_ID==1){              
        const now = await cropa_fecha_hora_actual();                        
        let ultima_conexion = {
          USUARIO_ID : getusuario.USUARIO_ID,
          USUARIO_ULTIMA_CONEXION : now.toString()
        };

        await azureSqlClientlog("LOG_SERVICIOS.USUARIO_ULTIMA_CONEXION").insert(ultima_conexion);
        global.usuario= getusuario;
        req.user = getusuario;
        
        next();
      }else{       
        return res.apiResponse({'success' : false ,"cod_mensaje" : 1002, 'mensaje' : 'Usuario inactivo'});
      }
    }else{
      return res.apiResponse({'success' : false, "cod_mensaje" : 1003,'mensaje' : 'token invalido o expirado'});
    }
  }

//ES-2025-10-08
//middleware autenticar apis publicas
async function autenticaTokenPublico(req, res, next){
    let token = await extraetokenheader(req);       
    if(global.versionapp !=''){
      let versionapp = await azureSqlClient({V:"VERSION_APP"})
                    .where('V.APP_VERSION', `${global.versionapp}`)
                    .where('V.APP_ESTADO',1)
                    .first();
      if(!versionapp){
        return res.apiResponse({'success' : false, "cod_mensaje" : 1062,'mensaje' : 'Version Desactualizada, Ctrl+shift+r y cierre sesion. '});  
      }
    }else{
      return res.apiResponse({'success' : false, "cod_mensaje" : 1062,'mensaje' : 'Debe de enviar la version valida'});
    }
    if (token == null || token == '') {
      return res.apiResponse({'success' : false, "cod_mensaje" : 1001,'mensaje' : 'token invalido'});
    }
    const getusuario = await azureSqlClient({LP:"LINK_PUBLICO"})
                .where('LP.TOKEN_ASIGNADO',`${token}`)
                .whereRaw("LP.EXPIRA_TOKEN > GETDATE()")
                .select("LP.LINK_ID","LP.LLAVE","LP.CENCOS_ID","LP.EMPRESA_ID","LP.ESTADO_ID")
                .first();
    if(getusuario){       
        if(getusuario.ESTADO_ID==1){              
              const now = await cropa_fecha_hora_actual();

              await azureSqlClient("LINK_PUBLICO")
                .where('LINK_ID',getusuario.LINK_ID)
                .update({
                  ULTIMA_INTERACCION : now
                })
                .then(async () => {
                  console_log("Link publico actualizado", getusuario.LINK_ID)
                })
                .catch(e => {
                  console_log("Error al actualizar en link publicos");
                  console_log(e);
                })
                
              //global.usuario= getusuario;
              global.data_publica = getusuario;
              req.user = getusuario;
              
              next();
        }else{       
          return res.apiResponse({'success' : false ,"cod_mensaje" : 1002, 'mensaje' : 'Usuario inactivo'});
        }
    }else{
      return res.apiResponse({'success' : false, "cod_mensaje" : 1003,'mensaje' : 'token invalido o expirado'});
    }    
}

async function autenticaTokenPublicoV2(req, res, next){
    let token = await extraetokenheader(req); 
    let { valido, payload, error } = validaTokenPublico(token)

    if(!valido){
      return res.apiResponse({'success' : false, "cod_mensaje" : 1003, 'mensaje' : error});  
    }

    let { APP_VERSION } = await azureSqlClient({V:"VERSION_APP"})
      .where('V.APP_ESTADO', 1)
      .first();

    if(APP_VERSION != payload.app_version){
      return res.apiResponse({'success' : false, "cod_mensaje" : 1062,'mensaje' : 'Version Desactualizada'});  
    }
    
    const getAuth = await azureSqlClient({LP:"LINK_PUBLICO"})
      .where('LP.LINK_ID',`${payload.id}`)
      .select("LP.LINK_ID","LP.LLAVE","LP.CENCOS_ID","LP.EMPRESA_ID","LP.ESTADO_ID")
      .first();

    if(!!getAuth){       
        if(getAuth.ESTADO_ID == 1){              
              const now = await cropa_fecha_hora_actual();

              await azureSqlClient("LINK_PUBLICO")
                .where('LINK_ID',`${payload.id}`)
                .update({ ULTIMA_INTERACCION : now })
                .then(async () => {
                  console_log("Link publico actualizado", getAuth.LINK_ID)
                })
                .catch(e => {
                  console_log("Error al actualizar en link publicos");
                  console_log(e);
                })
                
              global.data_publica = getAuth;
              req.user = getAuth;
              req.tokenPublico = payload;
              
              next();
        }else{       
          return res.apiResponse({'success' : false ,"cod_mensaje" : 1002, 'mensaje' : 'La gestion ya culmino de manera satisfactoria, no puedes realizar algun otro cambio'});
        }
    }else{
      return res.apiResponse({'success' : false, "cod_mensaje" : 1003,'mensaje' : 'token invalido o expirado'});
    }    
}

function validaTokenUsuario(token) {
  try {
    const decoded = jwt.verify(token, process.env.CLAVE_CREA_TOKEN);
    return { valido: true, datos: decoded };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valido: false, error: 'Token expirado' };
    }
    return { valido: false, error: 'Token inválido' };
  }
}

function validaTokenPublico(token) {
  try {
    const payload = jwt.verify(token, process.env.CLAVE_TOKEN_PUBLICO);
    return { valido: true, payload };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valido: false, error: 'Token expirado' };
    }
    return { valido: false, error: 'Token inválido' };
  }
}

module.exports = {
  authenticateToken,
  autenticaTokenPublico, 
  autenticaTokenPublicoV2
};
