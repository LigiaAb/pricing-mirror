import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const centroCostoSchema = z.object({
  cod_cc: zId,
  cod_empresa_cc: zId,
  nombre_cc: z.string().catch(""),
  nombre_emp: z.string().catch(""),
  cod_cropa: z.string().catch(""),
});

export interface CentroCosto {
  codCc: string | number;
  codEmpresaCc: string | number;
  nombreCc: string;
  nombreEmp: string;
  codCropa: string;
}

export const centrosCosto = createCatalogo({
  nombre: "centros-costo",
  schema: centroCostoSchema,
  endpoints: {
    lista: "/api/appweb/listacentrocosto",
    insertar: "/api/appweb/insertarcentrocosto",
    actualizar: "/api/appweb/actualizarcentrocosto",
    eliminar: "/api/appweb/eliminarcentrocosto",
  },
  map: (raw): CentroCosto => ({
    codCc: raw.cod_cc,
    codEmpresaCc: raw.cod_empresa_cc,
    nombreCc: raw.nombre_cc,
    nombreEmp: raw.nombre_emp,
    codCropa: raw.cod_cropa,
  }),
});
