import { z } from "zod";
import { createCatalogo } from "@/features/catalogos";
import { zBool, zId, zIdNullOpt } from "@/shared/lib/zod-scalars";

const texto = z
  .string()
  .nullish()
  .transform((valor) => valor ?? "");

export const asignacionCtsSchema = z.object({
  cod_asignacion_cts: zId,
  entidad_id: zId,
  nombre_cliente: texto,
  cod_empresa: zId,
  empresa_nombre: texto,
  cod_cc: zId,
  cencod_nombre: texto,
  cod_usuario: zIdNullOpt,
  nombre_completo: texto,
  cod_tipo_embarque: zId,
  tipo_embarque_desc: texto,
  cod_estado: zId,
  estado_desc: texto,
  fecha_inicio: texto,
  fecha_fin: texto,
  fecha_creacion: texto,
  especial: zBool.nullish().transform((valor) => valor ?? false),
});

export type AsignacionCts = z.infer<typeof asignacionCtsSchema>;

export const asignacionesCts = createCatalogo({
  nombre: "asignaciones-cts",
  schema: asignacionCtsSchema,
  endpoints: {
    lista: "/api/appweb/listar-asignacion-cliente-cts",
    insertar: "/api/appweb/insertar-asignacion-cliente-cts",
    actualizar: "/api/appweb/actualizar-asignacion-cliente-cts",
    eliminar: "/api/appweb/eliminar-asignacion-cliente-cts",
  },
});
