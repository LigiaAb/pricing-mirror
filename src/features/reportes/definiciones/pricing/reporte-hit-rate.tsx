import { z } from "zod";
import type { Filtros } from "@/features/pricing/reportes/lib/filtros-types";
import { zId } from "@/shared/lib/zod-scalars";
import { consultarApi } from "../../api/consultar-api";
import { HitRate } from "../../contenido/pricing/hit-rate";
import { type ContenidoReporteProps, definirReporte, porcentaje } from "../../lib/definir-reporte";
import { filtroCliente, filtroTipo, filtroUsuario } from "../../lib/filtros";

const texto = z.string().nullable().optional();
const bandera = z.coerce.number().catch(0);

/**
 * HIT RATE (PRI-HR-01): filas de `report_kpi_cotizaciones` (`reporte: "hit_rate"`) para el
 * Resumen agrupado; gráficas, tablas y PDF con las vistas de Hit Rate de pricing
 * (`contenido/pricing/hit-rate.tsx`, que consultan `report_hit_rate`).
 */

const filaSchema = z.looseObject({
  cotizacion: zId,
  fecha_creacion: texto,
  fecha_aprobacion: texto,
  usuario: zId,
  nombres: texto,
  apellidos: texto,
  cc: zId.nullable().optional(),
  cc_nombre: texto,
  transporte: texto,
  tipo_pago: texto,
  cliente: texto,
  /** Para buscar la cabecera completa en la ficha (filtros de lista-cotizacion-cabecera). */
  cod_cliente: zId.nullable().optional(),
  cod_empresa: zId.nullable().optional(),
  estado: texto,
  /**
   * Origen y destino de la cabecera: nombre y código del punto de enlace o, si no hay
   * (terrestre), de la ciudad; el país, del punto de enlace o de la ciudad.
   */
  origen: texto,
  origen_codigo: texto,
  origen_pais: texto,
  destino: texto,
  destino_codigo: texto,
  destino_pais: texto,
  /** Proveedores de los rubros de flete de la versión activa ("A / B" si hay varios). */
  carrier: texto,
  realizada: bandera,
  cerrada: bandera,
  /**
   * Solo Realización de Precio, en las cerradas (igual que report_realizacion_de_precio):
   * sin Spot activo; con algún Spot de venta menor a la original; con alguno mayor.
   * Una cotización puede tener `spot_bajo` y `spot_alto` a la vez.
   */
  sin_spot: bandera,
  spot_bajo: bandera,
  spot_alto: bandera,
});
type Fila = z.infer<typeof filaSchema>;

/**
 * Los filtros de la consulta en el formato de las vistas de pricing. Los nombres salen del
 * encabezado (la clave es el `label` de cada filtro). Vacío = sin filtro (null / undefined).
 */
function filtrosPricing(
  params: ContenidoReporteProps<Fila>["params"],
  encabezado: Record<string, string>,
): Filtros {
  const opcion = (valor: string | undefined, label = "") =>
    valor ? { value: valor, label } : null;
  const codigo = (valor: string | undefined, nombre = "") =>
    valor ? { nombre, codigo: Number(valor) } : undefined;
  return {
    reporte: { value: "hit-rate", label: "Hit Rate" },
    fecha_inicio: params.fecha_inicio ?? "",
    fecha_fin: params.fecha_fin ?? "",
    cod_empresa: codigo(params.cod_empresa, encabezado.Empresa),
    cod_cc: codigo(params.cod_cc, encabezado["Centro de costo"]),
    cod_usuario: opcion(params.cod_usuario, encabezado.Usuario),
    cod_cliente: opcion(params.cod_cliente, encabezado.Cliente),
    cod_tipo_pago: opcion(params.cod_tipo_pago, encabezado["Tipo de Pago"]),
    // HitRate elige la gráfica de transporte por el NOMBRE del tipo.
    cod_tipo_transporte: opcion(params.cod_tipo_transporte, encabezado.Transporte),
  };
}

