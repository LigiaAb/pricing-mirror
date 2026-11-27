const { envia_mensaje_error_teams } = require("../controllers/notificador/teams/notifica_backend");

async function extraetokenheader(req){
  // Extraer el token, la version y el url de la petición del encabezado Authorization
  global.request_url = req.get('origin') || req.get('referer')?.split('/').slice(0, 3).join('/');
  //console.log(req.headers);
  global.versionapp = req.headers['version_app'] ? req.headers['version_app'] : '';
  return req.headers['authorization'] ? req.headers['authorization'] : null;
}

async function obteneridusuario(token){
  if(token !=undefined){
    $gethistoken = await azureSqlClient({U:"TOKEN_GENERADOS"})
    .where('U.USUARIO_TOKEN',`${token}`)            
    .first();
    if($gethistoken){
      return parseInt($gethistoken.USUARIO_ID);
    }else{
      return null
    }
  }else{
    return null
  }
}

const responseFormatterMiddleware = async (req, res, next) => {

  res.apiResponse = async (data, message, status = 200) => {
    const startHrTime = process.hrtime();            

    if(data){
      if((typeof data === 'object') && ('success' in data) && (!data.success)){
        if (('cod_mensaje' in data) && (data.cod_mensaje != 1003)){
          envia_mensaje_error_teams(req, data)
        }
      }  
    } else {
      console_log(data)
    }

    // `in` lanza TypeError con undefined/primitivos y la respuesta nunca se enviaba (p. ej. los 422 con data undefined)
    (process.env.APP_DEBUG.trim()).toUpperCase() =='FALSE' ?
      ((data !== null && typeof data === 'object' && 'error' in data) 
      ? data = {'success' : false ,'cod_mensaje' : 1099,'error': "A ocurrido un error, verifque con IT."} 
      : data ) : '';
    
    let data_ = {
      status,
      message: message ? message : status == 200 ? "SUCCESS" : "ERROR",
      length: Array.isArray(data) ? data.length : undefined,
      data,
    };

    res.status(status).json(data_);

    res.on("finish", async () => {
      const elapsedHrTime = process.hrtime(startHrTime);
      const elapsedTimeInMs = `${(elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e9).toFixed(7)}`.padEnd(7, "0");

      const ip = `${req?.socket?.remoteAddress}`.padEnd(15, " ")?.replace("::ffff:", "");
      const method = `${req?.method}`?.padEnd("DELETE".split("").length);
      const url = req?.originalUrl?.split("?") ? req?.originalUrl?.split("?")[0] : "";
      let id_usuario = global.usuario ? global.usuario.USUARIO_ID : null;
      let d = {
        ip_solicitud: req.socket.remoteAddress,
        hora_consulta: await cropa_fecha_hora_actual(),
        metodo: req.method,
        cod_http: status,
        solicitud_url: req.originalUrl?.split("?")[0],
        solicitud_cuerpo: JSON.stringify({ ...req.body, ...req.query }) ,
        respuesta_cuerpo: JSON.stringify(data_).substring(0, 4095),
        tiempo: elapsedTimeInMs,
        id_usuario: id_usuario,
      };

      await azureSqlClientlog("LOG_SERVICIOS.bitacora_consumo_api").insert(d);

      api_log(`GOOD - ${method} - ${ip} - ${`${id_usuario  || "noauth"}`.padEnd(6, " ")} - ${`${status}`.padEnd(3, " ")} - ${elapsedTimeInMs} - ${url}`);
    });
  };

  next();
};

