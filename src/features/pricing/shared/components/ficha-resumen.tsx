"use client";

import { format, isValid, parseISO } from "date-fns";
import { ClockAlert, OctagonAlert } from "lucide-react";
import React, { type ReactNode } from "react";
import {
  relacionTipo as catalogoRelacionTipo,
  servicios as catalogoServicios,
  tipos as catalogoTipos,
} from "@/features/catalogos";
import { cn } from "@/shared/lib/utils";
import { useMetodos } from "../api/metodos";
import { getEstadoMetodo } from "../lib/vigencia-metodo";
import { ResumenItem } from "./resumen-item";

type Id = string | number;
type Registro = Record<string, unknown>;

/** Lo mínimo que la ficha necesita del rubro/servicio (Due Agent, Due Carrier o fila de Tarifas). */
export type ItemFichaResumen = {
  cod_servicio?: Id | null;
  nombre?: string | null;
  entidad_nombre?: unknown;
  [key: string]: unknown;
};

type Props = {
  item: ItemFichaResumen | null;

  estado?: "pro";

  width?: string;
};

/* ==========================================================================
 * CATÁLOGOS DE LA FICHA
 *
 * Lee directamente de @/features/catalogos (React Query comparte la caché con
 * Tarifas y Cotizaciones, no hay consultas extra). Así la ficha no depende de
 * ninguno de los dos módulos.
 * ========================================================================== */

/** Lee un campo en snake_case o en camelCase (el backend manda uno u otro). */
function leer(item: Registro, snake: string): unknown {
  const camel = snake.replace(/_([a-z])/g, (_, letra: string) => letra.toUpperCase());
  return item[snake] ?? item[camel];
}

const esActivo = (item: Registro) => Number(leer(item, "cod_estado")) === 1;

function useCatalogosFicha() {
  const servicios = catalogoServicios.useLista();
  const metodos = useMetodos();
  const tipos = catalogoTipos.useLista();
  const relaciones = catalogoRelacionTipo.useLista({ cod_estado: 1 });

  return React.useMemo(() => {
    const listaTipos = (tipos.data ?? []) as Registro[];
    const listaRelaciones = ((relaciones.data ?? []) as Registro[]).filter(esActivo);

    /** Etiqueta de un tipo activo de la tabla `tabla` (tabla genérica de tipos). */
    const etiquetaTipo = (tabla: string, value: unknown) => {
      const tipo = listaTipos.find(
        (item) =>
          esActivo(item) &&
          leer(item, "tipo_tabla") === tabla &&
          String(item.cod_tipo) === String(value),
      );
      return tipo ? String(tipo.label ?? tipo.nom_tipo ?? "") : "";
    };

    /** Etiqueta de una relación de tipos cuyo padre es TRANSPORTE. */
    const etiquetaRelacionTransporte = (tabla: string, value: unknown) => {
      const relacion = listaRelaciones.find(
        (item) =>
          leer(item, "tipo_tabla") === tabla &&
          leer(item, "tipo_padre_tabla") === "TRANSPORTE" &&
          String(item.cod_tipo) === String(value),
      );
      return relacion ? String(relacion.label ?? relacion.tipo_desc ?? "") : "";
    };

    /** Etiqueta de cualquier tipo (sin filtrar por tabla ni estado). */
    const etiquetaCualquierTipo = (value: unknown) => {
      const tipo = listaTipos.find((item) => String(item.cod_tipo) === String(value));
      return tipo ? String(tipo.label ?? tipo.nom_tipo ?? "") : "";
    };

    return {
      servicios: (servicios.data ?? []) as Registro[],
      metodos: (metodos.data ?? []) as Registro[],
      etiquetaTipo,
      etiquetaRelacionTransporte,
      etiquetaCualquierTipo,
    };
  }, [servicios.data, metodos.data, tipos.data, relaciones.data]);
}

/* ==========================================================================
 * FICHA RESUMEN
 * ========================================================================== */

/**
 * Fecha "dd/MM/yyyy" tomando el día en UTC (las fechas del backend llegan a
 * medianoche UTC; formatearlas en hora local mostraría el día anterior).
 */
const formatFechaUTC = (fecha?: unknown) => {
  if (!fecha) {
    return null;
  }

  const valor = typeof fecha === "string" ? parseISO(fecha) : (fecha as Date);

  if (!(valor instanceof Date) || !isValid(valor)) {
    return null;
  }

  return format(parseISO(valor.toISOString().split("T")[0] ?? ""), "dd/MM/yyyy");
};

export function FichaResumen({ item, width = "w-[300px]" }: Props) {
  const { servicios, metodos, etiquetaTipo, etiquetaRelacionTransporte, etiquetaCualquierTipo } =
    useCatalogosFicha();

  const servicio = servicios.find((servicio) => servicio.cod_servicio === item?.cod_servicio);
  const metodo = metodos.find(
    (metodo) => String(metodo.cod_servicio) === String(item?.cod_servicio),
  );

  const { vencida, proximaAVencer } = getEstadoMetodo(
    metodo?.fecha_final as Date | string | null | undefined,
  );

  const tipoTransporte = etiquetaTipo("TRANSPORTE", servicio?.cod_tipo_transporte);
  const tipoServicio = etiquetaRelacionTransporte("SERVICIO", servicio?.cod_tipo_servicio);
  const tipoCarga = etiquetaTipo("TIPO_CARGA", servicio?.cod_tipo_carga);
  const tipoPago = etiquetaTipo("PAGO", servicio?.cod_tipo_pago);
  const clasificacionCarga = etiquetaTipo("CLASIFICACION_CARGA", servicio?.cod_clasificacion_carga);
  const tipoAplicacion = etiquetaTipo("APLICACION", servicio?.cod_tipo_aplicacion);
  const tipoCalculo = etiquetaTipo("CALCULO", servicio?.cod_tipo_calculo);
  const categoriaTransporte = etiquetaTipo("CATEGORIA_TRANSPORTE", servicio?.categoria);
  const tipoClasificacion = etiquetaRelacionTransporte(
    "CLASIFICACION_SERVICIO",
    servicio?.clasificacion,
  );
  const aplicaATodosLosOrigenes = metodo?.todos_los_paises ? "Si" : "No";
  const aplicaATodosLosCommodities = metodo?.todos_los_commodities ? "Si" : "No";
  const aplicaATodosLosClientes =
    etiquetaCualquierTipo(metodo?.cod_tipo_tarifa) === "PUBLICA" ? "Si" : "No";

  const ultimaFechaModificacion = formatFechaUTC(servicio?.ultima_fecha_modificacion);
  const fechaInicio = formatFechaUTC(metodo?.fecha_inicial);
  const fechaVencimiento = formatFechaUTC(metodo?.fecha_final);

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
    { label: "Rubro", valor: item?.cod_servicio ?? null, size: 1 },
    { label: "Tarifa", valor: item?.nombre ?? "", size: 2 },
    {
      label: "Tipo Transporte",
      valor: tipoTransporte,
      highlight: tipoTransporte === "TODOS",
      size: 1,
    },
    { label: "Tipo Servicio", valor: tipoServicio, highlight: tipoServicio === "TODOS", size: 1 },
    { label: "Siglas", valor: (servicio?.siglas as ReactNode) ?? "", size: 1 },
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
