import { useCallback } from 'react';
import { api } from '../../../api';

const useFetchersCatalogosReporte = () => {
  const obtenerEmpresas = useCallback(async () => {
    const baseApiURL = '/api/appweb/listaempresas';
    const response = await api.get(baseApiURL);
    let empresas = response.data.data;
    empresas = empresas.map(e => ({ ...e, label: e.nombre_emp, value: e.cod_empresa }));
    return empresas;
  }, []);

  const obtenerCentrosCostos = useCallback(async () => {
    const baseApiURL = '/api/appweb/listacentrocosto';
    const response = await api.get(baseApiURL);
    let centrosCostos = response.data.data;
    centrosCostos = centrosCostos.map(cc => ({ ...cc, label: cc.nombre_cc, value: cc.cod_cc }));
    return centrosCostos;
  }, []);

  const obtenerTiposAsignacion = useCallback(async () => {
    const baseApiURL = '/api/appweb/lista-tipo';
    const response = await api.get(baseApiURL, {  params: { tipo_tabla: 'ASIGNACION_ENTIDAD' } });
    let tiposAsignacion = response.data.data;
    tiposAsignacion = tiposAsignacion.map(ta => ({ ...ta, label: ta.nom_tipo, value: ta.cod_tipo }));
    return tiposAsignacion;
  }, []);

  const obtenerPeriodicidades = useCallback(async () => {
    const baseApiURL = '/api/appweb/lista-periodicidad';
    const response = await api.get(baseApiURL);
    const periodicidades = response.data.data;
    return periodicidades;
  }, []);

  return {
    obtenerEmpresas,
    obtenerCentrosCostos,
    obtenerTiposAsignacion,
    obtenerPeriodicidades
  }
};

export default useFetchersCatalogosReporte;