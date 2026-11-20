/* STUB del repo espejo: solo tipos para verificar pricing. NO copiar al proyecto real. */
/* Todo lo de @/shared y @/features que no tiene stub tipado arriba se trata como any. */
declare module "@/shared/*";
/* @/features/shell: usePermisosCategoria con el tipo real (use-permisos-categoria.ts, 20/11/2026). */
declare module "@/features/shell" {
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
  export function usePermisosCategoria(nombreOpcion: string): PermisosCategoria;
  export const useContextoOperativoStore: any;
  export const useObtenerNombresOpcionesCategoriaActual: any;
}
declare module "@/features/entidades";
declare module "@/features/wms-hn/*";
declare module "@/features/accesos/*";
