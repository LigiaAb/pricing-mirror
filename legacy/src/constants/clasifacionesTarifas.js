import { CODS_TIPOS_TRANSPORTE } from "./transportes";

export const REL_TIPOS_CLASIFICACION_TARIFAS = [
  { label: "INTERNO", value: 0, cod_tipo_padre: CODS_TIPOS_TRANSPORTE.MARITIMO },
  { label: "INTERNO", value: 0, cod_tipo_padre: CODS_TIPOS_TRANSPORTE.TERRESTRE },
  { label: "EXTERNO", value: 1, cod_tipo_padre: CODS_TIPOS_TRANSPORTE.MARITIMO },
  { label: "EXTERNO", value: 1, cod_tipo_padre: CODS_TIPOS_TRANSPORTE.TERRESTRE },
  { label: "DUE AGENT", value: 2, cod_tipo_padre: CODS_TIPOS_TRANSPORTE.AEREO },
  { label: "DUE CARRIER", value: 3, cod_tipo_padre: CODS_TIPOS_TRANSPORTE.AEREO },
  { label: "FLETE", value: 4, cod_tipo_padre: CODS_TIPOS_TRANSPORTE.AEREO },
  { label: "FLETE EXPRESS", value: 5, cod_tipo_padre: CODS_TIPOS_TRANSPORTE.AEREO },
];

export const convertClasificacionServicio = (actual) => {
  if (actual === 0 || actual === 277) return 277; // INTERNO
  if (actual === 1 || actual === 278) return 278; // EXTERNO
  if (actual === 2 || actual === 275) return 275; // DUE AGENT
  if (actual === 3 || actual === 274) return 274; // DUE CARRIER
  if (actual === 4 || actual === 276) return 276; // FLETE
  if (actual === 5 || actual === 347) return 347; // FLETE EXPRESS
  return null;
};

export const esDueAgent = (item) => {
  return (
    convertClasificacionServicio(Number(item?.servicio?.servicio_clasificacion ?? item?.servicio_clasificacion ?? item?.servicio?.clasificacion ?? item?.clasificacion)) ===
    convertClasificacionServicio(2)
  );
};
export const esDueCarrier = (item) => {
  return (
    convertClasificacionServicio(Number(item?.servicio?.servicio_clasificacion ?? item?.servicio_clasificacion ?? item?.servicio?.clasificacion ?? item?.clasificacion)) ===
    convertClasificacionServicio(3)
  );
};
