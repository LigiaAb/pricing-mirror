"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  type CategoryPermission,
  type MenuPermission,
  type ModulePermission,
  useObtenerModulos,
} from "@/features/permisos";
import {
  construirRutaCategoria,
  construirRutaMenu,
  normalizarRutaModulo,
  rutaContienePathname,
} from "../lib/rutas";

export interface NavegacionActual {
  modulo: ModulePermission | null;
  menu: MenuPermission | null;
  categoria: CategoryPermission | null;
  /** `false` mientras `getPermisosxRol` no resuelve: aún no se sabe dónde estamos. */
  resuelta: boolean;
}

const SIN_NAVEGACION: NavegacionActual = {
  modulo: null,
  menu: null,
  categoria: null,
  resuelta: false,
};

/** De los candidatos que contienen al pathname, gana el de ruta más larga (el más específico). */
function masEspecifico<T>(
  candidatos: readonly T[],
  pathname: string,
  rutaDe: (item: T) => string | undefined,
): T | null {
  let ganador: T | null = null;
  let largoGanador = -1;

  for (const candidato of candidatos) {
    const ruta = rutaDe(candidato);
    if (!ruta || !rutaContienePathname(ruta, pathname)) continue;
    if (ruta.length > largoGanador) {
      ganador = candidato;
      largoGanador = ruta.length;
    }
  }

  return ganador;
}

/**
 * Módulo/menú/categoría actuales, derivados del pathname contra el árbol de
 * `getPermisosxRol`.
 *
 * La URL es la única fuente de verdad: cada pestaña tiene la suya y sobrevive a
 * un recargado. Guardar esto en un store persistido hacía que al recargar una
 * pestaña rehidratara la navegación escrita por otra pestaña del mismo origen.
 */
export function useNavegacionActual(): NavegacionActual {
  const pathname = usePathname() ?? "/";
  const modulos = useObtenerModulos();

  return useMemo(() => {
    if (modulos.length === 0) return SIN_NAVEGACION;
    if (pathname === "/") return { ...SIN_NAVEGACION, resuelta: true };

    const modulo = masEspecifico(modulos, pathname, (m) => normalizarRutaModulo(m.modulo_ruta));
    if (!modulo) return { ...SIN_NAVEGACION, resuelta: true };

    const menu = masEspecifico(modulo.menus, pathname, (m) =>
      construirRutaMenu(modulo.modulo_ruta, m.menu_ruta),
    );
    if (!menu) return { modulo, menu: null, categoria: null, resuelta: true };

    const categoria = masEspecifico(menu.categorias, pathname, (c) =>
      construirRutaCategoria(modulo.modulo_ruta, menu.menu_ruta, c.ruta_cat),
    );

    return { modulo, menu, categoria, resuelta: true };
  }, [pathname, modulos]);
}
