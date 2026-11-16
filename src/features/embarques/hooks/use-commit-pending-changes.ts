"use client";

/**
 * Hook del motor "Crear Coordinación" (Fase A.3 del plan de paridad): conecta
 * `ejecutarCommitPendingChanges` (lógica pura en lib/commit-engine) con el
 * stack real — `http` para los endpoints, el fetcher privado de entidades
 * relacionadas y el POST de actualizar-json de la carta. Todo el I/O corre
 * fuera de react-query a propósito: los errores se reportan solo en el modal
 * de Crear Coordinación (sin toasts globales) y el primer paso fallido detiene
 * la cadena (assertOk).
 */

import { useCallback } from "react";
import { actualizarJsonCartaInstruccionesPrivado } from "@/features/carta-instrucciones";
import { fetchDatosEntidadRelacionadaPrivado } from "@/features/entidades";
import { http } from "@/shared/api/client";
import { useAuthStore } from "@/shared/stores/auth-store";
import { ejecutarCommitPendingChanges } from "../lib/commit-engine/commit-pending-changes";
import type { CommitContext } from "../lib/commit-engine/tipos";

export type CommitContextInput = Omit<CommitContext, "codUsuario"> & {
  refetchCartaCliente?: () => Promise<unknown>;
};

export function useCommitPendingChanges(context: CommitContextInput) {
  const user = useAuthStore((s) => s.user);
  const codUsuarioRaw = ((user ?? {}) as Record<string, unknown>).cod_usuario;
  const codUsuario =
    typeof codUsuarioRaw === "string" || typeof codUsuarioRaw === "number" ? codUsuarioRaw : null;

  const commitPendingChanges = useCallback(async () => {
    const { refetchCartaCliente, ...ctx } = context;
    await ejecutarCommitPendingChanges(
      { ...ctx, codUsuario },
      {
        api: http,
        actualizarJsonCarta: actualizarJsonCartaInstruccionesPrivado,
        fetchEntidadesRelacionadas: fetchDatosEntidadRelacionadaPrivado,
        refetchCartaCliente,
      },
    );
  }, [context, codUsuario]);

  return { commitPendingChanges };
}
