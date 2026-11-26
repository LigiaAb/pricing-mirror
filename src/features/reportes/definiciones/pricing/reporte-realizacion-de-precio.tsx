import { z } from "zod";
import type { Filtros } from "@/features/pricing/reportes/lib/filtros-types";
import { zId } from "@/shared/lib/zod-scalars";
import { consultarApi } from "../../api/consultar-api";
import RealizacionDePrecio from "../../contenido/pricing/realizacion-de-precio";
import { type ContenidoReporteProps, definirReporte, porcentaje } from "../../lib/definir-reporte";
import { filtroCliente, filtroTipo, filtroUsuario } from "../../lib/filtros";

const texto = z.string().nullable().optional();
const bandera = z.coerce.number().catch(0);

/**
 * REALIZACIÓN DE PRECIO (PRI-RP-02): filas de `report_kpi_cotizaciones`
 * (`reporte: "realizacion_de_precio"`) para el Resumen agrupado; gráfica, tablas y PDF con las
 * vistas de Realización de Precio de pricing (`contenido/pricing/realizacion-de-precio.tsx`, que
 * consultan `report_realizacion_de_precio`). Mismo schema y columnas que `reporte-hit-rate.tsx`.
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
    reporte: { value: "realizacion-de-precio", label: "Realización de Precio" },
    fecha_inicio: params.fecha_inicio ?? "",
    fecha_fin: params.fecha_fin ?? "",
    cod_empresa: codigo(params.cod_empresa, encabezado.Empresa),
    cod_cc: codigo(params.cod_cc, encabezado["Centro de costo"]),
    cod_usuario: opcion(params.cod_usuario, encabezado.Usuario),
    cod_cliente: opcion(params.cod_cliente, encabezado.Cliente),
    cod_tipo_pago: opcion(params.cod_tipo_pago, encabezado["Tipo de Pago"]),
    cod_tipo_transporte: null,
  };
}

function ContenidoRealizacionDePrecio({
  params,
  encabezado,
  solicitudPdf,
  onGenerandoPdf,
  onErrorPdf,
}: ContenidoReporteProps<Fila>) {
  const filtros = filtrosPricing(params, encabezado);
  return (
    <div className="space-y-4">
      <RealizacionDePrecio filtros={filtros} tipo="grafica-usuario" />
      <RealizacionDePrecio filtros={filtros} tipo="tablas" />
      {/* Botón PDF de la pantalla (`pdf: "contenido"`): el mismo PDF de RdP de pricing. */}
      <RealizacionDePrecio
        filtros={filtros}
        tipo="descarga"
        descargar={solicitudPdf}
        onGenerandoPdf={onGenerandoPdf}
        onErrorPdf={onErrorPdf}
      />
    </div>
  );
}

export const reporteRealizacionDePrecio = definirReporte<Fila>({
  nomenclatura: "PRI-RP-02",
  descripcion: "Realización de Precio",
  fechas: "requeridas",
  filtros: [
    filtroUsuario("Usuario", "cod_usuario"),
    filtroTipo("PAGO", "cod_tipo_pago", "Tipo de Pago"),
    filtroCliente("Cliente", "cod_cliente"),
  ],
  consultar: consultarApi("/api/appweb/report_kpi_cotizaciones", filaSchema, {
    lista: "filas",
    params: { reporte: "realizacion_de_precio" },
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
    /** Último nivel recomendado: una fila por cotización. */
    { id: "cotizacion", label: "Cotización", valor: (f) => f.cotizacion },
    // Medidas del Resumen agrupado, como la tabla dinámica de RdP de pricing (`tabla-kpi.ts`).
    { id: "realizada", label: "Realizadas", valor: (f) => f.realizada, sumable: true },
    { id: "spot_alto", label: "Sobre tarifa", valor: (f) => f.spot_alto, sumable: true },
    {
      id: "rdps",
      label: "RdPs %",
      valor: (f) => porcentaje(f.spot_alto, f.realizada),
      calculada: (s) => porcentaje(s.spot_alto, s.realizada),
    },
    { id: "spot_bajo", label: "Spot", valor: (f) => f.spot_bajo, sumable: true },
    {
      id: "rdpd",
      label: "RdPd %",
      valor: (f) => porcentaje(f.spot_bajo, f.realizada),
      calculada: (s) => porcentaje(s.spot_bajo, s.realizada),
    },
    { id: "sin_spot", label: "Tarifa publicada", valor: (f) => f.sin_spot, sumable: true },
    {
      id: "rdpp",
      label: "RdPp %",
      valor: (f) => porcentaje(f.sin_spot, f.realizada),
      calculada: (s) => porcentaje(s.sin_spot, s.realizada),
    },
  ],
  agrupacion: { filas: ["usuario"] },
  descargas: { excel: true, pdf: "contenido" },
  Contenido: ContenidoRealizacionDePrecio,
});
