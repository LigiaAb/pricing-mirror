"use client";

import { ACCION, useObtenerAccionesPorNombreOpcionActual } from "./use-permisos-actuales";

export interface PermisosCategoria {
  puedeVer: boolean;
  puedeEditar: boolean;
  puedeAgregar: boolean;
  puedeAnular: boolean;
  puedeEliminar: boolean;
  puedeAutorizar: boolean;
  puedeValidar: boolean;
  puedeVerTodo: boolean;
  puedeAsignar: boolean;
  puedeAprobar: boolean;
  puedeFiltrarEmpresaCentroCosto: boolean;
  puedeRevisar: boolean;
}

/**
 * Traduce las acciones de una opción de la categoría actual a flags de UI.
 *
 * Reemplaza el objeto `accionesDeTabla` que el legacy inyecta fila por fila: el
 * permiso es de la vista, no del registro.
 */
export function usePermisosCategoria(nombreOpcion: string): PermisosCategoria {
  const acciones = useObtenerAccionesPorNombreOpcionActual(nombreOpcion);
  const tiene = (cod: number) => acciones.some((a) => a.cod_accion === cod);

  return {
    puedeVer: tiene(ACCION.VER),
    puedeEditar: tiene(ACCION.EDITAR),
    puedeAgregar: tiene(ACCION.AGREGAR),
    puedeAnular: tiene(ACCION.ANULAR),
    puedeEliminar: tiene(ACCION.ELIMINAR),
    puedeAutorizar: tiene(ACCION.AUTORIZAR),
    puedeValidar: tiene(ACCION.VALIDAR),
    puedeVerTodo: tiene(ACCION.VER_TODO),
    puedeAsignar: tiene(ACCION.ASIGNAR),
    puedeAprobar: tiene(ACCION.APROBAR),
    puedeFiltrarEmpresaCentroCosto: tiene(ACCION.FILTRAR_EMPRESA_CENTRO_COSTO),
    puedeRevisar: tiene(ACCION.REVISAR),
  };
}
