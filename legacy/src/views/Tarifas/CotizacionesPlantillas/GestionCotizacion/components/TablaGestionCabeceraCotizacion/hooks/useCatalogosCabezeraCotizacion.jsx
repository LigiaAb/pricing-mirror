import { useState, useEffect, useCallback } from "react";
import { api } from "../../../../../../../api";
import { CODS_ESTADOS } from "../../../../../../../constants/estados";

const useCatalogosCabezeraCotizacion = ({
  empresas = [],
  centrosCostos = [],
  rubros = [],
  tiposServicio = [],
  tiposTransporte = [],
  tiposAplicacion = [],
  proveedores = [],
  tiposCalculo = [],
  estados = [],
  tiposTarifa = [],
  tiposMetodo = [],
  tiposCarga = [],
  clasificacionesCarga = [],
  incoterms = [],
  tiposPago = [],
}) => {
  const ensureArray = (val) => (Array.isArray(val) ? val : []);
  const [catalogos, setCatalogos] = useState({
    empresas: ensureArray(empresas),
    centrosCostos: ensureArray(centrosCostos),
    rubros: ensureArray(rubros),
    tiposServicio: ensureArray(tiposServicio),
    tiposTransporte: ensureArray(tiposTransporte),
    tiposAplicacion: ensureArray(tiposAplicacion),
    proveedores: ensureArray(proveedores),
    tiposCalculo: ensureArray(tiposCalculo),
    estados: ensureArray(estados),
    tiposTarifa: ensureArray(tiposTarifa),
    tiposMetodo: ensureArray(tiposMetodo),
    tiposCarga: ensureArray(tiposCarga),
    clasificacionesCarga: ensureArray(clasificacionesCarga),
    incoterms: ensureArray(incoterms),
    tiposPago: ensureArray(tiposPago),
  });

  const [isLoading, setIsLoading] = useState(false);

  const obtenerEmpresas = useCallback(async (empresasProvistas = []) => {
    if (empresasProvistas.length) return empresasProvistas;
    const baseApiURL = "/api/appweb/listaempresas";
    const response = await api.get(baseApiURL, { params: { cod_estado: CODS_ESTADOS.ACTIVO } });
    let empresas = response.data.data;
    empresas = empresas.map((e) => ({ ...e, label: e.nombre_emp, value: e.cod_empresa }));
    return empresas;
  }, []);

  const obtenerCentrosCostos = useCallback(async (centrosCostosProvistos = []) => {
    if (centrosCostosProvistos.length) return centrosCostosProvistos;
    const baseApiURL = "/api/appweb/listacentrocosto";
    const response = await api.get(baseApiURL);
    let centrosCostos = response.data.data;
    centrosCostos = centrosCostos.map((e) => ({ ...e, label: e.nombre_cc, value: e.cod_cc }));
    return centrosCostos;
  }, []);

  const obtenerTiposTransporte = useCallback(async (tiposTransporteProvistos = []) => {
    if (tiposTransporteProvistos.length) return tiposTransporteProvistos;
    const baseApiURL = "/api/appweb/lista-tipo";
    const response = await api.get(baseApiURL, { params: { tipo_tabla: "TRANSPORTE" } });
    let tiposTransporte = response.data.data;
    tiposTransporte = tiposTransporte.map((t) => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
    return tiposTransporte;
  }, []);

  const obtenerTiposServicio = useCallback(async (tiposServicioProvistos = []) => {
    if (tiposServicioProvistos.length) return tiposServicioProvistos;
    const baseApiURL = "/api/appweb/lista-relacion-tipo";
    const response = await api.get(baseApiURL, { params: { tipo_tabla: "SERVICIO" } });
    let tiposServicio = response.data.data;
    tiposServicio = tiposServicio.map((t) => ({ ...t, label: t.tipo_desc, value: t.cod_tipo }));
    return tiposServicio;
  }, []);

  const obtenerTiposCarga = useCallback(async (tiposCargaProvistos = []) => {
    if (tiposCargaProvistos.length) return tiposCargaProvistos;
    const baseApiURL = "/api/appweb/lista-tipo";
    const response = await api.get(baseApiURL, { params: { tipo_tabla: "TIPO_CARGA" } });
    let tiposCarga = response.data.data;
    tiposCarga = tiposCarga.map((t) => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
    return tiposCarga;
  }, []);

  const obtenerTiposPago = useCallback(async (tiposCargaProvistos = []) => {
    if (tiposCargaProvistos.length) return tiposCargaProvistos;
    const baseApiURL = "/api/appweb/lista-tipo";
    const response = await api.get(baseApiURL, { params: { tipo_tabla: "TIPO_PAGO" } });
    let tiposPago = response.data.data;
    tiposPago = tiposPago.map((t) => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
    return tiposPago;
  }, []);

  const obtenerClasificacionesCarga = useCallback(async (clasificacionesCargaProvistas = []) => {
    if (clasificacionesCargaProvistas.length) return clasificacionesCargaProvistas;
    const baseApiURL = "/api/appweb/lista-tipo";
    const response = await api.get(baseApiURL, { params: { tipo_tabla: "CLASIFICACION_CARGA" } });
    let clasificacionesCarga = response.data.data;
    clasificacionesCarga = clasificacionesCarga.map((t) => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
    return clasificacionesCarga;
  }, []);

  const obtenerPaises = useCallback(async (paisesProvistos = []) => {
    if (paisesProvistos.length) return paisesProvistos;
    const baseApiURL = "/api/appweb/listapaises";
    const response = await api.get(baseApiURL);
    let paises = response.data.data;
    paises = paises.map((p) => ({ ...p, label: p.nombre_pais, value: p.cod_pais }));
    return paises;
  }, []);

  const obtenerTiposPuntoEnlace = useCallback(async (tiposPuntoEnlaceProvistos = []) => {
    if (tiposPuntoEnlaceProvistos.length) return tiposPuntoEnlaceProvistos;
    const baseApiURL = "/api/appweb/lista-tipo";
    const response = await api.get(baseApiURL, { params: { tipo_tabla: "PUNTO_ENLACE" } });
    let tiposPuntoEnlace = response.data.data;
    tiposPuntoEnlace = tiposPuntoEnlace.map((tpe) => ({ ...tpe, label: tpe.nom_tipo, value: tpe.cod_tipo }));
    return tiposPuntoEnlace;
  }, []);

  const obtenerPuntosEnlace = useCallback(async (puntosEnlaceProvistos = []) => {
    if (puntosEnlaceProvistos.length) return puntosEnlaceProvistos;
    const baseApiURL = "/api/appweb/lista-punto_enlace";
    const response = await api.get(baseApiURL);
    let puntosEnlace = response.data.data;
    puntosEnlace = puntosEnlace.map((pe) => ({ ...pe, label: pe.nombre, value: pe.cod_puntoenlace }));
    return puntosEnlace;
  }, []);

  const obtenerEstados = useCallback(async (estadosProvistos = []) => {
    if (estadosProvistos.length > 0) return estadosProvistos;
    const baseApiURL = "/api/appweb/listaestados";
    const response = await api.get(baseApiURL);
    let estados = response.data.data;
    estados = estados.map((e) => ({ ...e, label: e.estado_desc, value: e.cod_estado }));
    return estados;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [empresas, centrosCostos, tiposTransporte, tiposServicio, tiposCarga, tiposPago, clasificacionesCarga, paises, tiposPuntoEnlace, puntosEnlace, estados] = await Promise.all([
          obtenerEmpresas(catalogos.empresas),
          obtenerCentrosCostos(catalogos.centrosCostos),
          obtenerTiposTransporte(catalogos.tiposTransporte),
          obtenerTiposServicio(catalogos.tiposServicio),
          obtenerTiposCarga(catalogos.tiposCarga),
          obtenerTiposPago(catalogos.tiposPago),
          obtenerClasificacionesCarga(catalogos.clasificacionesCarga),
          obtenerPaises(catalogos.paises),
          obtenerTiposPuntoEnlace(catalogos.tiposPuntoEnlace),
          obtenerPuntosEnlace(catalogos.puntosEnlace),
          obtenerEstados(catalogos.estados),
        ]);

        setCatalogos({
          empresas,
          centrosCostos,
          tiposTransporte,
          tiposServicio,
          tiposCarga,
          tiposPago,
          clasificacionesCarga,
          paises,
          tiposPuntoEnlace,
          puntosEnlace,
          estados,
        });
      } catch (error) {
        console.error("Error al cargar los catálogos de cabecera de cotización:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    ...catalogos,
    isLoading,
  };
};

export default useCatalogosCabezeraCotizacion;
