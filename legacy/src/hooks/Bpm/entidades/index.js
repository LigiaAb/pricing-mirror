export { useFetchEntidades } from "./useFetchEntidades";
export { useFetchEntidadesDireccion } from "./useFetchEntidadesDireccion";
export { useFetchEntidadConfiguracion } from "./useFetchEntidadConfiguracion";
export { useBusquedaEntidadCriterio } from "./useBusquedaEntidadCriterio";
export { useFetchEntidadContacto } from "./useFetchEntidadContacto";
export { useFetchEntidadIdentificacion } from "./useFetchEntidadIdentificacion";
export { useFetchEntidadRelaciones } from "./useFetchEntidadRelaciones";
export { useFetchDatosEntidad, useFetchDatosEntidadPublico } from "./useFetchDatosEntidad";
export { useFetchDatosEntidadRelacionada, useFetchDatosEntidadRelacionadaPublico } from "./useFetchDatosEntidadRelacionada";
export { useFetchDatosEntidadRelacionadaV1 } from "./useFetchDatosEntidadRelacionadaV1";
export { useFetchDatosEntidadRelacionadaAppweb } from "./useFetchDatosEntidadRelacionadaAppweb";

// Mutaciones sobre relaciones entre entidades
export {
  useInsertarEntidadRelacion,
  useActualizarEntidadRelacion,
  useEliminarEntidadRelacion,
} from "./useEntidadRelacionesMutations";

// Mutaciones sobre identificaciones de entidad
export {
  useInsertarEntidadIdentificacion,
  useActualizarEntidadIdentificacion,
  useEliminarEntidadIdentificacion,
} from "./useEntidadIdentificacionesMutations";

// Mutaciones sobre direcciones de entidad
export {
  useInsertarEntidadDireccion,
  useActualizarEntidadDireccion,
  useEliminarEntidadDireccion,
} from "./useEntidadDireccionMutations";

// Mutaciones sobre contactos de entidad
export {
  useInsertarEntidadContacto,
  useActualizarEntidadContacto,
  useEliminarEntidadContacto,
} from "./useEntidadContactoMutations";
