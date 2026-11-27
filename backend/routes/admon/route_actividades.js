const { getdatos_actividades_finalizadas, getdatos_actividad_2, getdatos_actividad, getdatos_actividad_sin_asignar, getdatos_actividades_en_curso, getdatos_actividades_vencidas, insertar_actividad, lista_contactos_actividad, agregar_contactos_actividad, actualizar_actividad, cambiar_estado_actividad, getdatos_resultados, eliminar_actividad, insertar_resultado, cerrar_actividades_vencidas, gethistorial_cliente, generar_seguimientos, conteo_actividades, listaactividades_historico } = require("../../app/controllers/actividades/actividades");
const { report_icc } = require("../../app/controllers/actividades/actividades_reportes");
const { getdatos_configuracion_actividad, insertar_configuracion_actividad, actualizar_configuracion_actividad } = require("../../app/controllers/admon/catalogos/configuracion_actividad");
const { cerrar_seguimiento, cerrar_seguimientos_auto } = require("../../app/controllers/cotizaciones/cotizacion_cabecera");

module.exports.AppCloudRoutesActividades = (app) => {
     // Apis para actividades
      app.get("/lista-actividades", (req, res) => {
        getdatos_actividad(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.get("/lista-actividades2", (req, res) => {
        getdatos_actividad_2(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.get("/lista-actividades-sin-asignar", (req, res) => {
        getdatos_actividad_sin_asignar(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.get("/lista-actividades-vencidas", (req, res) => {
        getdatos_actividades_vencidas(req.query)
          .then((i) => {res.apiResponse(i)})
          .catch(e => res.apiResponse(undefined,e.message,404));
        });

      app.get("/lista-actividades-en-curso", (req, res) => {
        getdatos_actividades_en_curso(req.query)
          .then((i) => {res.apiResponse(i)})
          .catch(e => res.apiResponse(undefined,e.message,404));
        });

      app.get("/lista-actividades-finalizadas", (req, res) => {
        getdatos_actividades_finalizadas(req.query)
          .then((i) => {res.apiResponse(i)})
          .catch(e => res.apiResponse(undefined,e.message,404));
        });
  
      app.post("/insertar-actividad", (req, res) => {
        insertar_actividad(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });
  
      app.post("/eliminar-actividad", (req, res) => {
        eliminar_actividad(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });
  
      app.post("/actualizar-actividad", (req, res) => {
        actualizar_actividad(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.post("/cambiar-estado-actividad", (req, res) => {
        cambiar_estado_actividad(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.post("/cerrar-actividades-vencidas", (req, res) => {
        cerrar_actividades_vencidas(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });
  
      app.post("/insertar-contactos-actividad", (req, res) => {
        agregar_contactos_actividad(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });
  
      app.get("/lista-contactos-actividades", (req, res) => {
        lista_contactos_actividad(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });
  
      app.get("/lista-resultados", (req, res) => {
        getdatos_resultados(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });
  
      app.post("/insertar-resultado", (req, res) => {
        insertar_resultado(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });


      //Apis para las actividades de seguimiento
      app.post("/generar-seguimientos", (req, res) => {
        generar_seguimientos(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.post("/cerrar-seguimiento", (req, res) => {
        cerrar_seguimiento(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.post("/cerrar-seguimiento-auto", (req, res) => {
        cerrar_seguimientos_auto(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });


      //Apis para configuracion de actividades
      app.get("/lista-configuracion-actividad", (req, res) => {
        getdatos_configuracion_actividad(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.post("/insertar-configuracion-actividad", (req, res) => {
        insertar_configuracion_actividad(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.post("/actualizar-configuracion-actividad", (req, res) => {
        actualizar_configuracion_actividad(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      
      // Historial cliente
      app.get("/historial-actividades", (req, res) => {
        gethistorial_cliente(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.get("/conteo-actividades", (req, res) => {
        conteo_actividades(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.get("/lista-actividades-historico", (req, res) => {
        listaactividades_historico(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      app.get("/report-icc", (req, res) => {
        report_icc(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
      });

      
}