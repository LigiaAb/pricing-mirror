"use client";

import * as React from "react";
import {
  OPCION_PERMISOS,
  type PermisosPricing,
  usePermisosPricing,
} from "@/features/pricing/shared";

/* ==========================================================================
 * PERMISOS DE TARIFAS
 *
 * `CreacionTarifa` (la pantalla) lee los permisos de la opción "Servicios" y
 * los comparte por contexto con la tabla, el formulario, los métodos y las
 * subtablas (cliente, países, detalle, commodities).
 *
 * Sin provider (componentes exportados y usados en otra pantalla) se permite
 * todo: así se conserva el comportamiento que tenían antes.
 * ========================================================================== */

/** Tarifas no usa la acción Autorizar. */
type PermisosTarifas = Omit<PermisosPricing, "puedeAutorizar">;

const TODO_PERMITIDO: PermisosTarifas = {
  puedeVer: true,
  puedeAgregar: true,
  puedeEditar: true,
  puedeEliminar: true,
};

const PermisosTarifasContext = React.createContext<PermisosTarifas>(TODO_PERMITIDO);

export function PermisosTarifasProvider({ children }: { children: React.ReactNode }) {
  const { puedeVer, puedeAgregar, puedeEditar, puedeEliminar } = usePermisosPricing(
    OPCION_PERMISOS.tarifas,
  );

  const permisos = React.useMemo(
    () => ({ puedeVer, puedeAgregar, puedeEditar, puedeEliminar }),
    [puedeVer, puedeAgregar, puedeEditar, puedeEliminar],
  );

  return (
    <PermisosTarifasContext.Provider value={permisos}>{children}</PermisosTarifasContext.Provider>
  );
}

/** Permisos de la pantalla de Tarifas (todo permitido fuera de `PermisosTarifasProvider`). */
export function usePermisosTarifas(): PermisosTarifas {
  return React.useContext(PermisosTarifasContext);
}
