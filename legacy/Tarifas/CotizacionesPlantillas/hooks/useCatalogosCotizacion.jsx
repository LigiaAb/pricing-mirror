import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../api";
import CODS_TIPOS_ENTIDAD, { NOMBRES_TIPOS_ENTIDAD } from "../../../../constants/tiposEntidades";
import { useFetchAllEntidadesSimple, useFetchEntidadIdentificaciones } from "../../../../hooks/Fetch/useFetchEntidades";
import { useFetchCentrosCosto, useFetchEmpresas, useFetchEstados, useFetchMonedas, useFetchPaises, useFetchRelacionTipo, useFetchTipos } from "../../../../hooks/Fetch/useFetchCatalog";
import { useFetchCriterios, useFetchIncoterms, useFetchPuntosEnlace, useFetchRubros, useFetchServicios } from "../../../../hooks/Fetch/useFetchTarifas";
import { useFetchEmpUsuPuesto } from "@/hooks/Fetch/useFetchConfiguracion";

const keysToLowerCase = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToLowerCase(item));
  }
  return Object.keys(obj).reduce((acc, key) => {
    const lowerCaseKey = key.toLowerCase();
    acc[lowerCaseKey] = keysToLowerCase(obj[key]);
    return acc;
  }, {});
};

const uniqueBy = (arr, prop) =>
  arr.reduce(
    (acc, item) => {
      if (!acc.map.has(item[prop])) {
        acc.map.add(item[prop]);
        acc.items.push(item);
      }
      return acc;
    },
    { map: new Set(), items: [] },
  ).items;

