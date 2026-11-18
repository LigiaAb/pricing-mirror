"use client";

import { useMutation } from "@tanstack/react-query";

import { http } from "@/shared/api/client";

type Id = string | number;
type UnknownRecord = Record<string, unknown>;

export type MetodoCargaFlete = "AIRFREIGTH" | "LANDFREIGTH";

export type CargaMasivaFleteExitosa = {
  FILA: string | number;
  SERVICIO: string | number;
  ACTUALIZADO?: boolean | null;
  [key: string]: unknown;
};

export type ResultadoCargaMasivaFletes = {
  // success: boolean;
  // mensaje: string;
  completados: CargaMasivaFleteExitosa[];
  errores: string[];
};

export type CargarFletesMasivosPayload = {
  codEmpresa: Id;
  codCentroCosto: Id;
  metodo: MetodoCargaFlete;
  costo?: File | null;
  venta: File;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getRecord(value: unknown): UnknownRecord | null {
  return isRecord(value) ? value : null;
}

function normalizarErrores(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.map((error) => {
    if (typeof error === "string") return error;
    if (isRecord(error)) {
      const mensaje = error.mensaje ?? error.message ?? error.errorMessage ?? error.error;
      if (mensaje != null) return String(mensaje);
    }

    return String(error);
  });
}

function normalizarCompletados(value: unknown): CargaMasivaFleteExitosa[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((item) => ({
    ...item,
    FILA: (item.FILA ?? item.fila ?? "") as string | number,
    SERVICIO: (item.SERVICIO ?? item.servicio ?? "") as string | number,
    ACTUALIZADO: Boolean(item.ACTUALIZADO ?? item.actualizado),
  }));
}

function normalizarRespuesta(response: unknown): ResultadoCargaMasivaFletes {
  const responseRecord = getRecord(response);
  const nestedBody = getRecord(getRecord(responseRecord?.data)?.data) ?? {};
  const body =
    nestedBody && ("success" in nestedBody || "mensaje" in nestedBody || "message" in nestedBody)
      ? nestedBody
      : (responseRecord ?? {});
  const result = getRecord(getRecord(body.data)?.data) ?? {};

  return {
    completados: normalizarCompletados(
      result.successfull_inserts ?? result.successful_inserts ?? result.completados,
    ),
    errores: normalizarErrores(
      result.failedInserts ?? result.failedinserts ?? result.failed_inserts ?? result.errores,
    ),
  };
}

export async function cargarFletesMasivos({
  codEmpresa,
  codCentroCosto,
  metodo,
  costo,
  venta,
}: CargarFletesMasivosPayload) {
  const formData = new FormData();

  formData.append("cod_empresa", String(codEmpresa));
  formData.append("cod_cc", String(codCentroCosto));
  formData.append("cod_metodo", metodo);
  formData.append("cod_rubro", "11");

  if (costo) {
    formData.append("costo", costo);
  }

  formData.append("venta", venta);

  const response = await http.post<unknown>(
    "/api/appweb/orquestador-cargas-masivas-fletes",
    formData,
  );

  return normalizarRespuesta(response);
}

export function useCargarFletesMasivos() {
  return useMutation({
    mutationFn: cargarFletesMasivos,
  });
}
