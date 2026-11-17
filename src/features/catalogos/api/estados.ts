import { z } from "zod";
import { zId, zIdNull } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const estadoSchema = z.object({
  cod_estado: zId,
  estado_desc: z.string().catch(""),
  cod_tipo: zIdNull,
  nom_tipo: z.string().catch(""),
});

export type Estado = z.infer<typeof estadoSchema>;

export const estados = createCatalogo({
  nombre: "estados",
  schema: estadoSchema,
  endpoints: {
    lista: "/api/appweb/listaestados",
    insertar: "/api/appweb/insertarestado",
    actualizar: "/api/appweb/actualizarestado",
    eliminar: "/api/appweb/eliminaestado",
  },
});
