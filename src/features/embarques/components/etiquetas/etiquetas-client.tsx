"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Loader } from "@/shared/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { toIsoDate } from "@/shared/lib/date";
import { fetchEtiquetasEmbarques } from "../../api/etiquetas-emb";
import { etiquetasColumns } from "./etiquetas-columns";

type TabValue = "hoy" | "historico";

const SEARCH_KEYS = ["ETIQ_HAWB", "ETIQ_MAWB", "ETIQ_CSGNEE"];

function EtiquetasClientEmbarque() {
  const [tab, setTab] = useState<TabValue>("hoy");

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["etiquetas-embarques"],
    queryFn: () => fetchEtiquetasEmbarques(),
  });

  const columns = useMemo(() => etiquetasColumns(), []);

  const datosHoy = useMemo(() => {
    const hoyIso = toIsoDate(new Date());
    return data.filter((etiqueta) => toIsoDate(etiqueta.ETIQ_FECHA) === hoyIso);
  }, [data]);

  const renderTabla = (rows: typeof data) => {
    if (isLoading) return <Loader texto="CARGANDO ETIQUETAS" />;

    if (isError) {
      return (
        <Alert variant="destructive" className="m-2">
          <AlertDescription>Ocurrió un error al cargar las etiquetas.</AlertDescription>
        </Alert>
      );
    }

    return <DataTable columns={columns} data={rows} searchKeys={SEARCH_KEYS} />;
  };

  return (
    <div className="mx-auto mt-2 w-full p-2 md:p-4">
      <h2 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">Etiquetas</h2>
      <p className="mb-4 text-sm text-muted-foreground">Listado de coordinaciones.</p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="w-full">
        <TabsList>
          <TabsTrigger value="hoy">Hoy</TabsTrigger>
          <TabsTrigger value="historico">Historico</TabsTrigger>
        </TabsList>

        <TabsContent value="hoy">{renderTabla(datosHoy)}</TabsContent>
        <TabsContent value="historico">{renderTabla(data)}</TabsContent>
      </Tabs>
    </div>
  );
}

export default EtiquetasClientEmbarque;
