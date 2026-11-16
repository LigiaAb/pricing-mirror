"use client";

import { useQueries } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { coordinacionesQueryOptions } from "@/features/coordinaciones";
import { CoordinacionesList } from "@/features/embarques/components/pages/coordinaciones-list";
import { ESTADOS_CONFIRMADAS } from "@/features/embarques/lib/constantes";
import { Loader } from "@/shared/components/ui/loader";

// El API pagina este listado mediante `limite`; evita descargar coordinaciones
// de todos los estados para luego descartarlas en el navegador.
const LIMITE_COORDINACIONES = 20;

export function ClientGestionEmbarquesPage() {
  const queries = useQueries({
    queries: ESTADOS_CONFIRMADAS.map((estadoId) =>
      coordinacionesQueryOptions({
        cod_empresa: 1,
        cod_cc: 16,
        estado_id: estadoId,
        limite: LIMITE_COORDINACIONES,
      }),
    ),
  });

  const data = useMemo(() => queries.flatMap((query) => query.data ?? []), [queries]);
  const isLoading = queries.some((query) => query.isLoading);
  const isFetching = queries.some((query) => query.isFetching);
  const handleRefresh = useCallback(() => {
    void Promise.all(queries.map((query) => query.refetch()));
  }, [queries]);

  if (isLoading) {
    return <Loader texto="CARGANDO COORDINACIONES" />;
  }

  return <CoordinacionesList data={data} onRefresh={handleRefresh} isRefreshing={isFetching} />;
}
