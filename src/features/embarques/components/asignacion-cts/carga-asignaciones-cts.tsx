"use client";

import { FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FormBuilder } from "@/shared/components/form/base-form";
import { Button } from "@/shared/components/ui/button";
import {
  useCargaAsignacionesCts,
  usePlantillaAsignacionesCts,
  useReporteAsignacionesCts,
} from "../../api/use-carga-asignaciones-cts";
import { useOpcionesAsignacionCts } from "../../hooks/use-opciones-asignacion-cts";

const cargaSchema = z.object({
  cod_empresa: z.string().min(1, "Seleccione una empresa"),
  cod_cc: z.string().min(1, "Seleccione un centro de costo"),
  archivo: z
    .instanceof(File, { message: "Seleccione un archivo Excel" })
    .refine(
      (archivo) => archivo.name.toLowerCase().endsWith(".xlsx"),
      "Seleccione un archivo .xlsx",
    )
    .refine((archivo) => archivo.size > 0, "El archivo está vacío"),
});

export function CargaAsignacionesCts({ puedeCargar }: { puedeCargar: boolean }) {
  const [empresa, setEmpresa] = useState("");
  const [version, setVersion] = useState(0);
  const opciones = useOpcionesAsignacionCts(empresa, "");
  const carga = useCargaAsignacionesCts();
  const plantilla = usePlantillaAsignacionesCts();
  const reporte = useReporteAsignacionesCts();
  const resultado = carga.data;

  return (
    <div className="space-y-4">
      <Button variant="outline" disabled={plantilla.isPending} onClick={() => plantilla.mutate()}>
        <FileSpreadsheet aria-hidden="true" className="size-4 text-green-600" />
        Descargar plantilla
      </Button>
      <FormBuilder<z.infer<typeof cargaSchema>>
        key={version}
        schema={cargaSchema}
        defaultValues={{ cod_empresa: "", cod_cc: "" }}
        fields={[
          {
            name: "cod_empresa",
            label: "Empresa",
            type: "select",
            options: opciones.empresas,
            required: true,
            disabled: !puedeCargar || carga.isPending,
            onChange: (valor) => {
              setEmpresa(valor);
              carga.reset();
            },
            resetOnChange: ["cod_cc"],
          },
          {
            name: "cod_cc",
            label: "Centro de costo",
            type: "select",
            options: opciones.centros,
            required: true,
            disabled: !empresa || !puedeCargar || carga.isPending,
          },
          {
            name: "archivo",
            label: "Archivo Excel",
            type: "file",
            accept: ".xlsx",
            required: true,
            disabled: !puedeCargar || carga.isPending,
          },
        ]}
        hideFooter={!puedeCargar}
        isLoading={carga.isPending}
        labels={{ submit: "Cargar asignaciones", loading: "Cargando..." }}
        onSubmit={async (valores) => {
          if (!puedeCargar) return;
          carga.reset();
          await carga.mutateAsync({
            archivo: valores.archivo,
            codEmpresa: valores.cod_empresa,
            codCc: valores.cod_cc,
          });
        }}
      />
      {carga.isPending && (
        <p role="status">Esto puede demorar unos minutos; mantenga abierta la pestaña.</p>
      )}
      {carga.isError && (
        <p role="alert" className="text-destructive">
          {carga.error.message}
        </p>
      )}
      {resultado && (
        <div className="space-y-4">
          <Button
            variant="outline"
            disabled={reporte.isPending}
            onClick={() =>
              reporte.mutate({
                completados: resultado.successfull_inserts,
                errores: resultado.failedinserts,
              })
            }
          >
            Descargar reporte
          </Button>
          <p role="status">
            {resultado.failedinserts.length
              ? "La carga terminó con errores. Revise los resultados."
              : "Carga masiva de asignaciones completada sin errores."}
          </p>
          <DataTable
            data={resultado.successfull_inserts.map((detalle) => ({ detalle }))}
            columns={[{ accessorKey: "detalle", header: "Modificaciones" }]}
          />
          {resultado.failedinserts.length > 0 && (
            <DataTable
              data={resultado.failedinserts.map((detalle) => ({ detalle }))}
              columns={[{ accessorKey: "detalle", header: "Errores de carga" }]}
            />
          )}
          <Button
            variant="outline"
            onClick={() => {
              carga.reset();
              setEmpresa("");
              setVersion((valor) => valor + 1);
            }}
          >
            Limpiar
          </Button>
        </div>
      )}
    </div>
  );
}
