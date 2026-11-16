import { format } from "date-fns";
import { z } from "zod";
import type { AsignacionCts } from "../../api/asignaciones-cts";

const requerido = z.string().min(1, "Campo requerido");
const fecha = requerido.refine(
  (valor) => !Number.isNaN(new Date(valor).getTime()),
  "Fecha inválida",
);

export const asignacionCtsFormSchema = z
  .object({
    entidad_id: requerido,
    cod_empresa: requerido,
    cod_cc: requerido,
    cod_usuario: z.string().optional(),
    cod_tipo_embarque: requerido,
    cod_estado: requerido,
    fecha_inicio: fecha,
    fecha_fin: fecha,
    especial: z.boolean(),
  })
  .refine((valores) => valores.especial || !!valores.cod_usuario, {
    path: ["cod_usuario"],
    message: "Seleccione un empleado",
  })
  .refine((valores) => new Date(valores.fecha_fin) >= new Date(valores.fecha_inicio), {
    path: ["fecha_fin"],
    message: "La fecha final no puede ser anterior a la inicial",
  });

export type AsignacionCtsFormValues = z.infer<typeof asignacionCtsFormSchema>;

function fechaLocal(valor: string | undefined): string {
  if (!valor) return "";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "" : format(fecha, "yyyy-MM-dd'T'HH:mm");
}

export function valoresAsignacionCts(asignacion?: AsignacionCts): AsignacionCtsFormValues {
  return {
    entidad_id: asignacion ? String(asignacion.entidad_id) : "",
    cod_empresa: asignacion ? String(asignacion.cod_empresa) : "",
    cod_cc: asignacion ? String(asignacion.cod_cc) : "",
    cod_usuario: asignacion?.cod_usuario == null ? "" : String(asignacion.cod_usuario),
    cod_tipo_embarque: asignacion ? String(asignacion.cod_tipo_embarque) : "",
    cod_estado: asignacion ? String(asignacion.cod_estado) : "",
    fecha_inicio: fechaLocal(asignacion?.fecha_inicio),
    fecha_fin: fechaLocal(asignacion?.fecha_fin),
    especial: asignacion?.especial ?? false,
  };
}

export function payloadAsignacionCts(valores: AsignacionCtsFormValues) {
  return {
    ...valores,
    cod_usuario: valores.especial ? null : valores.cod_usuario,
    fecha_inicio: new Date(valores.fecha_inicio).toISOString(),
    fecha_fin: new Date(valores.fecha_fin).toISOString(),
  };
}
