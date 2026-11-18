/* ==========================================================================
 * ASIGNACIÓN DE GUÍAS (SOLO MAQUETA)
 *
 * Misma lógica que el módulo actual (`components/modales/seleccionar-destino/
 * destino-model.ts`, paridad con el Legacy), según el servicio del embarque
 * (por nombre, no por código):
 *
 *   CONSOLIDADO → se elige la master de la lista de disponibles (o se crea una
 *                 nueva si no hay); sin master elegida no se asigna.
 *   DIRECTO     → la master la asigna el sistema.
 *   COURIER     → no lleva master (retiro en bodega).
 *
 * La HAWB siempre la asigna el sistema (correlativo, sin duplicados ni saltos).
 * API del módulo actual: `useListarMasterDisponiblesCoordinacion` (lista),
 * `useAsignarMasterCoordinacion` ({ embarque_id, cod_file, num_guia_master? })
 * y `useFetchGuiasCoordinacion` (verifica que quedó asignada).
 * ========================================================================== */

export type ServicioGuias = "consolidado" | "directo" | "courier";

/** Servicio por su nombre (sin distinguir mayúsculas ni tildes); null = sin regla. */
export function servicioGuias(nombre: string | null | undefined): ServicioGuias | null {
  const servicio = (nombre ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase();
  if (servicio === "CONSOLIDADO") return "consolidado";
  if (servicio === "DIRECTO") return "directo";
  if (servicio === "COURIER") return "courier";
  return null;
}

/** Fila de masters disponibles (mismos nombres que el módulo actual). */
export type MasterDisponibleRow = {
  correlativoGuiaMaster: string;
  guiaCoordinacion: string;
  idFile: string | number;
  paisDestino: string;
  clienteCoordinacion: string;
  lineaAerea: string;
};

/** Una master con sus houses (tarjeta de la lista). */
export type MasterAgrupado = {
  masterGuia: string;
  houses: string[];
  paisDestino: string;
  cliente: string;
  lineaAerea: string;
};

/** Búsqueda en master, house, file, país, cliente y línea aérea. */
export function filtrarMasters(
  masters: readonly MasterDisponibleRow[],
  busqueda: string,
): MasterDisponibleRow[] {
  const texto = busqueda.trim().toLowerCase();
  if (!texto) return [...masters];
  return masters.filter((m) =>
    `${m.correlativoGuiaMaster} ${m.guiaCoordinacion} ${m.idFile} ${m.paisDestino} ${m.clienteCoordinacion} ${m.lineaAerea}`
      .toLowerCase()
      .includes(texto),
  );
}

/** Agrupa por master, con sus houses. */
export function agruparMasters(masters: readonly MasterDisponibleRow[]): MasterAgrupado[] {
  const grupos = new Map<string, MasterAgrupado>();
  for (const item of masters) {
    const grupo = grupos.get(item.correlativoGuiaMaster) ?? {
      masterGuia: item.correlativoGuiaMaster,
      houses: [],
      paisDestino: item.paisDestino,
      cliente: item.clienteCoordinacion,
      lineaAerea: item.lineaAerea,
    };
    if (item.guiaCoordinacion) grupo.houses.push(item.guiaCoordinacion);
    grupos.set(item.correlativoGuiaMaster, grupo);
  }
  return [...grupos.values()];
}

/** Masters disponibles de ejemplo (se reemplazan por la API). */
export const MASTERS_MAQUETA: readonly MasterDisponibleRow[] = [
  {
    correlativoGuiaMaster: "202-12345675",
    guiaCoordinacion: "CRP-000098",
    idFile: "000098",
    paisDestino: "ESTADOS UNIDOS",
    clienteCoordinacion: "AGROEXPORT S.A.",
    lineaAerea: "AVIANCA",
  },
  {
    correlativoGuiaMaster: "202-12345675",
    guiaCoordinacion: "CRP-000099",
    idFile: "000099",
    paisDestino: "ESTADOS UNIDOS",
    clienteCoordinacion: "CAFÉ DE ALTURA",
    lineaAerea: "AVIANCA",
  },
  {
    correlativoGuiaMaster: "075-67690571",
    guiaCoordinacion: "CRP-000097",
    idFile: "000097",
    paisDestino: "SUIZA",
    clienteCoordinacion: "NELIXIA S.A.",
    lineaAerea: "IBERIA",
  },
  {
    correlativoGuiaMaster: "006-45464786",
    guiaCoordinacion: "",
    idFile: "",
    paisDestino: "ESTADOS UNIDOS",
    clienteCoordinacion: "",
    lineaAerea: "DELTA",
  },
];
