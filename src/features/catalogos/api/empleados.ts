import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const empleadoSchema = z.object({
  cod_empleado: zId,
  nom_empleado: z.string(),
  apellido_emp: z.string(),
  sexo_emp: z.string(),
  dpi_emp: z.string(),
  cod_estado: zId,
});

export interface Empleado {
  codEmpleado: string | number;
  nomEmpleado: string;
  apellidoEmp: string;
  sexoEmp: string;
  dpiEmp: string;
  codEstado: string | number;
  value: string | number;
  label: string;
}

/** Sin `eliminar-empleado`: no existe en el backend (§7.1 plan de personal). */
export const empleados = createCatalogo({
  nombre: "lista-empleado",
  schema: empleadoSchema,
  endpoints: {
    lista: "/api/appweb/lista-empleado",
    insertar: "/api/appweb/insertar-empleado",
    actualizar: "/api/appweb/actualizar-empleado",
  },
  map: (raw): Empleado => {
    const label = [raw.nom_empleado, raw.apellido_emp].filter(Boolean).join(" ").trim();
    return {
      codEmpleado: raw.cod_empleado,
      nomEmpleado: raw.nom_empleado,
      apellidoEmp: raw.apellido_emp,
      sexoEmp: raw.sexo_emp,
      dpiEmp: raw.dpi_emp,
      codEstado: raw.cod_estado,
      value: raw.cod_empleado,
      label,
    };
  },
});
