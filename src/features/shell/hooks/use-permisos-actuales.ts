import { type CategoryPermission, useObtenerModulos } from "@/features/permisos";
import { useNavegacionActual } from "./use-navegacion-actual";

export { useObtenerModulos };

/** Menús del módulo en el que está parada la pestaña actual. */
export const useObtenerMenusPorModuloActual = () => useNavegacionActual().modulo?.menus ?? [];

/** Acciones del catálogo (`cod_accion`) tal como las numera el backend. */
export const ACCION = {
  VER: 1,
  EDITAR: 2,
  AGREGAR: 3,
  ANULAR: 4,
  ELIMINAR: 5,
  AUTORIZAR: 6,
  VALIDAR: 7,
  VER_TODO: 8,
  ASIGNAR: 9,
  APROBAR: 10,
  FILTRAR_EMPRESA_CENTRO_COSTO: 11,
  REVISAR: 28,
} as const;

/**
 * Categoría de permisos que corresponde a la ruta actual, o `null` mientras los
 * permisos todavía no resuelven o la ruta no cae dentro de ninguna categoría.
 */
const useCategoriaActual = (): CategoryPermission | null => useNavegacionActual().categoria;

/**
 * Acciones de una opción de la categoría actual, buscada por `nom_opcion`.
 *
 * Los `cod_opcion` cambian entre categorías equivalentes (p. ej. "Lista" es 158 en
 * Aduana, 159 en Puerto y 160 en Aeropuerto), así que buscar por nombre es lo único
 * estable — es también lo que hace el legacy en `useObtenerOpcionesAcciones`.
 */
export const useObtenerAccionesPorNombreOpcionActual = (nombreOpcion: string) => {
  const categoria = useCategoriaActual();
  const opcion = categoria?.opciones.find((o) => o.nom_opcion === nombreOpcion);
  return opcion?.acciones || [];
};

/**
 * Nombres de opción (`nom_opcion`) habilitados en la categoría actual, o `null`
 * mientras el contexto/permisos todavía no resuelven (distingue "cargando" de
 * "sin opciones"). Sirve para decidir qué pestañas mostrar sin depender del
 * `cod_opcion`, que varía entre categorías equivalentes.
 */
export const useObtenerNombresOpcionesCategoriaActual = (): Set<string> | null => {
  const categoria = useCategoriaActual();
  if (!categoria) return null;
  return new Set(categoria.opciones.map((o) => o.nom_opcion));
};
