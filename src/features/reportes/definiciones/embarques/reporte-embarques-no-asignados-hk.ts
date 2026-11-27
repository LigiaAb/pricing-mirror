import { format } from "date-fns";
import { z } from "zod";
import { consultarApi } from "../../api/consultar-api";
import { type ColumnaReporte, definirReporte } from "../../lib/definir-reporte";
import { filtroCliente } from "../../lib/filtros";

/**
 * EMB-ENAHK-02 Embarques no asignados a HK.
 * Endpoint con un SQL fijo en Oracle (`reportes_embarques_transito.js` del back): empresa,
 * departamento y producto van dentro del SQL (sin empresa ni CC). Filtros opcionales: cliente
 * (sin él, el back usa el 1843) y período sobre la ETD. Las fechas llegan como texto local
 * `YYYY-MM-DDTHH:mm:ss`. Las claves llegan en minúsculas (el cliente HTTP las normaliza), aunque
 * Oracle las devuelva en mayúsculas.
 */
const texto = z.string().nullable().catch(null);
const filaSchema = z.looseObject({
  coordinacion: z.union([z.string(), z.number()]).transform(String).nullable().catch(null),
  doc_embarque: texto,
  proveedor_origen: texto,
  orden_compra: texto,
  etd: texto,
  atd: texto,
  eta: texto,
  ata: texto,
});
type Fila = z.infer<typeof filaSchema>;

/** `YYYY-MM-DDTHH:mm:ss` (hora local) → `dd/MM/yyyy`; vacía o inválida → null. */
const fecha = (valor: string | null): string | null => {
  const dia = valor ? new Date(valor) : null;
  return dia && !Number.isNaN(dia.getTime()) ? format(dia, "dd/MM/yyyy") : null;
};

const columnas: readonly ColumnaReporte<Fila>[] = [
  { id: "coordinacion", label: "Coordinación", valor: (f) => f.coordinacion, buscable: true },
  { id: "doc_embarque", label: "Doc. embarque", valor: (f) => f.doc_embarque, buscable: true },
  {
    id: "proveedor_origen",
    label: "Proveedor origen",
    valor: (f) => f.proveedor_origen,
    buscable: true,
  },
  { id: "orden_compra", label: "Orden de compra", valor: (f) => f.orden_compra, buscable: true },
  { id: "etd", label: "ETD", valor: (f) => fecha(f.etd) },
  { id: "atd", label: "ATD", valor: (f) => fecha(f.atd) },
  { id: "eta", label: "ETA", valor: (f) => fecha(f.eta) },
  { id: "ata", label: "ATA", valor: (f) => fecha(f.ata) },
];

export const reporteEmbarquesNoAsignadosHk = definirReporte<Fila>({
  nomenclatura: "EMB-ENAHK-02",
  descripcion: "Embarques de importación no asignados a HK (sin coordinación relacionada)",
  fechas: "ninguna",
  filtros: [{ ...filtroCliente(), requerido: true }],
  empresaCentroCosto: false,
  agrupado: false,
  consultar: consultarApi("/api/appweb/reporte-emb-no-asignados-hk", filaSchema),
  columnas,
  descargas: { excel: true },
});
