import { api } from "../../api";
import useCustomQuery from "./useCustomQuery";
import { createAllPagedEntityDataHook, createDataHook } from "./useFunctions";

const defaultOptions = { staleTime: 1000 * 60 * 10 };

// Hook para obtener continentes
export const useFetchContinentes = createDataHook(["continentes"], "/api/appweb/listacontinente", (c) => ({ ...c, label: c.continente_nombre, value: c.cod_continente }));
// Hook para obtener paises
export const useFetchPaises = createDataHook(["paises"], "/api/appweb/listapaises", (p) => ({ ...p, label: p.nombre_pais, value: p.cod_pais }));
// Hook para obtener ciudades
export const useFetchCiudades = createDataHook(["ciudades"], "/api/appweb/lista-ciudad", (c) => ({ ...c, label: c.nombre_ciudad, value: c.cod_ciudad }));
// Hook para obtener industrias
export const useFetchIndustrias = createDataHook(["industrias"], "/api/appweb/lista-industria", (i) => ({ ...i, label: i.NOM_INDUSTRIA_ES, value: i.COD_INDUSTRIA }));
// Hook para obtener empresas
export const useFetchEmpresas = createDataHook("empresas", "/api/appweb/listaempresas", (e) => ({ ...e, label: e.nombre_emp, value: e.cod_empresa }));
// Hook para obtener tipos de tarifa
export const useFetchCentrosCosto = createDataHook("centros-costo", "api/appweb/listacentrocosto", (e) => ({ ...e, label: e.nombre_cc, value: e.cod_cc }));
// Hook para obtener tipos
export const useFetchTipos = createDataHook("tipos", "api/appweb/lista-tipo", (e) => ({ ...e, label: e.nom_tipo, value: e.cod_tipo }));
// Hook para obtener relacion-tipo
export const useFetchRelacionTipo = createDataHook("relacion-tipo", `/api/appweb/lista-relacion-tipo`, (e) => ({ ...e, label: e.tipo_desc, value: e.cod_tipo }));
// Hook para obtener incoterms
export const useFetchUsuarios = createDataHook(["usuario"], "/api/appweb/listausuario", (i) => ({ ...i, value: i.cod_usuario, label: i.usuario }));
// Hook para obtener estados
export const useFetchEstados = createDataHook(["estados"], "/api/appweb/listaestados", (i) => ({ ...i, label: i.estado_desc, value: i.cod_estado }));
// Hook para obtener monedas
export const useFetchMonedas = createDataHook(["monedas"], "/api/appweb/lista-moneda", (i) => ({
  ...i,
  label: `${i.SIMBOLO_MONEDA || i.simbolo_moneda} - ${i.nom_moneda}`,
  value: i.cod_moneda,
  simbolo_moneda: i.SIMBOLO_MONEDA || i.simbolo_moneda,
  SIMBOLO_MONEDA: i.SIMBOLO_MONEDA || i.simbolo_moneda,
}));
// Hook para obtener temperamentos
export const useFetchTemperamentos = createDataHook(["temperamentos"], "api/appweb/lista-temperamento", (i) => i);
// Hook para obtener temperamentos
export const useFetchTratamientos = createDataHook(["tratamiento"], "api/appweb/lista-tratamiento", (i) => i);
// Hook para obtener configuraciones de actividad
export const useFetchConfiguracionActividad = createDataHook(["configuracion_actividad"], "api/appweb/lista-configuracion-actividad", (i) => i);
// Hook para obtener periodicidades
export const useFetchPeriodicidad = createDataHook(["periodicidad"], "api/appweb/lista-periodicidad", (i) => i);
// Hook para obtener commodities
export const useFetchCommodities = createDataHook(["commodities"], "api/appweb/lista-commodities", (i) => i);
