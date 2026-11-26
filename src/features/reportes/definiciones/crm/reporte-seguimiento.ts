import {
  type HistorialActividad,
  historialActividadSchema,
} from "@/features/actividades/api/historial-actividades";
import { empresas } from "@/features/catalogos";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { formatearFechaHora } from "@/shared/lib/date";
import { definirReporte, type ParamsReporte } from "../../lib/definir-reporte";
import { filtroCliente } from "../../lib/filtros";

/**
 * SEGUIMIENTO (historial de seguimientos de un cliente)
 *
 * Igual al "Seguimiento" de Reportes CRM: `historial-actividades` del cliente elegido, solo de la
 * empresa y el centro de costo de la consulta, de la más reciente a la más antigua.
 */
async function consultar(params: ParamsReporte): Promise<HistorialActividad[]> {
  if (!params.cod_cliente) return [];
  const [filas, listaEmpresas] = await Promise.all([
    http
      .get<unknown>("/api/appweb/historial-actividades", {
        params: { entidad_id: params.cod_cliente },
      })
      .then((respuesta) =>
        parseEnvelope(respuesta, historialActividadSchema, "historial-actividades"),
      ),
    params.cod_empresa ? empresas.fetchLista() : Promise.resolve([]),
  ]);
  // Respaldo del legacy: filas sin `cod_empresa` se comparan por nombre de empresa.
  const empresaNombre =
    listaEmpresas.find((e) => String(e.cod_empresa) === params.cod_empresa)?.nombre_emp ?? "";
  return filas
    .filter(
      (fila) =>
        (!params.cod_empresa ||
          (fila.cod_empresa
            ? String(fila.cod_empresa) === params.cod_empresa
            : fila.nombre_empresa === empresaNombre)) &&
        (!params.cod_cc || String(fila.cod_cenco ?? "") === params.cod_cc),
    )
    .sort(
      (a, b) => new Date(b.fecha_programada).getTime() - new Date(a.fecha_programada).getTime(),
    );
}

export const reporteSeguimiento = definirReporte<HistorialActividad>({
  nomenclatura: "CRM-S-06",
  descripcion: "Historial de seguimientos del cliente",
  fechas: "ninguna",
  filtros: [{ ...filtroCliente("Cliente", "cod_cliente"), requerido: true }],
  consultar,
  columnas: [
    {
      id: "departamento",
      label: "Departamento",
      valor: (f) => f.nombre_cenco,
      agrupable: true,
      buscable: true,
    },
    {
      id: "seguimiento",
      label: "Seguimiento",
      valor: (f) => f.nom_tipo,
      agrupable: true,
      buscable: true,
    },
    {
      id: "responsable",
      label: "Responsable",
      valor: (f) => f.nombre_usuario,
      agrupable: true,
      buscable: true,
    },
    { id: "fecha", label: "Fecha", valor: (f) => formatearFechaHora(f.fecha_programada) },
    { id: "descripcion", label: "Descripción", valor: (f) => f.descripcion, buscable: true },
    { id: "resultado", label: "Resultado", valor: (f) => f.resultado, buscable: true },
  ],
  descargas: { excel: true },
});
