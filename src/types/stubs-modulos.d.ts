/* STUB del repo espejo: solo tipos para verificar pricing. NO copiar al proyecto real. */
/* Todo lo de @/shared y @/features que no tiene stub tipado arriba se trata como any. */
declare module "@/shared/*";
declare module "@/features/entidades";
declare module "@/features/entidades/*";
declare module "@/features/entidades/api/use-busqueda-entidad-criterio" {
  /** PROVISIONAL (solo los campos que usa actividades): reemplazar por el tipo real. */
  export interface EntidadCriterioResultado {
    entidad_id: number;
    entidad_nombre?: string | null;
    codigo_entidad?: string | null;
    cod_tipo?: number | null;
    [campo: string]: unknown;
  }
}
declare module "@/features/wms-hn/*";
declare module "@/features/accesos/*";
