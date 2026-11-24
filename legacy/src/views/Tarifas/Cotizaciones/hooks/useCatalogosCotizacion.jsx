import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../api";
import CODS_TIPOS_ENTIDAD, { NOMBRES_TIPOS_ENTIDAD } from "../../../../constants/tiposEntidades";
import { useFetchAllEntidadesSimple, useFetchAllEntidadesSimplePaginada, useFetchEntidadIdentificaciones, useFetchEntidadNombresTipos } from "../../../../hooks/Fetch/useFetchEntidades";
import {
  useFetchCentrosCosto,
  useFetchCiudades,
  useFetchEmpresas,
  useFetchEstados,
  useFetchMonedas,
  useFetchPaises,
  useFetchRelacionTipo,
  useFetchTipos,
  useFetchUsuarios,
} from "../../../../hooks/Fetch/useFetchCatalog";
import { useFetchCriterios, useFetchIncoterms, useFetchMetodo, useFetchPuntosEnlace, useFetchRubros, useFetchServicios } from "../../../../hooks/Fetch/useFetchTarifas";
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

const eliminarDuplicadosById = (arr, id) => {
  return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
};
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
  const [isLoadingEntidad, setIsLoadingEntidad] = useState(false);
  const [isLoadingPlantilla, setIsLoadingPlantilla] = useState(false);
  const [isLoadingPlantillaRubros, setIsLoadingPlantillaRubros] = useState(false);
  const [contactosClientes, setContactosClientes] = useState([]);
  const [plantillasCliente, setPlantillasCliente] = useState([]);
  const [plantillasRubrosCliente, setPlantillasRubrosCliente] = useState([]);

  const empresasFetch = useFetchEmpresas();
  const centrosCostoFetch = useFetchCentrosCosto();
  const listaClientes = useFetchAllEntidadesSimplePaginada(
    [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE]],
    { datosxpagina: 50, tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE] },
    {},
    undefined,
    1,
  );
  const listaPreclientes = useFetchAllEntidadesSimplePaginada(
    [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_CLIENTE]],
    { datosxpagina: 50, tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_CLIENTE] },
    {},
    undefined,
    1,
  );
  const listaProveedores = useFetchAllEntidadesSimplePaginada(
    [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR]],
    { datosxpagina: 50, tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR] },
    {},
    undefined,
    1,
  );
  const listaEstaciones = useFetchAllEntidadesSimplePaginada(
    [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.DSV]],
    { datosxpagina: 50, tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.DSV] },
    {},
    undefined,
    1,
  );
  const listaProveedoresNombreTipo = useFetchEntidadNombresTipos({ tipo_nombre: 298 /* "CARRIER" */, tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR] });
  const listaEstacionesIdentificacion = useFetchEntidadIdentificaciones({ cod_tipo: CODS_TIPOS_ENTIDAD.DSV }, {});
  const tiposTransporteFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "TRANSPORTE" });
  const tiposClasificacionServicioFetch = useFetchRelacionTipo({ tipo_tabla: "CLASIFICACION_SERVICIO", tipo_padre_tabla: "TRANSPORTE" });
  const serviciosFetch = useFetchServicios({ cod_estado: 1 });
  const metodosFetch = useFetchMetodo({ cod_estado: 1 });
  const tiposServicioFetch = useFetchRelacionTipo({ tipo_tabla: "SERVICIO" });
  const tiposCargaFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "TIPO_CARGA" });
  const clasificacionesCargaFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "CLASIFICACION_CARGA" });
  const incotermsFetch = useFetchIncoterms();
  const tiposPagoFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "PAGO" });
  const paisesFetch = useFetchPaises();
  const tiposPuntoEnlaceFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "PUNTO_ENLACE" });
  const puntosEnlaceFetch = useFetchPuntosEnlace();
  const monedasFetch = useFetchMonedas();
  const tiposSeguimientoFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "SEGUIMIENTO" });
  const tiposCalculoFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "CALCULO" });
  const criteriosFetch = useFetchCriterios();
  const categoriasTransporteFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "CATEGORIA_TRANSPORTE" });
  const rubrosFetch = useFetchRubros({ cod_estado: 1 });
  const estadosFetch = useFetchEstados();
  const tiposAplicacionFetch = useFetchRelacionTipo({ tipo_tabla: "APLICACION", cod_estado: 1 });
  const metodosCalculoFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "METODO" });
  const tiposTarifaFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "TARIFA" });
  const tiposReasonCodeSpotFetch = useFetchTipos({ cod_estado: 1, tipo_tabla: "REASON_CODE_SPOT" });
  const tiposFetch = useFetchTipos({ cod_estado: 1 });
  const ciudadFetch = useFetchCiudades({ cod_estado: 1 });
  const empleados = useFetchEmpUsuPuesto();

  const clientes = useMemo(
    () =>
      [...(listaClientes.data?.data || []), ...(listaPreclientes.data?.data || [])]
        .sort((a, b) => a.label.localeCompare(b.label))
        .filter((i) => i.label.trim().replace(".", "").length)
        .reduce((acum, curr) => {
          if (acum.some((i) => i.value === curr.value)) return acum;
          acum.push(curr);
          return acum;
        }, []),
    [listaClientes.data, listaPreclientes.data],
  );

  const solo_clientes = useMemo(
    () =>
      (listaClientes.data?.data || [])
        .sort((a, b) => a.label.localeCompare(b.label))
        .filter((i) => i.label.trim().replace(".", "").length)
        .reduce((acum, curr) => {
          if (acum.some((i) => i.value === curr.value)) return acum;
          acum.push(curr);
          return acum;
        }, []),
    [listaClientes.data],
  );

  const proveedores = useMemo(
    () =>
      [...(listaProveedores.data?.data || [])]
        .sort((a, b) => a.label.localeCompare(b.label))
        .filter((i) => i.label.trim().replace(".", "").length)
        .reduce((acum, curr) => {
          if (acum.some((i) => i.value === curr.value)) return acum;
          acum.push(curr);
          return acum;
        }, []),
    [listaProveedores.data],
  );
  const proveedoresNombre = useMemo(
    () =>
      [...(listaProveedoresNombreTipo.data?.data || [])]
        .map((a) => ({ ...a, label: a.nombre ?? a.entidad_nombre, value: a.entidad_id }))
        .sort((a, b) => a.label.localeCompare(b.label))
        .filter((i) => i.label.trim().replace(".", "").length)
        .reduce((acum, curr) => {
          if (acum.some((i) => i.value === curr.value)) return acum;
          acum.push(curr);
          return acum;
        }, []),
    [listaProveedoresNombreTipo.data],
  );

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
      tiposReasonCodeSpotFetch.isLoading ||
      serviciosFetch.isLoading ||
      metodosFetch.isLoading ||
      listaProveedoresNombreTipo.isLoading ||
      ciudadFetch.isLoading ||
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
      tiposReasonCodeSpotFetch.isLoading,
      serviciosFetch.isLoading,
      metodosFetch.isLoading,
      listaProveedoresNombreTipo.isLoading,
      ciudadFetch.isLoading,
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

  const filtrarActivos = (i) => {
    if (!i.cod_estado) return true;

    return i.cod_estado === 1;
  };

  const catalogos = useMemo(() => {
    const base = {
      empresas: (empresasFetch.data || []).filter(filtrarActivos),
      centrosCosto: (centrosCostoFetch.data || []).filter(filtrarActivos),
      tiposTransporte: (tiposTransporteFetch.data || []).filter(filtrarActivos),
      tiposClasificacionServicio: (tiposClasificacionServicioFetch.data || []).filter(filtrarActivos),
      tiposServicio: (tiposServicioFetch.data || []).filter(filtrarActivos),
      tiposCarga: (tiposCargaFetch.data || []).filter(filtrarActivos),
      clasificacionesCarga: (clasificacionesCargaFetch.data || []).filter(filtrarActivos),
      incoterms: (incotermsFetch.data || []).filter(filtrarActivos),
      tiposPago: (tiposPagoFetch.data || []).filter(filtrarActivos),
      paises: (paisesFetch.data || []).filter(filtrarActivos),
      tiposPuntoEnlace: (tiposPuntoEnlaceFetch.data || []).filter(filtrarActivos),
      puntosEnlace: (puntosEnlaceFetch.data || []).filter(filtrarActivos),
      monedas: (monedasFetch.data || []).filter(filtrarActivos),
      tiposSeguimiento: (tiposSeguimientoFetch.data || []).filter(filtrarActivos),
      tiposCalculo: (tiposCalculoFetch.data || []).filter(filtrarActivos),
      criterios: (criteriosFetch.data || []).filter(filtrarActivos),
      categoriasTransporte: (categoriasTransporteFetch.data || []).filter(filtrarActivos),
      rubros: (rubrosFetch.data || []).filter(filtrarActivos),
      estados: (estadosFetch.data || []).filter(filtrarActivos),
      tiposAplicacion: (tiposAplicacionFetch.data || []).filter(filtrarActivos),
      metodosCalculo: (metodosCalculoFetch.data || []).filter(filtrarActivos),
      tiposTarifa: (tiposTarifaFetch.data || []).filter(filtrarActivos),
      tipos: (tiposFetch.data || []).filter(filtrarActivos),
      empleados: (empleados.data || []).filter(filtrarActivos),
      servicios: (serviciosFetch.data || []).filter(filtrarActivos),
      reasonCodeSpot: (tiposReasonCodeSpotFetch.data || []).filter(filtrarActivos),
      metodos: (metodosFetch.data || []).filter(filtrarActivos),
      proveedoresNombre: (proveedoresNombre || []).filter(filtrarActivos),
      ciudades: (ciudadFetch.data || []).filter(filtrarActivos).map((i) => ({ ...i, label: `[${i.siglas_ciudad ?? ""}] ${i.label.toUpperCase()}` })),
      clientes,
      proveedores,
      estaciones: generarCatalogoEntidad_DSV || [],
      solo_clientes,
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
    empleados.data,
    serviciosFetch.data,
    tiposReasonCodeSpotFetch.data,
    metodosFetch.data,
    ciudadFetch.data,
    proveedoresNombre,
    clientes,
    proveedores,
    generarCatalogoEntidad_DSV,
    agregarTodosACatalogo,
    agregarTodos,
    solo_clientes,
  ]);

  const obtenerEntidadById = useCallback(async ({ entidad_id, tipos = [] }) => {
    setIsLoadingEntidad(true);
    try {
      // console.log("Obteniendo entidad por ID:", entidad_id);

      if (!entidad_id) return null;

      const apis = tipos.map((tipo) => {
        return api.get(`/api/appweb/lista-entidad-simplificada`, {
          params: { cod_estado: 1, id_entidad: entidad_id, entidad_id, tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD[tipo]] },
        });
      });

      const responses = await Promise.all(apis);

      const allEntidades = eliminarDuplicadosById(keysToLowerCase(responses.flatMap((response) => response.data?.data?.data || [])), "entidad_id");
      let entidad = null;

      if (allEntidades.length === 0) return null;
      if (allEntidades.length > 1) {
        entidad = allEntidades.find((c) => c.entidad_id === entidad_id) ?? null;
      } else {
        entidad = allEntidades[0] ?? null;
      }

      // console.log("Entidad obtenida:", entidad);

      if (!entidad) return null;

      return { ...entidad, label: entidad.entidad_nombre ?? "", value: entidad.entidad_id };
    } catch (error) {
      console.error("Error al obtener la entidad:", error);
      throw error;
    } finally {
      setIsLoadingEntidad(false);
    }
  }, []);

  const obtenerProveedorById = useCallback(
    async ({ entidad_id }) => {
      try {
        return await obtenerEntidadById({ entidad_id, tipos: ["PROVEEDOR", "PRE_PROVEEDOR"] });
      } catch (error) {
        console.error("Error al obtener el proveedor:", error);
        throw error;
      }
    },
    [obtenerEntidadById],
  );

  const obtenerClienteById = useCallback(
    async ({ entidad_id }) => {
      try {
        return await obtenerEntidadById({ entidad_id, tipos: ["PRE_CLIENTE", "CLIENTE"] });
      } catch (error) {
        console.error("Error al obtener el cliente:", error);
        throw error;
      }
    },
    [obtenerEntidadById],
  );

  const obtenerEstacionById = useCallback(
    async ({ entidad_id }) => {
      try {
        return await obtenerEntidadById({ entidad_id, tipos: ["DSV"] });
      } catch (error) {
        console.error("Error al obtener la estacion:", error);
        throw error;
      }
    },
    [obtenerEntidadById],
  );

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
      if (!entidad_id) return [];
      if (!cod_tipo) return [];

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

  const fetchOptionsProveedores = useCallback(async (searchTerm = "", filterId) => {
    return await api
      .get("api/appweb/busqueda-entidad-x-criterio", {
        params: {
          ref_busqueda: searchTerm,
          list_descripcion_tipo: [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR]],
          tipo_busqueda: "NOMBRE",
        },
      })
      .then(({ data }) => {
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
      isLoadingEntidad,
      obtenerContactosDeEntidad,
      fetchOptionsClientes,
      fetchOptionsProveedores,
      fetchOptionsEstaciones,
      fetchMetodoCalculoByServicio,
      isLoadingContactos,
      obtenerPlantillaDeCliente,
      clearPlantillasCliente,
      obtenerPlantillaRubrosDeCliente,
      clearPlantillasRubrosCliente,
      obtenerClienteById,
      obtenerProveedorById,
      obtenerEstacionById,
      serviciosFetch,
      metodosFetch,
    }),
    [
      catalogos,
      isLoading,
      isLoadingEntidad,
      obtenerContactosDeEntidad,
      fetchOptionsClientes,
      fetchOptionsProveedores,
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
      obtenerClienteById,
      obtenerProveedorById,
      obtenerEstacionById,
      serviciosFetch,
      metodosFetch,
    ],
  );
};

export default useCatalogosCotizacion;
