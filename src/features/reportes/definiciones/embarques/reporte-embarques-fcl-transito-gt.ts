import { format } from "date-fns";
import { z } from "zod";
import { consultarApi } from "../../api/consultar-api";
import { type ColumnaReporte, definirReporte } from "../../lib/definir-reporte";
import { excelResaltandoVacios } from "../../lib/excel-vacios";

/**
 * EMB-EFCLTGT-01 Embarques FCL en tránsito GT.
 * Endpoint con un SQL fijo en Oracle (`reportes_embarques_transito.js` del back): no recibe
 * parámetros (empresa, departamento y cliente van dentro del SQL), por eso no lleva fechas,
 * filtros, empresa ni CC. Las fechas llegan como texto local `YYYY-MM-DDTHH:mm:ss`. Las claves
 * llegan en minúsculas (el cliente HTTP las normaliza), aunque Oracle las devuelva en mayúsculas.
 */
const texto = z.string().nullable().catch(null);
const filaSchema = z.looseObject({
  coordinacion: z.union([z.string(), z.number()]).transform(String).nullable().catch(null),
  numero_contenedor: texto,
  booking: texto,
  orden_compra: texto,
  pod: texto,
  transbordo_nave: texto,
  etd: texto,
  atd: texto,
  eta: texto,
});
type Fila = z.infer<typeof filaSchema>;

/** `YYYY-MM-DDTHH:mm:ss` (hora local) → `dd/MM/yyyy`; vacía o inválida → null. */
const fecha = (valor: string | null): string | null => {
  const dia = valor ? new Date(valor) : null;
  return dia && !Number.isNaN(dia.getTime()) ? format(dia, "dd/MM/yyyy") : null;
};

const columnas: readonly ColumnaReporte<Fila>[] = [
  { id: "coordinacion", label: "Coordinación", valor: (f) => f.coordinacion, buscable: true },
  { id: "contenedor", label: "No. contenedor", valor: (f) => f.numero_contenedor, buscable: true },
  { id: "booking", label: "Booking", valor: (f) => f.booking, buscable: true },
  { id: "orden_compra", label: "Orden de compra", valor: (f) => f.orden_compra, buscable: true },
  { id: "pod", label: "POD", valor: (f) => f.pod, buscable: true },
  { id: "nave", label: "Transbordo / nave", valor: (f) => f.transbordo_nave, buscable: true },
  { id: "etd", label: "ETD", valor: (f) => fecha(f.etd) },
  { id: "atd", label: "ATD", valor: (f) => fecha(f.atd) },
  { id: "eta", label: "ETA", valor: (f) => fecha(f.eta) },
];

export const reporteEmbarquesFclTransitoGt = definirReporte<Fila>({
  nomenclatura: "EMB-EFCLTGT-01",
  descripcion: "Embarques FCL de importación en tránsito (sin ATA)",
  fechas: "ninguna",
  empresaCentroCosto: false,
  agrupado: false,
  consultar: consultarApi("/api/appweb/reporte-emb-fcl-transito-gt", filaSchema),
  columnas,
  descargas: { excel: excelResaltandoVacios(columnas) },
});
