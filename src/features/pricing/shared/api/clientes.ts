import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CACHE_SEMI_STATIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";

const clienteSchema = z
  .object({
    entidad_id: z.union([z.string(), z.number()]),
    entidad_nombre: z.string().nullable().catch(""),
    cod_tipo_entidad: z.union([z.string(), z.number()]).nullable().optional(),
    nombre: z.string().nullable().optional(),
    tipo_nombre: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .passthrough();

const clientesPaginaSchema = z
  .object({
    cod_tipo: z.union([z.string(), z.number()]),
    pagina_actual: z.coerce.number().int().positive(),
    total_paginas: z.coerce.number().int().nonnegative(),
    total_registros: z.coerce.number().int().nonnegative(),
    limite: z.coerce.number().int().positive(),
    data: z.array(clienteSchema),
  })
  .passthrough();

const clientesResponseSchema = z
  .object({
    data: clientesPaginaSchema,
    message: z.string().nullable().catch(""),
    status: z.union([z.string(), z.number()]).nullable().catch(0),
  })
  .passthrough();

type ClienteRaw = z.infer<typeof clienteSchema>;
type ClientesPagina = z.infer<typeof clientesPaginaSchema>;

export type ClienteTarifa = ClienteRaw & {
  value: string | number;
  label: string;
};

export const CLIENTES_TARIFA_QUERY_KEY = ["tarifas", "clientes"] as const;

const COD_TIPO_NOMBRE = 298;
const COD_TIPO_CLIENTE = "CLIENTE"; // "CARRIER";
const DATOS_POR_PAGINA = 10;
const DATOS_CONSULTA_TOTAL = 1;
const MAX_PAGINAS = 10;

function extraerPagina(response: unknown): ClientesPagina {
  const directa = clientesResponseSchema.safeParse(response);

  if (directa.success) return directa.data.data;

  if (typeof response === "object" && response !== null && "response" in response) {
    const envuelta = clientesResponseSchema.safeParse(
      (response as Record<string, unknown>).response,
    );

    if (envuelta.success) return envuelta.data.data;
  }

  throw new Error("La respuesta de lista-entidad-nombres-x-tipo no tiene la estructura esperada.");
}

async function consultarPagina(
  nopagina: number,
  datosxpagina: number = DATOS_POR_PAGINA,
): Promise<ClientesPagina> {
  const response = await http.get<unknown>("/api/appweb/lista-entidad-nombres-x-tipo", {
    params: {
      tipo_nombre: COD_TIPO_NOMBRE,
      tipo_entidad: COD_TIPO_CLIENTE,
      datosxpagina,
      nopagina,
    },
  });

  return extraerPagina(response);
}

export async function consultarClientesTarifa(): Promise<ClienteTarifa[]> {
  const consultaTotal = await consultarPagina(1, 100);

  return consultaTotal.data.map((cliente: ClienteRaw) => ({
    ...cliente,
    label: cliente.nombre ?? cliente.entidad_nombre ?? "",
    value: cliente.entidad_id,
  }));
}

export async function consultar100ClientesTarifa(): Promise<ClienteTarifa[]> {
  const consultaTotal = await consultarPagina(1, DATOS_CONSULTA_TOTAL);
  const totalPaginas = Math.min(
    Math.ceil(consultaTotal.total_registros / DATOS_POR_PAGINA),
    MAX_PAGINAS,
  );
  const indice = new Map<string, ClienteRaw>();

  for (let nopagina = 1; nopagina <= totalPaginas; nopagina += 1) {
    const pagina = await consultarPagina(nopagina, DATOS_POR_PAGINA);

    pagina.data.forEach((cliente: ClienteRaw) => {
      indice.set(String(cliente.entidad_id), cliente);
    });
  }

  const lista = [...indice.values()].map((cliente) => ({
    ...cliente,
    label: cliente.nombre ?? cliente.entidad_nombre ?? "",
    value: cliente.entidad_id,
  }));

  return lista;
}

export const clientesTarifaOptions = () =>
  queryOptions({
    queryKey: CLIENTES_TARIFA_QUERY_KEY,
    queryFn: consultarClientesTarifa,
    ...CACHE_SEMI_STATIC,
  });

export const clientesSimpleTarifaOptions = () =>
  queryOptions({
    queryKey: CLIENTES_TARIFA_QUERY_KEY,
    queryFn: consultarClientesTarifa,
    ...CACHE_SEMI_STATIC,
  });

export function useClientesTarifa() {
  return useQuery(clientesTarifaOptions());
}

export function useClientesTarifaSimple() {
  return useQuery(clientesSimpleTarifaOptions());
}
