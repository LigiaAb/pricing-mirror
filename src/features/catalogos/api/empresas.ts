import { z } from "zod";
import { CACHE_STATIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const empresaSchema = z.object({
  cod_empresa: zId,
  nombre_emp: z.string(),
  pais_emp: z.number(),
  nit_emp: z.string(),
  direccion_emp: z.string(),
  logo_emp: z.string().nullable(),
  fecha_ingreso: z.string(),
  cod_cropa: zId.catch(""),
});

export interface Empresa {
  cod_empresa: string | number;
  nombre_emp: string;
  paisEmp: number;
  nitEmp: string;
  direccionEmp: string;
  logoEmp: string | null;
  fechaIngreso: string;
  codCropa: string | number;
}

export const empresas = createCatalogo({
  nombre: "empresas",
  schema: empresaSchema,
  endpoints: {
    lista: "/api/appweb/listaempresas",
    insertar: "/api/appweb/insertarempresas",
    actualizar: "/api/appweb/actualizarempresas",
    eliminar: "/api/appweb/eliminarempresas",
  },
  map: (raw): Empresa => ({
    cod_empresa: raw.cod_empresa,
    nombre_emp: raw.nombre_emp,
    paisEmp: raw.pais_emp,
    nitEmp: raw.nit_emp,
    direccionEmp: raw.direccion_emp,
    logoEmp: raw.logo_emp,
    fechaIngreso: raw.fecha_ingreso,
    codCropa: raw.cod_cropa,
  }),
  cache: CACHE_STATIC,
});
