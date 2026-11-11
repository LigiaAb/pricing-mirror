import { z } from "zod";
import { zBoolOpt, zId, zIdNullOpt } from "@/shared/lib/zod-scalars";

const idField = zId;

export const metodosSchema = z.looseObject({
  cod_metodo: idField,
  cod_servicio: idField,
  cod_tipo: zIdNullOpt,
  cod_tipo_tarifa: idField,
  todos_los_paises: zBoolOpt,
  todos_los_clientes: zBoolOpt,
  todos_los_commodities: zBoolOpt,
  fecha_inicial: z.coerce.date(),
  fecha_final: z.coerce.date().nullable(),
  cod_estado: idField,
});
export type MetodoRaw = z.infer<typeof metodosSchema>;
