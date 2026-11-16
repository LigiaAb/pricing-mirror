"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelopeObjeto } from "@/shared/api/envelope";
import { exigirExitoDeMutacion } from "@/shared/api/respuesta-mutacion";
import { exportarExcel } from "@/shared/lib/excel";
import { asignacionesCts } from "./asignaciones-cts";

const resultadoCargaSchema = z.object({
  successfull_inserts: z.array(z.string()).default([]),
  failedinserts: z.array(z.string()).default([]),
});

export function useCargaAsignacionesCts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      archivo,
      codEmpresa,
      codCc,
    }: {
      archivo: File;
      codEmpresa: string;
      codCc: string;
    }) => {
      const body = new FormData();
      body.append("cod_metodo", "ASIGNACION_CTS");
      body.append("cod_empresa", codEmpresa);
      body.append("cod_cc", codCc);
      body.append("archivo", archivo);
      const response = await http.post<unknown>("/api/appweb/orquestador-cargas-masivas", body);
      exigirExitoDeMutacion(response, "No se pudo cargar el archivo");
      return parseEnvelopeObjeto(response, resultadoCargaSchema, "carga-asignaciones-cts");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: asignacionesCts.keys.all }),
  });
}

export function usePlantillaAsignacionesCts() {
  return useMutation({
    mutationFn: () =>
      exportarExcel({
        nombreArchivo: "Plantilla Carga de Asignaciones CTS.xlsx",
        hojas: [
          {
            nombre: "Datos",
            columnas: [
              "CORRELATIVO",
              "CLIENTE",
              "EMBARQUE",
              "CORREO",
              "VIGENCIA INICIAL",
              "VIGENCIA FINAL",
            ],
            filas: [],
          },
        ],
      }),
  });
}

export function useReporteAsignacionesCts() {
  return useMutation({
    mutationFn: ({ completados, errores }: { completados: string[]; errores: string[] }) =>
      exportarExcel({
        nombreArchivo: "Reporte carga asignaciones CTS.xlsx",
        hojas: [
          {
            nombre: "Modificaciones",
            columnas: ["Modificaciones"],
            filas: completados.map((detalle) => [detalle]),
          },
          {
            nombre: "Errores",
            columnas: ["Errores de carga"],
            filas: errores.map((detalle) => [detalle]),
          },
        ],
      }),
  });
}
