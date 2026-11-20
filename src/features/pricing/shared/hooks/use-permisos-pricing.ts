"use client";

import { usePermisosCategoria } from "@/features/shell";

/* ==========================================================================
 * PERMISOS DE PRICING
 *
 * Permisos = menú → categoría → opción → acción. La categoría es la pantalla
 * (sale de la ruta) y `usePermisosCategoria` recibe el nombre de la OPCIÓN
 * dentro de esa categoría (igual que embarques: "Lista", "Asignación Masiva").
 *
 * Nombres tomados de la configuración del módulo Pricing (getPermisosxRol,
 * 18/11/2026). Si cambian en el menú, se cambian aquí.
 *
 * Solo es control de interfaz (ARQUITECTURA.md §"Modelo de autorización"):
 * el backend sigue validando cada request.
 * ========================================================================== */

export const OPCION_PERMISOS = {
  /** Categoría "Tarifas" (ruta tarifas). */
  tarifas: "Servicios",
  /** Categoría "Cotizaciones" (ruta solicitud-cotizacion). */
  cotizaciones: "Información",
  /** Categoría "Manejo de Tarifa SPOT" (ruta autoriza-spot). */
  autorizacionSpot: "Información",
  /** Categoría "Carga Masiva de Flete" (ruta carga-masiva-flete). */
  cargaMasivaFletes: "Información",
  /** Categoría "Tarifario de clientes" (ruta cotizacion). */
  plantillasClientes: "Lista",
} as const;

export type OpcionPermisosPricing = (typeof OPCION_PERMISOS)[keyof typeof OPCION_PERMISOS];

/**
 * Acciones que usa pricing. `puedeAutorizar` = acción "Autorizar" (el hook arma
 * `puede` + nombre de la acción, como `puedeFiltrarEmpresaCentroCosto` en objetivos).
 */
export interface PermisosPricing {
  puedeVer: boolean;
  puedeAgregar: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeAutorizar: boolean;
}

/**
 * Permisos de una opción de la pantalla actual, como booleanos.
 * Mientras cargan los permisos todo es `false` (no se muestran acciones).
 */
export function usePermisosPricing(opcion: OpcionPermisosPricing): PermisosPricing {
  const permisos = usePermisosCategoria(opcion);

  return {
    puedeVer: permisos?.puedeVer === true,
    puedeAgregar: permisos?.puedeAgregar === true,
    puedeEditar: permisos?.puedeEditar === true,
    puedeEliminar: permisos?.puedeEliminar === true,
    puedeAutorizar: permisos?.puedeAutorizar === true,
  };
}
