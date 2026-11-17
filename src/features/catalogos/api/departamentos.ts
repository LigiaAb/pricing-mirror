import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const departamentoSchema = z.object({
  cod_depto: zId,
  nombre_depto: z.string(),
  cod_pais: zId,
  nombre_pais: z.string().catch(""),
  num_depto: zId.catch(0),
  cod_estado: zId.catch(1),
  estado_desc: z.string().catch(""),
});

export type Departamento = z.infer<typeof departamentoSchema>;

export const departamentos = createCatalogo({
  nombre: "departamentos",
  schema: departamentoSchema,
  endpoints: {
    lista: "/api/appweb/lista-depto-x-pais",
    insertar: "/api/appweb/insertar-depto-x-pais",
    actualizar: "/api/appweb/actualizar-depto-x-pais",
    eliminar: "/api/appweb/eliminar-depto-x-pais",
  },
  habilitado: (filtros) => Boolean(filtros.cod_pais),
});
