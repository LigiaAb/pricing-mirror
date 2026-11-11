import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CACHE_SEMI_STATIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";

const proveedorSchema = z
  .object({
    entidad_id: z.union([z.string(), z.number()]),
    entidad_nombre: z.string().nullable().catch(""),
    cod_tipo_entidad: z.union([z.string(), z.number()]).nullable().optional(),
    nombre: z.string().nullable().optional(),
    tipo_nombre: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .passthrough();

const proveedoresPaginaSchema = z
  .object({
    cod_tipo: z.union([z.string(), z.number()]),
    pagina_actual: z.coerce.number().int().positive(),
    total_paginas: z.coerce.number().int().nonnegative(),
    total_registros: z.coerce.number().int().nonnegative(),
    limite: z.coerce.number().int().positive(),
    data: z.array(proveedorSchema),
  })
  .passthrough();

const proveedoresResponseSchema = z
  .object({
    data: proveedoresPaginaSchema,
    message: z.string().nullable().catch(""),
    status: z.union([z.string(), z.number()]).nullable().catch(0),
  })
  .passthrough();

type ProveedorRaw = z.infer<typeof proveedorSchema>;
type ProveedoresPagina = z.infer<typeof proveedoresPaginaSchema>;

export type ProveedorTarifa = ProveedorRaw & {
  value: string | number;
  label: string;
};

export const PROVEEDORES_TARIFA_QUERY_KEY = ["tarifas", "proveedores"] as const;

const COD_TIPO_NOMBRE = 298;
const COD_TIPO_PROVEEDOR = "PROVEEDOR"; // "CARRIER";
const DATOS_POR_PAGINA = 200;
const DATOS_CONSULTA_TOTAL = 1;
const MAX_PAGINAS = Infinity;

function extraerPagina(response: unknown): ProveedoresPagina {
  const directa = proveedoresResponseSchema.safeParse(response);

  if (directa.success) return directa.data.data;

  if (typeof response === "object" && response !== null && "response" in response) {
    const envuelta = proveedoresResponseSchema.safeParse(
      (response as Record<string, unknown>).response,
    );

    if (envuelta.success) return envuelta.data.data;
  }

  throw new Error("La respuesta de lista-entidad-nombres-x-tipo no tiene la estructura esperada.");
}

async function consultarPagina(
  nopagina: number,
  datosxpagina: number = DATOS_POR_PAGINA,
): Promise<ProveedoresPagina> {
  const response = await http.get<unknown>("/api/appweb/lista-entidad-nombres-x-tipo", {
    params: {
      tipo_nombre: COD_TIPO_NOMBRE,
      tipo_entidad: COD_TIPO_PROVEEDOR,
      datosxpagina,
      nopagina,
    },
  });

  return extraerPagina(response);
}

export async function consultarProveedoresTarifa(): Promise<ProveedorTarifa[]> {
  const consultaTotal = await consultarPagina(1, DATOS_CONSULTA_TOTAL);
  const totalPaginas = Math.min(
    Math.ceil(consultaTotal.total_registros / DATOS_POR_PAGINA),
    MAX_PAGINAS,
  );
  const indice = new Map<string, ProveedorRaw>();

  for (let nopagina = 1; nopagina <= totalPaginas; nopagina += 1) {
    const pagina = await consultarPagina(nopagina, DATOS_POR_PAGINA);

    pagina.data.forEach((proveedor) => {
      indice.set(String(proveedor.entidad_id), proveedor);
    });
  }

  const lista = [...indice.values()].map((proveedor) => ({
    ...proveedor,
    label: proveedor.nombre ?? proveedor.entidad_nombre ?? "",
    value: proveedor.entidad_id,
  }));

  return lista;
}

export const proveedoresTarifaOptions = () =>
  queryOptions({
    queryKey: PROVEEDORES_TARIFA_QUERY_KEY,
    queryFn: consultarProveedoresTarifa,
    ...CACHE_SEMI_STATIC,
  });

export function useProveedoresTarifa() {
  return useQuery(proveedoresTarifaOptions());
}
