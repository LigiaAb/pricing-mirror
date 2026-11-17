import { z } from "zod";
import { zId, zIdNullOpt, zStrNullOpt } from "@/shared/lib/zod-scalars";
import { createCatalogo, createCatalogoMutation } from "./create-catalogo";

export const puestoSchema = z.object({
  cod_puesto: zId,
  puesto_desc: z.string(),
  cod_emp: zId,
  cod_cc: zId,
  nombre_emp: z.string().catch(""),
  nombre_cc: z.string().catch(""),
  cod_estado: zId,
  estado_desc: z.string().catch(""),
  cod_tipo_asignacion: zIdNullOpt,
  // Campos enriquecidos por `lista-puesto`; son opcionales para mantener
  // compatibilidad con respuestas anteriores durante el despliegue gradual.
  tipo_puesto_id: zIdNullOpt,
  tipo_descripcion: z.string().nullable().optional().catch(""),
  fecha_reg: zStrNullOpt,
  fecha_ultimo_cambio_json: zStrNullOpt,
  json_puesto: zStrNullOpt,
});

export interface Puesto {
  codPuesto: string | number;
  puestoDesc: string;
  codEmp: string | number;
  codCc: string | number;
  nombreEmp: string;
  nombreCc: string;
  codEstado: string | number;
  estadoDesc: string;
  codTipoAsignacion: string | number | undefined | null;
  tipoPuestoId: string | number | undefined | null;
  tipoDescripcion: string;
  fechaReg: string | undefined | null;
  fechaUltimoCambioJson: string | undefined | null;
  jsonPuesto: string | undefined | null;
  value: string | number;
  label: string;
}

export const puestos = createCatalogo({
  nombre: "lista-puesto",
  schema: puestoSchema,
  endpoints: {
    lista: "/api/appweb/lista-puesto",
    insertar: "/api/appweb/insertar-puesto",
    actualizar: "/api/appweb/actualizar-puesto",
    eliminar: "/api/appweb/eliminar-puesto",
  },
  map: (raw): Puesto => ({
    codPuesto: raw.cod_puesto,
    puestoDesc: raw.puesto_desc,
    codEmp: raw.cod_emp,
    codCc: raw.cod_cc,
    nombreEmp: raw.nombre_emp,
    nombreCc: raw.nombre_cc,
    codEstado: raw.cod_estado,
    estadoDesc: raw.estado_desc,
    codTipoAsignacion: raw.cod_tipo_asignacion,
    tipoPuestoId: raw.tipo_puesto_id,
    tipoDescripcion: raw.tipo_descripcion ?? "",
    fechaReg: raw.fecha_reg,
    fechaUltimoCambioJson: raw.fecha_ultimo_cambio_json,
    jsonPuesto: raw.json_puesto,
    value: raw.cod_puesto,
    label: raw.puesto_desc,
  }),
});

/**
 * `ruta_inicial` no es una columna de puesto: el backend la guarda dentro de
 * `json_puesto`. Se mantiene como mutación explícita para no mezclar el blob
 * denormalizado con el CRUD relacional.
 */
export const useActualizarJsonPuesto = createCatalogoMutation(
  puestos.keys.all,
  "/api/appweb/actualizar-json-puesto",
);