function ContenidoHitRate({
  params,
  encabezado,
  solicitudPdf,
  onGenerandoPdf,
  onErrorPdf,
}: ContenidoReporteProps<Fila>) {
  const filtros = filtrosPricing(params, encabezado);
  return (
    <div className="space-y-4">
      <HitRate filtros={filtros} tipo="grafica-usuario" />
      <HitRate filtros={filtros} tipo="grafica-transporte" />
      <HitRate filtros={filtros} tipo="grafica-otros" />
      <HitRate filtros={filtros} tipo="tablas" />
      {/* Botón PDF de la pantalla (`pdf: "contenido"`): el mismo PDF de Hit Rate de pricing. */}
      <HitRate
        filtros={filtros}
        tipo="descarga"
        descargar={solicitudPdf}
        onGenerandoPdf={onGenerandoPdf}
        onErrorPdf={onErrorPdf}
      />
    </div>
  );
}

export const reporteHitRate = definirReporte<Fila>({
  nomenclatura: "PRI-HR-01",
  descripcion: "Hit Rate",
  fechas: "requeridas",
  filtros: [
    filtroUsuario("Usuario", "cod_usuario"),
    filtroTipo("PAGO", "cod_tipo_pago", "Tipo de Pago"),
    filtroCliente("Cliente", "cod_cliente"),
    filtroTipo("TRANSPORTE", "cod_tipo_transporte", "Transporte"),
  ],
  consultar: consultarApi("/api/appweb/report_kpi_cotizaciones", filaSchema, {
    lista: "filas",
    params: { reporte: "hit_rate" },
  }),
  columnas: [
    {
      id: "usuario",
      label: "Usuario",
      valor: (f) => f.nombres ?? "",
      agrupable: true,
      buscable: true,
    },
    {
      id: "cc_nombre",
      label: "Centro de Costo",
      valor: (f) => f.cc_nombre ?? "",
      agrupable: true,
    },
    {
      id: "transporte",
      label: "Tipo de transporte",
      valor: (f) => f.transporte ?? "",
      agrupable: true,
      buscable: true,
    },
    {
      id: "cliente",
      label: "Cliente",
      valor: (f) => f.cliente ?? "",
      agrupable: true,
      buscable: true,
    },
    {
      id: "tipo_pago",
      label: "Tipo de pago",
      valor: (f) => f.tipo_pago ?? "",
      agrupable: true,
      buscable: true,
    },
    {
      id: "estado",
      label: "Estado",
      valor: (f) => f.estado ?? "",
      agrupable: true,
      buscable: true,
    },
    {
      id: "origen",
      label: "Origen",
      valor: (f) => f.origen ?? "",
      agrupable: true,
      buscable: true,
    },
    {
      id: "destino",
      label: "Destino",
      valor: (f) => f.destino ?? "",
      agrupable: true,
      buscable: true,
    },
    {
      id: "carrier",
      label: "Carrier",
      valor: (f) => f.carrier ?? "",
      agrupable: true,
      buscable: true,
    },
    // { id: "anio", label: "Año", valor: (f) => f.anio ?? '' },
    // { id: "mes", label: "Mes", valor: (f) => f.mes ?? '' },
    /** Último nivel recomendado: una fila por cotización. */
    { id: "cotizacion", label: "Cotización", valor: (f) => f.cotizacion },
    // Medidas del Resumen agrupado, como la tabla dinámica de Hit Rate de pricing (`tabla-kpi.ts`).
    { id: "realizada", label: "Realizadas", valor: (f) => f.realizada, sumable: true },
    { id: "cerrada", label: "Cerradas", valor: (f) => f.cerrada, sumable: true },
    {
      id: "hr",
      label: "HR %",
      valor: (f) => porcentaje(f.cerrada, f.realizada),
      calculada: (s) => porcentaje(s.cerrada, s.realizada),
    },
  ],
  agrupacion: { filas: ["usuario"] },
  descargas: { excel: true, pdf: "contenido" },
  Contenido: ContenidoHitRate,
});