const errorResponseFormatterMiddleware = (req, res, next) => {
  // función para dar formato a la respuesta

  res.apiErrorResponse = async (data, message, status = 200) => {
    const startHrTime = process.hrtime();
    let user = await obteneridusuario(await extraetokenheader(req));
    console_log('respuesta');
    console_log(user);
    let data_ = {
      status,
      message: message ? message : status == 200 ? "SUCCESS" : "ERROR",
      length: Array.isArray(data) ? data.length : undefined,
      data,
    };

    res.status(status).json(data_);

    res.on("finish", async () => {
      const elapsedHrTime = process.hrtime(startHrTime);
      const elapsedTimeInMs = `${(elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e9).toFixed(7)}`.padEnd(7, "0");

      const ip = `${req?.socket?.remoteAddress}`.padEnd(15, " ")?.replace("::ffff:", "");
      const method = `${req?.method}`?.padEnd("DELETE".split("").length);
      const url = req?.originalUrl?.split("?") ? req?.originalUrl?.split("?")[0] : "";      
      let d = {
        ip_solicitud: req?.socket?.remoteAddress,
        hora_consulta: await cropa_fecha_hora_actual(),
        metodo: req.method,
        cod_http: status,
        solicitud_url: req.originalUrl?.split("?")[0],
        solicitud_cuerpo: JSON.stringify({ ...req.body, ...req.query }),
        respuesta_cuerpo: JSON.stringify(data_).substring(0, 4095),
        tiempo: elapsedTimeInMs,
        id_usuario: user,
      };

      await azureSqlClientlog("LOG_SERVICIOS.bitacora_consumo_api").insert(d);

      const error = {
        code: "E8",
        message: `API NODE [${status}] error ${message}`,
        id_usuario: user,
        created_at: await cropa_fecha_hora_actual(),
        api_consumido: req.originalUrl?.split("?")[0],
        cuerpo: JSON.stringify({ ...req.body, ...req.query }),
        response: JSON.stringify(data_).substring(0, 4095),
        status: status,
        metodo: req.method,
      };

      await azureSqlClientlog("LOG_SERVICIOS.erp_error_generado_log").insert(error);

      api_log(`BAD  - ${method} - ${ip} - ${`${user || "noauth"}`.padEnd(6, " ")} - ${`${status}`.padEnd(3, " ")} - ${elapsedTimeInMs} - ${url}`);
    });
  };
  next();
};

const responseFormatterMiddlewarePaginated = async (req, res, next) => {
  // función para dar formato a la respuesta
  res.apiPaginatedResponse = (data, message, status = 200) => {
    res.status(status).json({
      message: message || status == 200 ? "SUCCESS" : "ERROR",
      length: Array.isArray(data.data) ? data.data.length : undefined,
      ...data,
    });
  };
  next();
};

const toLowerCaseMiddleware = (req, res, next) => {
  //if (req.body) {
  // const dataLowercase = {};
  //  for (const [key, value] of Object.entries(req.body)) {
  //    dataLowercase[key.toLowerCase()] = value;
  //  }
  //  req.body= dataLowercase
  //}
  //if(req.query){
  //  const queryParams = req.query;
  //  const queryParamsLowercase = Object.keys(queryParams).reduce((acc, key) => {
  //    acc[key.toLowerCase()] = queryParams[key].toLowerCase();
  //    return acc;
  //  }, {});
  //  req.query = queryParamsLowercase;
  //}
  //next();
};

const rutaNoEncontrada = (req, res, next) => {
  const error = new Error("Ruta no encontrada");
  error.status = 404;

  api_log({ status: 404, message: "Ruta no encontrada" });

  next(error);
};

async function handleError(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Ha ocurrido un error en el servidor";

  let user =await obteneridusuario(extraetokenheader(req));    
  const error = {
    code: "E8",
    message: `Error en API NODE`,
    id_usuario: user || null,
    created_at: await cropa_fecha_hora_actual(),
    api_consumido: req.originalUrl,
    cuerpo: JSON.stringify(req.body),
    response: JSON.stringify({ status: err.status, message: err.message }).substring(0, 4095),
    status: err.status,
    metodo: req.method,
  };

  await azureSqlClientlog("LOG_SERVICIOS.erp_error_generado_log").insert(error);

  api_log({ status, message, error });

  res.status(status).json({
    message: "ERROR",
    error: { status, message },
  });
}

module.exports = {
  responseFormatterMiddlewarePaginated,
  errorResponseFormatterMiddleware,
  responseFormatterMiddleware,
  rutaNoEncontrada,
  handleError,
  extraetokenheader,
  obteneridusuario,
  toLowerCaseMiddleware
};