/**
 *
 * @param {*} param0
 * @returns
 * @description
 * CATALOGOS:
 * 1. EMPRESAS (URL: /api/appweb/listaempresas)
 * 2. CENTROS DE COSTO (URL: /api/appweb/listacentrocosto)
 * 3.q CLIENTES (URL SIMPLE: /api/appweb/lista-entidad-simplificada?cod_estado=1&tipo_entidad=CLIENTE&cod_estado=1)
 *   3.a.1. CONTACTOS (URL SIMPLE: /api/appweb/lista-entidad-contacto?cod_tipo=3&entidad_id=CLIENTE)
 * 3.b PRE-CLIENTE (URL SIMPLE: /api/appweb/lista-entidad-simplificada?cod_estado=1&tipo_entidad=PRECLIENTE&cod_estado=1)
 *   3.b.1. CONTACTOS (URL SIMPLE: /api/appweb/lista-entidad-contacto?cod_tipo=3&entidad_id=PRECLIENTE)
 * 3.C PROVEEDORES (URL SIMPLE: /api/appweb/lista-entidad-simplificada?cod_estado=1&tipo_entidad=PROVEEDOR&cod_estado=1)
 * 4. TIPO DE TRANSPORTE (URL: /api/appweb/lista-tipo?tipo_tabla=TRANSPORTE)
 * 5. TIPO DE SERVICIO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=SERVICIO)
 * 6. TIPO DE CARGA (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=CARGA)
 * 7. CLASIFICACION DE CARGA (URL: /api/appweb/lista-clasificaciones-carga)
 * 8. INCOTERMS (URL: /api/appweb/lista-incoterms)
 * 9. TIPO DE PAGO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=PAGO)
 * 10. PAISES (URL: /api/appweb/listapaises)
 * 11. TIPO DE PUNTO DE ENLACE (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=PUNTO_ENLACE)
 * 12. PUNTO DE ENLACE (URL: /api/appweb/listapuntoenlace)
 * 13. MONEDAS (URL: /api/appweb/lista-moneda)
 * 15. TIPO DE SEGUIMIENTO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=SEGUIMIENTO)
 * 16. TIPO DE CALCULO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=CALCULO)
 * 17. CRITERIOS (URL: /api/appweb/lista-criterios)
 * 18. ESTADOS (URL: /api/appweb/lista-estados)
 * 19. RUBROS (URL: /api/appweb/lista-rubros)
 *
 */ const useCatalogosCotizacion = ({ agregarTodos } = {}) => {
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const [isLoadingContactos, setIsLoadingContactos] = useState(false);
  const [isLoadingPlantilla, setIsLoadingPlantilla] = useState(false);
  const [isLoadingPlantillaRubros, setIsLoadingPlantillaRubros] = useState(false);
  const [contactosClientes, setContactosClientes] = useState([]);
  const [plantillasCliente, setPlantillasCliente] = useState([]);
  const [plantillasRubrosCliente, setPlantillasRubrosCliente] = useState([]);

  const empresasFetch = useFetchEmpresas();
  const centrosCostoFetch = useFetchCentrosCosto();
  const listaClientes = useFetchAllEntidadesSimple([NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE]], { tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE] }, {});
  const listaPreclientes = useFetchAllEntidadesSimple([NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_CLIENTE]], { tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_CLIENTE] }, {});
  const listaProveedores = useFetchAllEntidadesSimple([NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR]], { tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR] }, {});
  const listaEstaciones = useFetchAllEntidadesSimple([NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.DSV]], { tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.DSV] }, {});
  const listaEstacionesIdentificacion = useFetchEntidadIdentificaciones({ cod_tipo: CODS_TIPOS_ENTIDAD.DSV }, {});
  const tiposTransporteFetch = useFetchTipos({ tipo_tabla: "TRANSPORTE" });
  const tiposClasificacionServicioFetch = useFetchRelacionTipo({ tipo_tabla: "CLASIFICACION_SERVICIO", tipo_padre_tabla: "TRANSPORTE" });
  const tiposServicioFetch = useFetchRelacionTipo({ tipo_tabla: "SERVICIO" });
  const tiposCargaFetch = useFetchTipos({ tipo_tabla: "TIPO_CARGA" });
  const clasificacionesCargaFetch = useFetchTipos({ tipo_tabla: "CLASIFICACION_CARGA" });
  const incotermsFetch = useFetchIncoterms();
  const tiposPagoFetch = useFetchTipos({ tipo_tabla: "PAGO" });
  const paisesFetch = useFetchPaises();
  const tiposPuntoEnlaceFetch = useFetchTipos({ tipo_tabla: "PUNTO_ENLACE" });
  const puntosEnlaceFetch = useFetchPuntosEnlace();
  const monedasFetch = useFetchMonedas();
  const tiposSeguimientoFetch = useFetchTipos({ tipo_tabla: "SEGUIMIENTO" });
  const tiposCalculoFetch = useFetchTipos({ tipo_tabla: "CALCULO" });
  const criteriosFetch = useFetchCriterios();
  const categoriasTransporteFetch = useFetchTipos({ tipo_tabla: "CATEGORIA_TRANSPORTE" });
  const rubrosFetch = useFetchRubros({ cod_estado: 1 });
  const estadosFetch = useFetchEstados();
  const tiposAplicacionFetch = useFetchRelacionTipo({ tipo_tabla: "APLICACION", cod_estado: 1 });
  const metodosCalculoFetch = useFetchTipos({ tipo_tabla: "METODO" });
  const tiposTarifaFetch = useFetchTipos({ tipo_tabla: "TARIFA" });
  const tiposFetch = useFetchTipos();
  const serviciosFetch = useFetchServicios();
  const empleados = useFetchEmpUsuPuesto();

  const clientes = useMemo(() => [...(listaClientes.data?.data || []), ...(listaPreclientes.data?.data || [])], [listaClientes.data, listaPreclientes.data]);

  const isLoading = useMemo(
    () =>
      empresasFetch.isLoading ||
      centrosCostoFetch.isLoading ||
      listaClientes.isLoading ||
      listaPreclientes.isLoading ||
      listaProveedores.isLoading ||
      listaEstaciones.isLoading ||
      tiposTransporteFetch.isLoading ||
      tiposClasificacionServicioFetch.isLoading ||
      tiposServicioFetch.isLoading ||
      tiposCargaFetch.isLoading ||
      clasificacionesCargaFetch.isLoading ||
      incotermsFetch.isLoading ||
      tiposPagoFetch.isLoading ||
      paisesFetch.isLoading ||
      tiposPuntoEnlaceFetch.isLoading ||
      puntosEnlaceFetch.isLoading ||
      monedasFetch.isLoading ||
      tiposSeguimientoFetch.isLoading ||
      tiposCalculoFetch.isLoading ||
      criteriosFetch.isLoading ||
      categoriasTransporteFetch.isLoading ||
      rubrosFetch.isLoading ||
      estadosFetch.isLoading ||
      tiposAplicacionFetch.isLoading ||
      metodosCalculoFetch.isLoading ||
      tiposTarifaFetch.isLoading ||
      tiposFetch.isLoading ||
      empleados.isLoading ||
      serviciosFetch.isLoading ||
      // isLoadingPlantilla ||
      // isLoadingPlantillaRubros ||
      isLoadingClientes,
    [
      empresasFetch.isLoading,
      centrosCostoFetch.isLoading,
      listaClientes.isLoading,
      listaPreclientes.isLoading,
      listaProveedores.isLoading,
      listaEstaciones.isLoading,
      tiposTransporteFetch.isLoading,
      tiposClasificacionServicioFetch.isLoading,
      tiposServicioFetch.isLoading,
      tiposCargaFetch.isLoading,
      clasificacionesCargaFetch.isLoading,
      incotermsFetch.isLoading,
      tiposPagoFetch.isLoading,
      paisesFetch.isLoading,
      tiposPuntoEnlaceFetch.isLoading,
      puntosEnlaceFetch.isLoading,
      monedasFetch.isLoading,
      tiposSeguimientoFetch.isLoading,
      tiposCalculoFetch.isLoading,
      criteriosFetch.isLoading,
      categoriasTransporteFetch.isLoading,
      rubrosFetch.isLoading,
      estadosFetch.isLoading,
      tiposAplicacionFetch.isLoading,
      metodosCalculoFetch.isLoading,
      tiposTarifaFetch.isLoading,
      tiposFetch.isLoading,
      empleados.isLoading,
      serviciosFetch.isLoading,
      // isLoadingPlantilla,
      // isLoadingPlantillaRubros,
      isLoadingClientes,
    ],
  );
  // const ensureArray = (val) => (Array.isArray(val) ? val : []);

  const buildTodosOption = (valueTodos) => ({
    label: "TODOS",
    value: valueTodos,
  });

  const getConfigAgregarTodos = (agregarTodos, key) => {
    if (!agregarTodos) {
      return {
        aplicar: false,
        value: null,
      };
    }

    if (Array.isArray(agregarTodos)) {
      return {
        aplicar: agregarTodos.includes(key),
        value: null,
      };
    }

    const catalogos = agregarTodos?.catalogos || {};
    const tieneConfigPropia = Object.prototype.hasOwnProperty.call(catalogos, key);

    if (!tieneConfigPropia) {
      return {
        aplicar: false,
        value: agregarTodos?.default,
      };
    }

    const valorConfig = catalogos[key];

    return {
      aplicar: valorConfig !== false,
      value: valorConfig === true ? agregarTodos?.default : valorConfig,
    };
  };

  const generarCatalogoEntidad_DSV = useMemo(() => {
    const estacionesData = listaEstaciones.data?.data || [];
    const identificacionesData = listaEstacionesIdentificacion.data?.data || [];

    const estacionesConIdentificacion = estacionesData
      .map((estacion) => {
        const identificacion = identificacionesData.find((id) => id.entidad_id === estacion.entidad_id && id.nom_identificacion === "UBI_ORICODIGO");
        return {
          ...estacion,
          label: identificacion ? `[${identificacion.entidadidentificacio_numero}] - ${estacion.label}` : estacion.label,
          identificacion: identificacion || null,
        };
      })
      .reduce((acc, estacion) => {
        if (!acc.some((e) => e.identificacion?.entidadidentificacio_numero === estacion.identificacion?.entidadidentificacio_numero)) {
          acc.push(estacion);
        }

        return acc;
      }, []);

    return estacionesConIdentificacion;
  }, [listaEstaciones.data, listaEstacionesIdentificacion.data]);

  const agregarTodosACatalogo = useCallback((catalogo, key, agregarTodos) => {
    if (!Array.isArray(catalogo)) return catalogo;

    const config = getConfigAgregarTodos(agregarTodos, key);

    if (!config.aplicar) return catalogo;

    const yaExiste = catalogo.some((i) => i?.label === "TODOS");

    if (yaExiste) return catalogo;

    return [buildTodosOption(config.value), ...catalogo];
  }, []);

  const catalogos = useMemo(() => {
    const base = {
      empresas: empresasFetch.data,
      centrosCosto: centrosCostoFetch.data,
      tiposTransporte: tiposTransporteFetch.data,
      tiposClasificacionServicio: tiposClasificacionServicioFetch.data,
      tiposServicio: tiposServicioFetch.data,
      tiposCarga: tiposCargaFetch.data,
      clasificacionesCarga: clasificacionesCargaFetch.data,
      incoterms: incotermsFetch.data,
      tiposPago: tiposPagoFetch.data,
      paises: paisesFetch.data,
      tiposPuntoEnlace: tiposPuntoEnlaceFetch.data,
      puntosEnlace: puntosEnlaceFetch.data,
      monedas: monedasFetch.data,
      tiposSeguimiento: tiposSeguimientoFetch.data,
      tiposCalculo: tiposCalculoFetch.data,
      criterios: criteriosFetch.data,
      categoriasTransporte: categoriasTransporteFetch.data,
      rubros: rubrosFetch.data,
      estados: estadosFetch.data,
      tiposAplicacion: tiposAplicacionFetch.data,
      metodosCalculo: metodosCalculoFetch.data,
      tiposTarifa: tiposTarifaFetch.data,
      tipos: tiposFetch.data,
      servicios: serviciosFetch.data,
      empleados: empleados.data,
      clientes,
      proveedores: listaProveedores.data?.data || [],
      estaciones: generarCatalogoEntidad_DSV || [],
    };

    return Object.keys(base).reduce((acc, key) => {
      acc[key] = agregarTodosACatalogo(base[key], key, agregarTodos);
      return acc;
    }, {});
  }, [
    empresasFetch.data,
    centrosCostoFetch.data,
    tiposTransporteFetch.data,
    tiposClasificacionServicioFetch.data,
    tiposServicioFetch.data,
    tiposCargaFetch.data,
    clasificacionesCargaFetch.data,
    incotermsFetch.data,
    tiposPagoFetch.data,
    paisesFetch.data,
    tiposPuntoEnlaceFetch.data,
    puntosEnlaceFetch.data,
    monedasFetch.data,
    tiposSeguimientoFetch.data,
    tiposCalculoFetch.data,
    criteriosFetch.data,
    categoriasTransporteFetch.data,
    rubrosFetch.data,
    estadosFetch.data,
    tiposAplicacionFetch.data,
    metodosCalculoFetch.data,
    tiposTarifaFetch.data,
    tiposFetch.data,
    serviciosFetch.data,
    empleados.data,
    clientes,
    listaProveedores.data?.data,
    generarCatalogoEntidad_DSV,
    agregarTodosACatalogo,
    agregarTodos,
  ]);

  const obtenerPlantillaDeCliente = useCallback(async ({ entidad_id, cod_emp, cod_cc }) => {
    setIsLoadingPlantilla(true);
    try {
      const response = await api.get(`/api/appweb/lista-tarifa-plantilla`, { params: { entidad_id, cod_emp, cod_cc, cod_estado: 1 } });
      const plantilla = (response.data?.data || []).map((c) => ({ ...c, label: `${c.descripcion}`, value: c.cod_tarifaplantilla }));
      setPlantillasCliente(plantilla);

      return plantilla;
    } catch (error) {
      console.error("Error al obtener la plantilla del cliente:", error);
      throw error;
    } finally {
      setIsLoadingPlantilla(false);
    }
  }, []);

  const clearPlantillasCliente = useCallback(() => {
    setPlantillasCliente([]);
  }, []);

  const obtenerPlantillaRubrosDeCliente = useCallback(async ({ cod_tarifaplantilla }) => {
    setIsLoadingPlantillaRubros(true);
    try {
      const response = await api.get(`/api/appweb/lista-plantilla-rubro`, { params: { cod_tarifaplantilla, cod_estado: 1 } });
      const plantilla = (response.data?.data || []).map((c) => ({ ...c, label: `${c.descripcion}`, value: c.cod_tarifaplantilla }));
      setPlantillasRubrosCliente(plantilla);

      return plantilla;
    } catch (error) {
      console.error("Error al obtener la plantilla del cliente:", error);
      throw error;
    } finally {
      setIsLoadingPlantillaRubros(false);
    }
  }, []);

  const clearPlantillasRubrosCliente = useCallback(() => {
    setPlantillasRubrosCliente([]);
  }, []);

  const obtenerContactosDeEntidad = useCallback(async ({ cod_tipo, entidad_id, cod_emp, cod_cc }) => {
    setIsLoadingContactos(true);
    try {
      const response = await api.get(`/api/appweb/lista-entidad-contacto`, { params: { cod_tipo, entidad_id, cod_emp: cod_emp?.cod_empresa ?? cod_emp, cod_cc } });
      const contactos = (response.data?.data?.data || []).map((c) => ({ ...c, label: `${c.entidadcontacto_nombre} - ${c.entidadcontacto_email}`, value: c.entidadcontacto_id }));
      setContactosClientes(contactos);

      return contactos;
    } catch (error) {
      console.error("Error al obtener los contactos de la entidad:", error);
      throw error;
    } finally {
      setIsLoadingContactos(false);
    }
  }, []);

  const fetchOptionsClientes = useCallback(async (searchTerm = "", filterId) => {
    return await api
      .get("api/appweb/busqueda-entidad-x-criterio", {
        params: {
          ref_busqueda: searchTerm,
          list_descripcion_tipo: [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_CLIENTE], NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE]],
          tipo_busqueda: "NOMBRE",
        },
      })
      .then(({ data }) => {
        const eliminarDuplicadosById = (arr, id) => {
          return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
        };

        const filterById = (item, id, value) => {
          if (Array.isArray(value)) return value.includes(item[id]);
          else if (typeof value === "string") return item[id] === value;
        };

        return eliminarDuplicadosById(keysToLowerCase(data.data.data), "entidad_id")
          .map((i) => ({ ...i, label: `${i.entidad_nombre}`, value: i.entidad_id }))
          .filter((i) => !filterById(i, "entidad_id", filterId));
      })
      .catch((e) => {
        console.error(e);
        return [];
      });
  }, []);

  const fetchOptionsEstaciones = useCallback(async (searchTerm = "", filterId) => {
    return await api
      .get("api/appweb/busqueda-entidad-x-criterio", {
        params: { ref_busqueda: searchTerm, identificacion: "UBI_ORICODIGO", list_descripcion_tipo: [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.DSV]], tipo_busqueda: "IDENTIFICACION" },
      })
      .then(({ data }) => {
        const eliminarDuplicadosById = (arr, id) => {
          return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
        };

        const filterById = (item, id, value) => {
          if (Array.isArray(value)) return value.includes(item[id]);
          else if (typeof value === "string") return item[id] === value;
        };

        return eliminarDuplicadosById(keysToLowerCase(data.data.data), "entidad_id")
          .map((i) => ({ ...i, label: `${i.entidad_nombre}`, value: i.entidad_id }))
          .filter((i) => !filterById(i, "entidad_id", filterId));
      })
      .catch((e) => {
        console.error(e);
        return [];
      });
  }, []);

  const fetchOptionsProveedores = useCallback(async (searchTerm = "") => {
    return await api
      .get("api/appweb/busqueda-entidad-x-criterio", {
        params: {
          ref_busqueda: searchTerm,
          list_descripcion_tipo: [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR]],
          tipo_busqueda: "NOMBRE",
        },
      })
      .then(({ data }) => {
        const eliminarDuplicadosById = (arr, id) => {
          return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
        };

        return eliminarDuplicadosById(keysToLowerCase(data.data.data), "entidad_id").map((i) => ({ ...i, label: `${i.entidad_nombre}`, value: i.entidad_id }));
      })
      .catch((e) => {
        console.error(e);
        return [];
      });
  }, []);

  const fetchMetodoCalculoByServicio = useCallback(async (cod_servicio, cod_metodo_calculo = null) => {
    return await api
      .get("api/appweb/lista-metodos", { params: { cod_estado: 1, cod_metodo: cod_metodo_calculo, cod_servicio } })
      .then(({ data }) => {
        if (data.data[0]) return { data: data.data[0], esNuevo: false };
        else return { data: data.data[0] || {}, esNuevo: true };
      })
      .catch((e) => console.error(e));
  }, []);

  return useMemo(
    () => ({
      catalogos,
      contactos: contactosClientes,
      plantillas: plantillasCliente,
      plantillasRubros: plantillasRubrosCliente,
      isLoading,
      obtenerContactosDeEntidad,
      fetchOptionsClientes,
      fetchOptionsEstaciones,
      fetchMetodoCalculoByServicio,
      isLoadingContactos,
      obtenerPlantillaDeCliente,
      clearPlantillasCliente,
      obtenerPlantillaRubrosDeCliente,
      clearPlantillasRubrosCliente,
    }),
    [
      catalogos,
      isLoading,
      obtenerContactosDeEntidad,
      fetchOptionsClientes,
      fetchOptionsEstaciones,
      fetchMetodoCalculoByServicio,
      isLoadingContactos,
      contactosClientes,
      obtenerPlantillaDeCliente,
      plantillasCliente,
      clearPlantillasCliente,
      obtenerPlantillaRubrosDeCliente,
      clearPlantillasRubrosCliente,
      plantillasRubrosCliente,
    ],
  );
};

export default useCatalogosCotizacion;
