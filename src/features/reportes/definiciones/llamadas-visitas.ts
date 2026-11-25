import { format, parseISO } from "date-fns";
import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { consultarApi } from "../api/consultar-api";
import { definirReporte } from "../lib/definir-reporte";
import { filtroCentroCosto, filtroUsuario } from "../lib/filtros";

/**
 * EJEMPLO: llamadas y visitas programadas en el rango (endpoint `report_icc`, una fila por
 * actividad). Sirve de plantilla para los demás reportes.
 */

const texto = z
  .string()
  .nullable()
  .optional()
  .transform((v) => v ?? "");
const bandera = z.coerce.number().catch(0);

const filaSchema = z.looseObject({
  actividad: zId,
  asunto: texto,
  fecha_programacion: texto,
  tipo: texto,
  nombres: texto,
  apellidos: texto,
  cc_nombre: texto,
  cliente: texto,
  estado: texto,
  con_resultado: bandera,
  finalizada: bandera,
});

type Fila = z.infer<typeof filaSchema>;

/** Fecha ISO (UTC) en día local; "" si no hay. */
const fecha = (iso: string, patron: string) => (iso ? format(parseISO(iso), patron) : "");

export const llamadasVisitas = definirReporte<Fila>({
  nomenclatura: "LLAMADAS_VISITAS",
  descripcion: "Llamadas y visitas con fecha programada en el rango",
  filtros: [filtroCentroCosto(), filtroUsuario("Asesor")],
  consultar: consultarApi("/api/appweb/report-icc", filaSchema),
  agrupacion: { filas: ["asesor"], columna: "tipo" },
  columnas: [
    { id: "actividad", label: "Actividad", valor: (f) => f.actividad },
    { id: "tipo", label: "Tipo", valor: (f) => f.tipo, agrupable: true },
    {
      id: "asesor",
      label: "Asesor",
      valor: (f) => `${f.nombres} ${f.apellidos}`.trim(),
      agrupable: true,
      buscable: true,
    },
    { id: "cc", label: "Centro de costo", valor: (f) => f.cc_nombre, agrupable: true },
    { id: "cliente", label: "Cliente", valor: (f) => f.cliente, agrupable: true, buscable: true },
    { id: "asunto", label: "Asunto", valor: (f) => f.asunto, buscable: true },
    {
      id: "fecha",
      label: "Fecha programada",
      valor: (f) => fecha(f.fecha_programacion, "dd/MM/yyyy"),
    },
    {
      id: "mes",
      label: "Mes programado",
      valor: (f) => fecha(f.fecha_programacion, "yyyy-MM"),
      agrupable: true,
    },
    { id: "estado", label: "Estado", valor: (f) => f.estado, agrupable: true },
    {
      id: "con_resultado",
      label: "Con resultado",
      valor: (f) => (f.con_resultado ? "Sí" : "No"),
      agrupable: true,
    },
    { id: "realizadas", label: "Realizadas", valor: (f) => f.finalizada, sumable: true },
  ],
});
