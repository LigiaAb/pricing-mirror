import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zIdSafe } from "@/shared/lib/zod-scalars";
import { actividades } from "./actividades";

const texto = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "");

const contactoActividadSchema = z.looseObject({
  entidadcontacto_id: zIdSafe,
  entidadcontacto_nombre: texto,
  entidadcontacto_email: texto,
  entidadcontacto_telefono: texto,
  estado_desc: texto,
  data_entidad_contacto_tipo: texto,
});

export type ContactoActividad = z.infer<typeof contactoActividadSchema>;

const contactosActividadKey = (codActividad: number) =>
  ["contactos-actividad", codActividad] as const;

export function useContactosActividad(codActividad: number | null) {
  return useQuery({
    queryKey: contactosActividadKey(codActividad ?? 0),
    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-contactos-actividades", {
          params: { cod_actividad: codActividad },
        }),
        contactoActividadSchema,
        "lista-contactos-actividades",
      ),
    enabled: codActividad !== null,
  });
}

export function useInsertarContactoActividad() {
  const queryClient = useQueryClient();
  return useMutation<Record<string, unknown>, Error, Record<string, unknown>>({
    mutationFn: (payload) => http.post("/api/appweb/insertar-contactos-actividad", payload),
    meta: { successMessage: "Contacto vinculado" },
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: actividades.keys.all }),
        queryClient.invalidateQueries({
          queryKey: contactosActividadKey(Number(variables.cod_actividad)),
        }),
      ]);
    },
  });
}
