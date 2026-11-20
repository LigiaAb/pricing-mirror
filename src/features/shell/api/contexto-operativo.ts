import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { useAuthStore } from "@/shared/stores/auth-store";

const centroCostoSchema = z.object({
  cencos_id: z.coerce.number(),
  cencod_nombre: z.string(),
  cencos_codcropa: z.string(),
  default: z.string().catch("N"),
});

const empresaSchema = z.object({
  empresa_id: z.coerce.number(),
  empresa_nombre: z.string(),
  emp_codcropa: z.coerce.number().nullable().catch(null),
  centros_costo: z.array(centroCostoSchema).catch([]),
});

const paisEmpresaCentroCostoSchema = z.object({
  pais_id: z.coerce.number(),
  pais_nombre: z.string(),
  pais_codigo: z.string().catch(""),
  empresas: z.array(empresaSchema).catch([]),
});

export type PaisEmpresaCentroCosto = z.infer<typeof paisEmpresaCentroCostoSchema>;

const contextoOperativoKeys = {
  porUsuario: (usuarioId: number) => ["contexto-operativo", usuarioId] as const,
};

/** Países, empresas y centros de costo habilitados para el usuario autenticado. */
export function useContextoOperativoQuery() {
  const { isAuthenticated, user } = useAuthStore();
  const usuarioId = Number(user?.cod_usuario);
  const tieneUsuarioValido = Number.isFinite(usuarioId) && usuarioId > 0;

  return useQuery<PaisEmpresaCentroCosto[], Error>({
    queryKey: contextoOperativoKeys.porUsuario(tieneUsuarioValido ? usuarioId : 0),
    queryFn: async () => {
      const response = await http.get<unknown>("/api/appweb/getPaisEmpresaCentroCostoxUsuario", {
        params: { USUARIO_ID: usuarioId },
      });
      return parseEnvelope(
        response,
        paisEmpresaCentroCostoSchema,
        "getPaisEmpresaCentroCostoxUsuario",
      );
    },
    enabled: isAuthenticated && tieneUsuarioValido,
    staleTime: 5 * 60 * 1000,
  });
}
