import { z } from "zod";
import { zIdNull } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

/**
 * Identificaciones cuyo valor es un tipo controlado por el backend, no texto libre.
 * El contrato proviene de `listar-identificacion-x-criterio` (Actividad Económica,
 * Tipo Persona SV y el tercer criterio asociado).
 */
export const IDENTIFICACIONES_CON_VALORES_PREDEFINIDOS = [40, 41, 42] as const;

export function esIdentificacionConValoresPredefinidos(
  codIdentificacion: number | string | null | undefined,
) {
  return IDENTIFICACIONES_CON_VALORES_PREDEFINIDOS.includes(
    Number(codIdentificacion) as 40 | 41 | 42,
  );
}

export const identificacionValorSchema = z.looseObject({
  cod_tipo: zIdNull,
  descripcion: z.string().nullish().catch(""),
});

export type IdentificacionValor = z.infer<typeof identificacionValorSchema>;

/** El backend puede repetir un código de criterio; un select requiere valores únicos. */
export function deduplicarValoresIdentificacion(
  valores: readonly IdentificacionValor[],
): IdentificacionValor[] {
  const porCodigo = new Map<string, IdentificacionValor>();
  for (const valor of valores) {
    if (valor.cod_tipo != null && !porCodigo.has(String(valor.cod_tipo))) {
      porCodigo.set(String(valor.cod_tipo), valor);
    }
  }
  return [...porCodigo.values()];
}

export const identificacionValores = createCatalogo({
  nombre: "identificacion-valores",
  schema: identificacionValorSchema,
  endpoints: {
    lista: "/api/appweb/listar-identificacion-x-criterio",
  },
  habilitado: (filtros) =>
    esIdentificacionConValoresPredefinidos(filtros.cod_identificacion as number),
});
