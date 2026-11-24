import { Typography } from "@mui/material";
import { api } from "../../api";
import useCustomQuery from "./useCustomQuery";
import { createAllPagedEntityDataHook, createDataHook } from "./useFunctions";

// Hook para obtener incoterms
export const useFetchIncoterms = createDataHook("incoterms", `/api/appweb/lista-incoterm`, (e) => ({ ...e, label: `${e.codigo} - ${e.nombre_eng} ( ${e.nombre} )`, value: e.incoterm_id }));

export const useFetchRubros = createDataHook("rubros", `/api/appweb/lista-rubros`, (e) => ({ ...e, label: e.nombre, value: e.cod_rubro }));

export const useFetchServicios = createDataHook(["servicios"], "/api/appweb/lista-servicios", (s) => ({ ...s, label: s.descripcion, value: s.cod_servicio }));

export const useFetchMetodo = createDataHook(["metodos"], "/api/appweb/lista-metodos", (s) => ({ ...s, label: s.fecha_final, value: s.cod_metodo }));
// api/appweb/lista-commodities
export const useFetchCommodity = createDataHook(["estados"], "/api/appweb/lista-commodities", (i) => ({ ...i, label: i.nombre, value: i.cod_commodity }));
export const useFetchEquipos = createDataHook(["equipos"], "/api/appweb/lista-equipo", (i) => ({ ...i, label: `${i.equipo_descripcion}`, value: i.cod_equipo }));

export const useFetchCotizaciones = createDataHook(["cotizaciones"], "/api/appweb/lista-cotizacion-cabecera", (c) => ({ ...c, value: Number(c.cod_cotizacion_cabecera) }));

export const useFetchPuntosEnlace = createDataHook(["puntos-enlace"], "/api/appweb/lista-punto_enlace", (p) => ({ ...p, label: p.codigo + " - " + p.nombre, value: p.cod_puntoenlace }));

export const useFetchCriterios = createDataHook(["criterios"], "/api/appweb/lista-criterios", (p) => ({ ...p, label: p.nombre, value: p.cod_criterio }));

export const useFetchTarifaRuta = createDataHook(["tarifa-ruta"], "/api/appweb/lista-tarifa-ruta", (p) => ({ ...p, label: p.nombre, value: p.cod_tarifa_ruta }));

export const useFetchTarifaScale = createDataHook(["tarifa-scale"], "/api/appweb/lista-tarifa-scalling", (p) => ({ ...p, label: p.codigo, value: p.cod_tarifa_scalling }));

export const useFetchCotizacionPlantilla = createDataHook(["cotizaciones-plantilla"], "/api/appweb/lista-tarifa-plantilla", (c) => ({ ...c, value: Number(c.cod_tarifaplantilla) }));

export const useFetchCotizacionPlantillaRubros = createDataHook(["cotizaciones-plantilla-rubro"], "/api/appweb/lista-plantilla-rubro", (c) => ({
  ...c,
  value: Number(c.cod_plantillarubro),
  key: `${c.cod_servicio}|${c.cod_rubro}`,
}));
