import { z } from "zod";
import { consultarApi } from "../../api/consultar-api";
import { ContenidoReporteProps, definirReporte, DescargaReporte, fechaEnRango } from "../../lib/definir-reporte";
import { filtroCliente, filtroTipo, filtroUsuario } from "../../lib/filtros";
import type { Filtros } from "@/features/pricing/reportes/lib/filtros-types";
import { zId } from "@/shared/lib/zod-scalars";
import { HitRate } from "../../contenido/pricing/hit-rate";
import { tipos } from "@/features/catalogos";

const texto = z.string().nullable().optional();
const bandera = z.coerce.number().catch(0);

/**
 * PLANTILLA — ENDPOINT DISTINTO (sin funciones propias)
 * Para un endpoint que trae la lista en otra propiedad, espera otros nombres de parámetros,
 * necesita un parámetro fijo o no filtra algo (ej. fechas). Todo se configura en las opciones de
 * consultarApi; las que no hagan falta se borran.
 *
 * 1. Copiar este archivo a definiciones/<modulo>/reporte-<nombre>.ts
 * 2. Cambiar las líneas marcadas con  // CAMBIAR  y borrar las  // OPCIONAL  que no se usen
 * 3. Registrarlo en definiciones/<modulo>/index.ts (ver GUIA.md, paso 3)
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

function ContenidoHitRate({ params }: ContenidoReporteProps<Fila>) {
  // HitRate elige la gráfica de transporte por el NOMBRE del tipo.
  const transportes = tipos.useLista({ tipo_tabla: "TRANSPORTE" });
  const nombreTransporte =
    transportes.data?.find((t) => String(t.codTipo) === params.cod_tipo_transporte)?.nomTipo ?? "";

  // Vacío = sin filtro (null / undefined), nunca 0.
  const opcion = (valor: string | undefined, label = "") => (valor ? { value: valor, label } : null);
  const codigo = (valor: string | undefined) =>
    valor ? { nombre: "", codigo: Number(valor) } : undefined;

  const filtros: Filtros = {
    reporte: { value: "hit-rate", label: "Hit Rate" },
    fecha_inicio: params.fecha_inicio ?? "",
    fecha_fin: params.fecha_fin ?? "",
    cod_empresa: codigo(params.cod_empresa),
    cod_cc: codigo(params.cod_cc),
    cod_usuario: opcion(params.cod_usuario),
    cod_cliente: opcion(params.cod_cliente),
    cod_tipo_pago: opcion(params.cod_tipo_pago),
    cod_tipo_transporte: opcion(params.cod_tipo_transporte, nombreTransporte),
  };

  return (
    <div className="space-y-4">
      <HitRate filtros={filtros} tipo="grafica-usuario" />
      <HitRate filtros={filtros} tipo="grafica-transporte" />
      <HitRate filtros={filtros} tipo="grafica-otros" />
    </div>
  );
}


function pdf({filas, titulo, encabezado}: DescargaReporte<Fila>)  {

}

export const reporteHitRate = definirReporte<Fila>({
  // CAMBIAR: nombre de la constante
  nomenclatura: "PRI-HR-01", // CAMBIAR
  descripcion: "Hit Rate", // CAMBIAR
  fechas: "requeridas", // CAMBIAR
  filtros: [
    // (D) opcional; SIN empresa ni CC
    filtroUsuario("Usuario", "cod_usuario"),
    filtroTipo("TIPO_PAGO", "cod_tipo_pago", "Tipo de Pago"),
    // hace falta el filtro de clientes
    filtroCliente('Cliente', 'cod_cliente'),
    filtroTipo("TRANSPORTE", "cod_tipo_transporte", "Transporte"),
  ], // CAMBIAR
  consultar: consultarApi("/api/appweb/report_kpi_cotizaciones", filaSchema, {
    // OPCIONAL: la lista no viene en data, sino en data.<propiedad>
    lista: "filas",
    // OPCIONAL: parámetros fijos que siempre se mandan
    params: { reporte: "hit_rate" },
    // OPCIONAL: el endpoint espera otros nombres (nombre de la pantalla: nombre del endpoint)
    // nombres: { cod_empresa: "cod_emp", fecha_inicio: "fecha_inicial", fecha_fin: "fecha_final" },
    // OPCIONAL: lo que el endpoint no filtra se filtra aquí (true = la fila se queda)
    // filtrar: (f, params) => fechaEnRango(f.fecha_creacion, params),
  }),
  columnas: [
    // CAMBIAR
    // { id: "texto", label: "Texto", valor: (f) => f.campo_texto, agrupable: true, buscable: true },
    // { id: "numero", label: "Número", valor: (f) => f.campo_numero, sumable: true },
    // { id: "fecha", label: "Fecha", valor: (f) => f.campo_fecha },
    
    { id: "usuario", label: "Usuario", valor: (f) => f.nombres ?? '', agrupable: true, buscable: true },
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
  ],
  agrupacion: { filas: ["usuario"] }, // (G) opcional: agrupación inicial (ids de columnas agrupables)
  descargas: { excel: true }, // OPCIONAL
  Contenido: ContenidoHitRate
});
