import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const errorCatalogoSchema = z.object({
  cod_error: zId,
  cod_tip_error: zId,
  corre_cod_error: zId,
  desc_error: z.string(),
  desc_tip_error: z.string(),
  fecha_reg: z.string().nullable().catch(null),
});

export type Errores = z.infer<typeof errorCatalogoSchema>;

export const catalogoErrores = createCatalogo({
  nombre: "errores",
  schema: errorCatalogoSchema,
  endpoints: { lista: "/public/api/listado-catalogo-errores" },
});
