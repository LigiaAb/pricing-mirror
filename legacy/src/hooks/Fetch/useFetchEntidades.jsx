import { api } from "../../api";
import useCustomQuery from "./useCustomQuery";
import { createAllPagedEntityDataHook, createDataHook, createAllPagedEntitySimpleDataHook, createDataMutationHook, createPaginatedHook, updateDataMutationHook } from "./useFunctions";

export const useFetchAllEntidades = createAllPagedEntityDataHook(["entidades"], "/api/appweb/lista-entidad", undefined, ["SHIPPER"]);

export const useFetchAllEntidadesSimple = createAllPagedEntitySimpleDataHook(["entidades-simple"], "/api/appweb/lista-entidad-simplificada", (i) => ({
  ...i,
  value: i.entidad_id,
  label: i.entidad_nombre,
}));

export const useFetchAllEntidadesSimplePaginada = createAllPagedEntityDataHook(["entidades-simple"], "/api/appweb/lista-entidad-simplificada-paginada", (i) => ({
  ...i,
  value: i.entidad_id,
  label: i.entidad_nombre,
}));

export const useFetchEntidadNombresTipos = createPaginatedHook(["entidad-nombres-tipos"], "/api/appweb/lista-entidad-nombres-x-tipo", (i) => i);

export const useFetchEntidadNombres = createPaginatedHook(["entidad-nombres"], "/api/appweb/lista-entidad-nombres", (i) => i);

export const useMutateEntidadNombres = createPaginatedHook(["entidad-nombres"], "/api/appweb/lista-entidad-nombres", (i) => i);

export const useFetchEntidadIdentificaciones = createPaginatedHook(["entidad-identificaciones"], "/api/appweb/lista-entidad-identificacion", (i) => i);
export const useCreateEntidadIdentificaciones = createDataMutationHook(["entidad-identificaciones"], "/api/appweb/insertar-entidad-identificacion");
export const useUpdateEntidadIdentificaciones = updateDataMutationHook(["entidad-identificaciones"], "/api/appweb/actualizar-entidad-identificacion");

export const useFetchEntidadContactos = createPaginatedHook(["entidad-contactos"], "/api/appweb/lista-entidad-contactos", (i) => i);

export const useFetchEntidadDirecciones = createPaginatedHook(["entidad-direcciones"], "/api/appweb/lista-entidad-direccion", (i) => i);
export const useCreatehEntidadDirecciones = createDataMutationHook(["entidad-direcciones"], "/api/appweb/insertar-entidad-direccion");
export const useUpdatehEntidadDirecciones = updateDataMutationHook(["entidad-direcciones"], "/api/appweb/actualizar-entidad-direccion");

export const useFetchEntidadPaises = createPaginatedHook(["entidad-paises"], "/api/appweb/lista-entidad-paises", (i) => i);

export const useFetchEntidadConfiguracion = createPaginatedHook(["entidad-configuracion"], "/api/appweb/lista-entidad-configuracion", (i) => i);

export const useFetchEntidadCredito = createPaginatedHook(["entidad-credito"], "/api/appweb/lista-entidad-credito", (i) => i);

export const useFetchEntidadImpuesto = createPaginatedHook(["entidad-impuesto"], "/api/appweb/lista-entidad-impuesto", (i) => i);

export const useFetchEntidadBitacora = createPaginatedHook(["entidad-bitacora"], "/api/appweb/lista-entidad-bitacora", (i) => i);
