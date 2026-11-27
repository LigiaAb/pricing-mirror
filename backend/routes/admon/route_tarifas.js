const { insertar_commodity, actualizar_commodity, eliminar_commodity, getlista_commodity } = require("../../app/controllers/tarifas/commodity");
const { getlista_destino, insertar_destinos, actualizar_destino, eliminar_destino } = require("../../app/controllers/tarifas/destino");
const { getlista_grupos_rubro, insertar_grupos_rubro, actualizar_grupos_rubro, eliminar_grupos_rubro, recupera_datos_grupos_rubro } = require("../../app/controllers/tarifas/grupo_rubro");
const { getlista_grupo_rubro_asignacion, insertar_grupo_rubro_asignacion, actualizar_grupo_rubro_asignacion, eliminar_grupo_rubro_asignacion, asignacion_masiva_grupos_rubro, traslado_asignacion_grupos_rubro } = require("../../app/controllers/tarifas/grupo_rubro_asignacion");
const { getlista_metodo, insertar_metodos, actualizar_metodo, eliminar_metodo } = require("../../app/controllers/tarifas/metodo");
const { getlista_metodocommodity, insertar_metodocommodity, actualizar_metodocommodity, eliminar_metodocommodity } = require("../../app/controllers/tarifas/metodo_commodity");
const { getlista_rubros, recupera_informacion_rubro, insertar_rubros, actualizar_rubro, eliminar_rubro } = require("../../app/controllers/tarifas/rubro");
const { getlista_rubros_cenco, insertar_rubros_cenco, actualizar_rubro_cenco, eliminar_rubro_rubro_cenco } = require("../../app/controllers/tarifas/rubro_cenco");
const { getlista_rubros_identificacion, insertar_rubro_identificacion, actualizar_rubro_identificacion, eliminar_rubro_identificacion } = require("../../app/controllers/tarifas/rubro_identificacion");
const { getlista_rubros_nombre, insertar_rubro_nombre, actualizar_rubro_nombre, eliminar_rubro_nombre } = require("../../app/controllers/tarifas/rubro_nombre");
const { getlista_servicio, insertar_servicio, actualizar_servicio, eliminar_servicio, copiar_servicio } = require("../../app/controllers/tarifas/servicio");
const { calcular_tarifa_plantilla, obtener_criterios_especificos, calcular_tarifa_servicios, calcular_scalling_fee } = require("../../app/controllers/tarifas/tarifa");
const { listar_tarifa_bitacora } = require("../../app/controllers/tarifas/tarifa_bitacora");
const { getlista_tarifa_cobertura, insertar_tarifa_cobertura, actualizar_tarifa_cobertura, eliminar_tarifa_cobertura } = require("../../app/controllers/tarifas/tarifa_cobertura");
const { getlista_tarifa_costoventa, insertar_tarifa_costoventa, actualizar_tarifa_costoventa, eliminar_tarifa_costoventa } = require("../../app/controllers/tarifas/tarifa_costoventa");
const { getlista_tarifa_detalle, insertar_tarifa_detalle, actualizar_tarifa_detalle, eliminar_tarifa_detalle } = require("../../app/controllers/tarifas/tarifa_detalle");
const { getlista_tarifa_entidad, insertar_tarifa_entidad, actualizar_tarifa_entidad, eliminar_tarifa_entidad } = require("../../app/controllers/tarifas/tarifa_entidad");
const { getlista_tarifa_equipo, insertar_tarifa_equipo, actualizar_tarifa_equipo, eliminar_tarifa_equipo } = require("../../app/controllers/tarifas/tarifa_equipo");
const { getlista_plantillas, insertar_plantilla, actualizar_plantilla, eliminar_plantilla, recupera_plantilla } = require("../../app/controllers/tarifas/tarifa_plantilla");
const { getlista_plantilla_criterios, insertar_plantilla_criterio, actualizar_plantilla_criterio, eliminar_plantilla_criterio, auto_actualizar_plantilla_criterio } = require("../../app/controllers/tarifas/tarifa_plantilla_criterio");
const { getlista_plantilla_rubros, insertar_plantilla_rubro, actualizar_plantilla_rubro, eliminar_plantilla_rubro } = require("../../app/controllers/tarifas/tarifa_plantilla_rubro");
const { getlista_tarifa_porcentaje_cotizacion, insertar_tarifa_porcentaje_cotizacion, actualizar_tarifa_porcentaje_cotizacion, eliminar_tarifa_porcentaje_cotizacion } = require("../../app/controllers/tarifas/tarifa_porcentaje_cotizacion");
const { getlista_tarifa_porcentaje_rubro, insertar_tarifa_porcentaje_rubro, actualizar_tarifa_porcentaje_rubro, eliminar_tarifa_porcentaje_rubro } = require("../../app/controllers/tarifas/tarifa_porcentaje_rubro");
const { getlista_tarifa_rango, insertar_tarifa_rango, actualizar_tarifa_rango, eliminar_tarifa_rango } = require("../../app/controllers/tarifas/tarifa_rango");
const { getlista_ruta, insertar_ruta, actualizar_ruta, eliminar_ruta } = require("../../app/controllers/tarifas/tarifa_ruta");
const { getlista_tarifa_scalling, insertar_tarifa_scalling, actualizar_tarifa_scalling, eliminar_tarifa_scalling } = require("../../app/controllers/tarifas/tarifa_scalling");
const { getlista_tarifa_spot, insertar_tarifa_spot, actualizar_tarifa_spot, eliminar_tarifa_spot, cargar_archivo_spot } = require("../../app/controllers/tarifas/tarifa_spot");
const { report_hit_rate, report_realizacion_de_precio, report_kpi_cotizaciones } = require("../../app/controllers/cotizaciones/tarifa_reportes");
const { consultar_ultimas_tarifas } = require("../../app/controllers/tarifas/paso_tarifas_a_clipper");

