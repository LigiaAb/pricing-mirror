"use client";

import { useQueries } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  extraerCodEstadoCartaInstrucciones,
  recuperarFilaCartaInstruccionesPrivado,
} from "@/features/carta-instrucciones";
import type { Coordinacion } from "@/features/coordinaciones";
import { useCoordinaciones } from "@/features/coordinaciones";
import {
  COD_CC_EMBARQUES,
  COD_EMPRESA_EMBARQUES,
  COD_ESTADO_CARTA_INCOMPLETA,
  COD_MODULO_EMBARQUES,
  ESTADO_CTS,
} from "@/features/embarques/lib/constantes";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Loader } from "@/shared/components/ui/loader";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { encodeId } from "@/shared/lib/sqids";
import { AvisoGuiaAsignada } from "./aviso-guia-asignada";
import { ctsColumns } from "./cts-columns";

type TabCarta = "completas" | "incompletas";

interface GuiaAsignada {
  guia: string | null;
}

export function ClientCtsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabCarta>("completas");
  const [guiaAsignada, setGuiaAsignada] = useState<GuiaAsignada | null>(null);

  const {
    data = [],
    isLoading,
    refetch,
    isFetching,
  } = useCoordinaciones({ cod_empresa: 1, cod_cc: 16, estado_id: ESTADO_CTS });

  // Aviso post-creación de coordinación: se lee el query param y se limpia la URL.
  useEffect(() => {
    const guia = searchParams?.get("guia");
    const creada = searchParams?.get("creada");
    if (guia || creada) {
      setGuiaAsignada({ guia: guia || null });
      router.replace(pathname ?? "/");
    }
  }, [searchParams, pathname, router]);

  const datosCts = useMemo(() => data.filter((row) => row.estadoId === ESTADO_CTS), [data]);

  const filasConCarta = useMemo(
    () => datosCts.filter((row) => row.cotizacionCabeceraId != null),
    [datosCts],
  );

  const cotizacionesConCarta = useMemo(
    () => [...new Set(filasConCarta.map((row) => Number(row.cotizacionCabeceraId)))],
    [filasConCarta],
  );

  const cartaQueries = useQueries({
    queries: cotizacionesConCarta.map((cotizacionCabeceraId) => ({
      queryKey: ["carta-instrucciones-cod-estado", cotizacionCabeceraId],
      queryFn: async () => {
        const response = await recuperarFilaCartaInstruccionesPrivado({
          cod_cotizacion_cabecera: cotizacionCabeceraId,
          cod_modulo: COD_MODULO_EMBARQUES,
          cod_cc: COD_CC_EMBARQUES,
          cod_empresa: COD_EMPRESA_EMBARQUES,
        });
        return extraerCodEstadoCartaInstrucciones(response);
      },
      ...CACHE_DYNAMIC,
    })),
  });

  const cartasCargadas = cartaQueries.every((q) => q.isFetched);

  const codEstadoPorCotizacion = useMemo(() => {
    const mapa = new Map<number, number | null>();
    cotizacionesConCarta.forEach((cotizacionCabeceraId, i) => {
      const query = cartaQueries[i];
      if (query?.isSuccess) {
        mapa.set(cotizacionCabeceraId, query.data);
      }
    });
    return mapa;
  }, [cotizacionesConCarta, cartaQueries]);

  const codEstadoPorEmbarque = useMemo(() => {
    const mapa = new Map<number, number | null>();
    filasConCarta.forEach((row) => {
      if (row.embarqueId != null) {
        mapa.set(
          Number(row.embarqueId),
          codEstadoPorCotizacion.get(Number(row.cotizacionCabeceraId)) ?? null,
        );
      }
    });
    return mapa;
  }, [filasConCarta, codEstadoPorCotizacion]);

  // El filtro por tab se activa solo cuando terminaron todas las consultas de
  // carta; mientras tanto se muestran todas las filas CTS (paridad con legacy).
  const datosFiltrados = useMemo(() => {
    if (!cartasCargadas) return datosCts;
    return datosCts.filter((row) => {
      const esIncompleta =
        codEstadoPorEmbarque.get(Number(row.embarqueId)) === COD_ESTADO_CARTA_INCOMPLETA;
      return tab === "incompletas" ? esIncompleta : !esIncompleta;
    });
  }, [datosCts, cartasCargadas, codEstadoPorEmbarque, tab]);

  const handleView = useCallback(
    (row: Coordinacion) => {
      const id = row.embarqueId;
      if (id) {
        router.push(`/embarques/embarques/cts/${encodeId(Number(id))}`);
      }
    },
    [router],
  );

  const columns = useMemo(() => ctsColumns({ handleView }), [handleView]);

  if (isLoading) {
    return <Loader texto="CARGANDO COORDINACIONES CTS" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabCarta)}>
          <TabsList>
            <TabsTrigger value="completas">Completas</TabsTrigger>
            <TabsTrigger value="incompletas">Incompletas</TabsTrigger>
          </TabsList>
        </Tabs>
        {!cartasCargadas && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Clasificando cartas de instrucciones...
          </span>
        )}
      </div>
      <div className="overflow-auto">
        <DataTable
          columns={columns}
          data={datosFiltrados}
          searchKeys={["cod_file"]}
          searchPlaceholder="Buscar por código de archivo..."
          showPagination
          pageSize={10}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />
      </div>
      {guiaAsignada && (
        <AvisoGuiaAsignada guia={guiaAsignada.guia} onClose={() => setGuiaAsignada(null)} />
      )}
    </div>
  );
}
