import { z } from "zod";
import { zId, zNum, zNumNull, zStr } from "@/shared/lib/zod-scalars";
import { createCatalogo, type Filtros } from "./create-catalogo";
import { estados } from "./estados";

export const relacionTipoSchema = z.object({
  cod_relacion_tipo: zId,
  cod_tipo: zId,
  cod_estado: zNumNull.optional(),
  cod_tipo_padre: zNum.optional(),
  fecha_fin: z.string().nullable().optional(),
  fecha_inicio: z.string().nullable().optional(),
  tipo_desc: zStr.optional(),
  tipo_padre_desc: zStr.optional(),
  tipo_padre_tabla: zStr.optional(),
  tipo_tabla: zStr.optional(),
});

export interface RelacionTipo extends z.infer<typeof relacionTipoSchema> {
  estado_desc: string;
}

const base = createCatalogo({
  nombre: "relacion-tipo",
  schema: relacionTipoSchema,
  endpoints: {
    lista: "/api/appweb/lista-relacion-tipo",
    insertar: "/api/appweb/insertar-relacion-tipo",
    actualizar: "/api/appweb/actualizar-relacion-tipo",
    eliminar: "/api/appweb/eliminar-relacion-tipo",
  },
});

/**
 * Lista con `estado_desc` resuelto contra el catálogo de estados.
 * El join vive fuera de la queryFn: la caché de relación-tipo guarda
 * el dato crudo y la descripción se deriva siempre del estado actual.
 */
function useListaConEstado(filtros: Filtros = {}, overrides?: { enabled?: boolean }) {
  // El `enabled` del caller debe propagarse también al join: en vistas
  // públicas (sin sesión) este catálogo se deja deshabilitado a propósito
  // porque es privado (proxy autenticado) — llamarlo igual devuelve 401 y
  // dispara el logout global (onSesionExpirada), aunque el link no haya
  // expirado.
  const { data: listaEstados } = estados.useLista(undefined, {
    enabled: overrides?.enabled ?? true,
  });
  const query = base.useLista(filtros, overrides);
  const data = query.data?.map((item): RelacionTipo => {
    const estado = listaEstados?.find((e) => Number(item.cod_estado) === e.cod_estado);
    return {
      ...item,
      estado_desc: estado?.estado_desc ?? (item.cod_estado == null ? "" : String(item.cod_estado)),
    };
  });
  return { ...query, data };
}

export const relacionTipo = { ...base, useLista: useListaConEstado };