module.exports.AppCloudRoutesTarifas = (app) => {

    //Apis rubros
    app.get("/lista-rubros", (req, res) => {
        getlista_rubros(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-rubros", (req, res) => {
        insertar_rubros(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-rubros", (req, res) => {
        actualizar_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-rubros", (req, res) => {
        eliminar_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });  

    app.get("/recupera-datos-rubro", (req, res) => {
        recupera_informacion_rubro(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });


    //Apis nombres rubros 
    app.get("/lista-nombres-rubros", (req, res) => {
        getlista_rubros_nombre(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-nombres-rubros", (req, res) => {
        insertar_rubro_nombre(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-nombres-rubros", (req, res) => {
        actualizar_rubro_nombre(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-nombres-rubros", (req, res) => {
        eliminar_rubro_nombre(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });  

    //Apis identificacion rubros 
    app.get("/lista-identificacion-rubros", (req, res) => {
        getlista_rubros_identificacion(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-identificacion-rubros", (req, res) => {
        insertar_rubro_identificacion(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-identificacion-rubros", (req, res) => {
        actualizar_rubro_identificacion(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-identificacion-rubros", (req, res) => {
        eliminar_rubro_identificacion(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });  

    //Apis rubros x cenco
    app.get("/lista-rubros-cenco", (req, res) => {
        getlista_rubros_cenco(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-rubros-cenco", (req, res) => {
        insertar_rubros_cenco(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-rubros-cenco", (req, res) => {
        actualizar_rubro_cenco(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-rubros-cenco", (req, res) => {
        eliminar_rubro_cenco(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });  


    //Apis servicios
    app.get("/lista-servicios", (req, res) => {
        getlista_servicio(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-servicio", (req, res) => {
        insertar_servicio(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-servicio", (req, res) => {
        actualizar_servicio(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-servicio", (req, res) => {
        eliminar_servicio(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });  

    app.post("/replicar-servicio", (req, res) => {
        copiar_servicio(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });


    //Apis metodos
    app.get("/lista-metodos", (req, res) => {
        getlista_metodo(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-metodos", (req, res) => {
        insertar_metodos(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-metodos", (req, res) => {
        actualizar_metodo(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-metodos", (req, res) => {
        eliminar_metodo(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });  

    //Apis tarifa entidad
    app.get("/lista-tarifa-entidad", (req, res) => {
        getlista_tarifa_entidad(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-entidad", (req, res) => {
        insertar_tarifa_entidad(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-entidad", (req, res) => {
        actualizar_tarifa_entidad(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-entidad", (req, res) => {
        eliminar_tarifa_entidad(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });  

   
    //Apis tarifa ruta
    app.get("/lista-tarifa-ruta", (req, res) => {
        getlista_ruta(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-ruta", (req, res) => {
        insertar_ruta(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-ruta", (req, res) => {
        actualizar_ruta(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-ruta", (req, res) => {
        eliminar_ruta(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 


    //Apis tarifa costo/venta
    app.get("/lista-tarifa-costoventa", (req, res) => {
        getlista_tarifa_costoventa(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-costoventa", (req, res) => {
        insertar_tarifa_costoventa(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-costoventa", (req, res) => {
        actualizar_tarifa_costoventa(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-costoventa", (req, res) => {
        eliminar_tarifa_costoventa(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 


    //Apis tarifa equipo
    app.get("/lista-tarifa-equipo", (req, res) => {
        getlista_tarifa_equipo(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-equipo", (req, res) => {
        insertar_tarifa_equipo(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-equipo", (req, res) => {
        actualizar_tarifa_equipo(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-equipo", (req, res) => {
        eliminar_tarifa_equipo(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 


    //Apis tarifa rango
    app.get("/lista-tarifa-rango", (req, res) => {
        getlista_tarifa_rango(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-rango", (req, res) => {
        insertar_tarifa_rango(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-rango", (req, res) => {
        actualizar_tarifa_rango(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-rango", (req, res) => {
        eliminar_tarifa_rango(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    //Apis tarifa porcentaje rubro
    app.get("/lista-tarifa-porcentaje-rubro", (req, res) => {
        getlista_tarifa_porcentaje_rubro(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-porcentaje-rubro", (req, res) => {
        insertar_tarifa_porcentaje_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-porcentaje-rubro", (req, res) => {
        actualizar_tarifa_porcentaje_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-porcentaje-rubro", (req, res) => {
        eliminar_tarifa_porcentaje_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    //Apis tarifa porcentaje cotizacion
    app.get("/lista-tarifa-porcentaje-cotizacion", (req, res) => {
        getlista_tarifa_porcentaje_cotizacion(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-porcentaje-cotizacion", (req, res) => {
        insertar_tarifa_porcentaje_cotizacion(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-porcentaje-cotizacion", (req, res) => {
        actualizar_tarifa_porcentaje_cotizacion(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-porcentaje-cotizacion", (req, res) => {
        eliminar_tarifa_porcentaje_cotizacion(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    //Apis tarifa cobertura
    app.get("/lista-tarifa-cobertura", (req, res) => {
        getlista_tarifa_cobertura(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-cobertura", (req, res) => {
        insertar_tarifa_cobertura(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-cobertura", (req, res) => {
        actualizar_tarifa_cobertura(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-cobertura", (req, res) => {
        eliminar_tarifa_cobertura(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    //Apis tarifa scalling
    app.get("/lista-tarifa-scalling", (req, res) => {
        getlista_tarifa_scalling(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-scalling", (req, res) => {
        insertar_tarifa_scalling(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-scalling", (req, res) => {
        actualizar_tarifa_scalling(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-scalling", (req, res) => {
        eliminar_tarifa_scalling(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    //Apis tarifa detalle
    app.get("/lista-tarifa-detalle", (req, res) => {
        getlista_tarifa_detalle(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-detalle", (req, res) => {
        insertar_tarifa_detalle(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-detalle", (req, res) => {
        actualizar_tarifa_detalle(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-detalle", (req, res) => {
        eliminar_tarifa_detalle(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    //Apis tarifa spot
    app.get("/lista-tarifa-spot", (req, res) => {
        getlista_tarifa_spot(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-spot", (req, res) => {
        insertar_tarifa_spot(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-spot", (req, res) => {
        actualizar_tarifa_spot(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-spot", (req, res) => {
        eliminar_tarifa_spot(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    app.post("/cargar-archivo-tarifa-spot", (req, res) => {
        cargar_archivo_spot(req)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    // Apis tarifa plantilla
    app.get("/lista-tarifa-plantilla", (req, res) => {
        getlista_plantillas(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-tarifa-plantilla", (req, res) => {
        insertar_plantilla(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-tarifa-plantilla", (req, res) => {
        actualizar_plantilla(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-tarifa-plantilla", (req, res) => {
        eliminar_plantilla(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    app.get("/recupera-datos-plantilla", (req, res) => {
        recupera_plantilla(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    // Apis tarifa plantilla rurbo
    app.get("/lista-plantilla-rubro", (req, res) => {
        getlista_plantilla_rubros(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-plantilla-rubro", (req, res) => {
        insertar_plantilla_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-plantilla-rubro", (req, res) => {
        actualizar_plantilla_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-plantilla-rubro", (req, res) => {
        eliminar_plantilla_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    // Apis tarifa plantilla criterio
    app.get("/lista-plantilla-criterio", (req, res) => {
        getlista_plantilla_criterios(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-plantilla-criterio", (req, res) => {
        insertar_plantilla_criterio(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-plantilla-criterio", (req, res) => {
        actualizar_plantilla_criterio(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-plantilla-criterio", (req, res) => {
        eliminar_plantilla_criterio(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 


    // GRUPOS RUBROS
    app.get("/lista-grupos-rubros", (req, res) => {
        getlista_grupos_rubro(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-grupos-rubros", (req, res) => {
        insertar_grupos_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-grupos-rubros", (req, res) => {
        actualizar_grupos_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-grupos-rubros", (req, res) => {
        eliminar_grupos_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    app.get("/recupera-datos-grupos", (req, res) => {
        recupera_datos_grupos_rubro(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    // ASIGNACION GRUPOS RUBROS
    app.get("/lista-asignacion-grupos-rubros", (req, res) => {
        getlista_grupo_rubro_asignacion(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-asignacion-grupos-rubros", (req, res) => {
        insertar_grupo_rubro_asignacion(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/asignacion-masiva-grupos-rubros", (req, res) => {
        traslado_asignacion_grupos_rubro(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-asignacion-grupos-rubros", (req, res) => {
        actualizar_grupo_rubro_asignacion(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-asignacion-grupos-rubros", (req, res) => {
        eliminar_grupo_rubro_asignacion(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 


    // CALCULO TARIFAS

    app.get("/calcular-tarifa", (req, res) => {
        calcular_tarifa_plantilla(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.get("/calcular-tarifa-interna", (req, res) => {
        calcular_tarifa_servicios({...req.query, interna: true})
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.get("/calcular-tarifa-rubros", (req, res) => {
        calcular_tarifa_servicios(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.get("/obtener-criterios", (req, res) => {
        obtener_criterios_especificos(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.get("/calcular-tarifa-scalling", (req, res) => {
        calcular_scalling_fee(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    // TARIFAS BITACORA
    app.get("/listar-tarifa-bitacora", (req, res) => {
        listar_tarifa_bitacora(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    //COMMODITY
    app.get("/lista-commodities", (req, res) => {
        getlista_commodity(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-commodity", (req, res) => {
        insertar_commodity(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-commodity", (req, res) => {
        actualizar_commodity(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-commodity", (req, res) => {
        eliminar_commodity(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    //METODO COMMODITY
    app.get("/lista-metodo-commodity", (req, res) => {
        getlista_metodocommodity(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/insertar-metodo-commodity", (req, res) => {
        insertar_metodocommodity(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/actualizar-metodo-commodity", (req, res) => {
        actualizar_metodocommodity(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    });

    app.post("/eliminar-metodo-commodity", (req, res) => {
        eliminar_metodocommodity(req.body)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    app.get("/report_hit_rate", (req, res) => {
        report_hit_rate(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    app.get("/report_kpi_cotizaciones", (req, res) => {
        report_kpi_cotizaciones(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    app.get("/report_realizacion_de_precio", (req, res) => {
        report_realizacion_de_precio(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

    app.get("/consultar_ultimas_tarifas", (req, res) => {
        consultar_ultimas_tarifas(req.query)
        .then((i) => {res.apiResponse(i)})
        .catch(e => res.apiResponse(undefined,e.message,404));
    }); 

}