"use client";

import {
  format,
  isValid,
  parseISO,
} from "date-fns";
import { ClockAlert, OctagonAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { useCatalogosTarifas } from "../../../tarifas/hooks/use-catalogos-tarifas";
import type { RubroDueAgent } from "../lib/due-agent";
import type { RubroDueCarrier } from "../lib/due-carrier";
import { ResumenItem } from "./resumen-item";
import { getEstadoMetodo } from "../../../shared/lib/vigencia-metodo";

type Props = {
  item: RubroDueCarrier | RubroDueAgent | null;

  estado?: "pro";

  width?: string;
};

/* ==========================================================================
 * FICHA RESUMEN
 * ========================================================================== */

const formatFecha = (fecha?: Date | string) => {
  if (!fecha) {
    return null;
  }
  if (typeof fecha === "undefined") {
    return null;
  }
  if (typeof fecha === "string") {
    fecha = parseISO(fecha);
  }
  if (!isValid(fecha)) {
    return null;
  }
  return format(parseISO((fecha as Date).toISOString().split("T")[0] ?? ""), "dd/MM/yyyy");
};

export function FichaResumen({ item, width = "w-[300px]" }: Props) {
  // Se usa también en Tarifas (fuera del provider de cotizaciones), por eso lee Tarifas directo.
  const { catalogos } = useCatalogosTarifas({});

  const servicio = catalogos.servicios.find(
    (servicio) => servicio.cod_servicio === item?.cod_servicio,
  );
  const metodo = catalogos.metodos.find(
    (metodo) => String(metodo.cod_servicio) === String(item?.cod_servicio),
  );

  const { vencida, proximaAVencer } = getEstadoMetodo(metodo?.fecha_final);

  const tipoTransporte =
    catalogos.tiposTransporte.find(
      (tipoTransporte) => String(tipoTransporte.value) === String(servicio?.cod_tipo_transporte),
    )?.label ?? "";
  const tipoServicio =
    catalogos.tiposServicio.find(
      (tipoServicio) => String(tipoServicio.value) === String(servicio?.cod_tipo_servicio),
    )?.label ?? "";

  const tipoCarga =
    catalogos.tiposCarga.find(
      (tipoCarga) => String(tipoCarga.value) === String(servicio?.cod_tipo_carga),
    )?.label ?? "";
  const tipoPago =
    catalogos.tiposPago.find(
      (tipoPago) => String(tipoPago.value) === String(servicio?.cod_tipo_pago),
    )?.label ?? "";
  const clasificacionCarga =
    catalogos.clasificacionesCarga.find(
      (clasificacionCarga) =>
        String(clasificacionCarga.value) === String(servicio?.cod_clasificacion_carga),
    )?.label ?? "";
  const tipoAplicacion =
    catalogos.tiposAplicacion.find(
      (tipoAplicacion) => String(tipoAplicacion.value) === String(servicio?.cod_tipo_aplicacion),
    )?.label ?? "";
  const tipoCalculo =
    catalogos.tiposCalculo.find(
      (tipoCalculo) => String(tipoCalculo.value) === String(servicio?.cod_tipo_calculo),
    )?.label ?? "";
  const categoriaTransporte =
    catalogos.categoriasTransporte.find(
      (categoriaTransporte) => String(categoriaTransporte.value) === String(servicio?.categoria),
    )?.label ?? "";
  const tipoClasificacion =
    catalogos.tiposClasificacionServicio.find(
      (tipoClasificacion) => String(tipoClasificacion.value) === String(servicio?.clasificacion),
    )?.label ?? "";
  const aplicaATodosLosOrigenes = metodo?.todos_los_paises ? "Si" : "No";
  const aplicaATodosLosCommodities = metodo?.todos_los_commodities ? "Si" : "No";
  const aplicaATodosLosClientes =
    catalogos?.tipos.find((tipo) => String(tipo.value) === String(metodo?.cod_tipo_tarifa))
      ?.label === "PUBLICA"
      ? "Si"
      : "No";

  const ultimaFechaModificacion = servicio?.ultima_fecha_modificacion
    ? formatFecha(servicio.ultima_fecha_modificacion as Date)
    : null;
  const fechaInicio = metodo?.fecha_inicial ? formatFecha(metodo.fecha_inicial) : null;
  const fechaVencimiento = metodo?.fecha_final ? formatFecha(metodo.fecha_final) : null;

  const background = vencida
    ? "bg-destructive/20"
    : proximaAVencer
      ? "bg-warning/20"
      : "bg-transparent";

  const textColor = vencida
    ? "text-destructive-foreground"
    : proximaAVencer
      ? "text-warning-foreground"
      : "text-foreground";

  const valueTextColor = "text-foreground";

  type GridSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

  const lista: { label: string; valor: ReactNode; highlight?: boolean; size: GridSize }[] = [
    { label: "Rubro", valor: item?.cod_servicio, size: 1 },
    { label: "Tarifa", valor: item?.nombre ?? "", size: 2 },
    {
      label: "Tipo Transporte",
      valor: tipoTransporte,
      highlight: tipoTransporte === "TODOS",
      size: 1,
    },
    { label: "Tipo Servicio", valor: tipoServicio, highlight: tipoServicio === "TODOS", size: 1 },
    { label: "Siglas", valor: servicio?.siglas ?? "", size: 1 },
    { label: "Carrier", valor: item?.entidad_nombre as string, size: 3 },
    { label: "Tipo Carga", valor: tipoCarga, highlight: tipoCarga === "TODOS", size: 1 },
    {
      label: "Clasificación Carga",
      valor: clasificacionCarga,
      highlight: clasificacionCarga === "TODOS",
      size: 1,
    },
    {
      label: "Tipo Aplicación",
      valor: tipoAplicacion,
      highlight: tipoAplicacion === "TODOS",
      size: 1,
    },
    { label: "Tipo Pago", valor: tipoPago, highlight: tipoPago === "TODOS", size: 1 },
    { label: "Tipo Calculo", valor: tipoCalculo, highlight: tipoCalculo === "TODOS", size: 1 },
    {
      label: "Categoria Transporte",
      valor: categoriaTransporte,
      highlight: categoriaTransporte === "TODOS",
      size: 1,
    },
    {
      label: "Tipo Clasificación",
      valor: tipoClasificacion,
      highlight: tipoClasificacion === "TODOS",
      size: 3,
    },
    { label: "Aplica a todos los orígenes", valor: aplicaATodosLosOrigenes, size: 1 },
    { label: "Aplica a todos los commodities", valor: aplicaATodosLosCommodities, size: 1 },
    { label: "Aplica a todos los clientes", valor: aplicaATodosLosClientes, size: 1 },
    { label: "Último modificador", valor: servicio?.ultima_modificador as string, size: 3 },
    { label: "Última modificación", valor: ultimaFechaModificacion, size: 1 },
    { label: "Fecha inicio", valor: fechaInicio, size: 1 },
    { label: "Fecha vencimiento", valor: fechaVencimiento, size: 1 },
  ];

  return (
    <div
      className={cn(
        "overflow-auto max-h-[calc(100vh-10rem)] max-w-[50vw] p-2",
        width,
        textColor,
        background,
        "grid grid-cols-3 gap-2",
      )}
    >
      {(vencida || proximaAVencer) && (
        <ResumenItem
          valueClassName={cn(valueTextColor, "text-lg")}
          textAlign="center"
          size={3}
          label=""
          valor={
            <div className="flex items-center justify-center gap-2">
              {vencida ? <OctagonAlert /> : proximaAVencer ? <ClockAlert /> : ""}
              {vencida ? "TARIFA VENCIDA" : proximaAVencer ? "TARIFA PROXIMA A VENCER" : ""}
            </div>
          }
        />
      )}
      {lista.map((item) => (
        <ResumenItem key={item.label} {...item} valueClassName={valueTextColor} />
      ))}
    </div>
  );
}

export default FichaResumen;
