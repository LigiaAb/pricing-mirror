import { z } from "zod";
import { zBool, zId, zIdNullOpt, zStrNullOpt } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const empleadoUsuarioSchema = z.looseObject({
  cod_usuario: zId,
  cod_empleado: zIdNullOpt,
  nom_empleado: zStrNullOpt,
  apellido_emp: zStrNullOpt,
  sexo_emp: zStrNullOpt,
  dpi_emp: zStrNullOpt,
  usuario: zStrNullOpt,
  cod_puesto: zIdNullOpt,
  cod_tipo_asignacion: zIdNullOpt,
  puesto_desc: zStrNullOpt,
  cod_emp: zIdNullOpt,
  cod_cc: zIdNullOpt,
  nombre_emp: zStrNullOpt,
  nombre_cc: zStrNullOpt,
  cod_estado: zIdNullOpt,
  estado_desc: zStrNullOpt,
  // El backend guarda el flag como char 'S'/'N'; zBool lo normaliza a boolean.
  usuemppue_default: zBool.nullable().optional(),
});

export interface EmpleadoUsuario {
  codUsuario: string | number;
  codEmpleado: string | number | undefined;
  nombreCompleto: string;
  sexoEmp: string | undefined;
  dpiEmp: string | undefined;
  usuario: string | undefined;
  codPuesto: string | number | undefined;
  codTipoAsignacion: string | number | undefined;
  puestoDesc: string | undefined;
  codEmp: string | number | undefined;
  codCc: string | number | undefined;
  nombreEmp: string | undefined;
  nombreCc: string | undefined;
  codEstado: string | number | undefined;
  estadoDesc: string | undefined;
  usuemppueDefault: boolean | undefined;
  value: string | number;
  label: string;
}

export const empleadosUsuarios = createCatalogo({
  nombre: "listaemp-usu-puesto",
  schema: empleadoUsuarioSchema,
  endpoints: {
    lista: "/api/appweb/listaemp-usu-puesto",
    insertar: "/api/appweb/insertaremp-usu-puesto",
    actualizar: "/api/appweb/actualizaremp-usu-puesto",
    eliminar: "/api/appweb/eliminaremp-usu-puesto",
  },
  map: (raw): EmpleadoUsuario => {
    const nombreCompleto = [raw.nom_empleado, raw.apellido_emp].filter(Boolean).join(" ").trim();
    return {
      codUsuario: raw.cod_usuario,
      codEmpleado: raw.cod_empleado ?? undefined,
      nombreCompleto,
      sexoEmp: raw.sexo_emp ?? undefined,
      dpiEmp: raw.dpi_emp ?? undefined,
      usuario: raw.usuario ?? undefined,
      codPuesto: raw.cod_puesto ?? undefined,
      codTipoAsignacion: raw.cod_tipo_asignacion ?? undefined,
      puestoDesc: raw.puesto_desc ?? undefined,
      codEmp: raw.cod_emp ?? undefined,
      codCc: raw.cod_cc ?? undefined,
      nombreEmp: raw.nombre_emp ?? undefined,
      nombreCc: raw.nombre_cc ?? undefined,
      codEstado: raw.cod_estado ?? undefined,
      estadoDesc: raw.estado_desc ?? undefined,
      usuemppueDefault: raw.usuemppue_default ?? undefined,
      value: raw.cod_usuario,
      label: nombreCompleto,
    };
  },
});
