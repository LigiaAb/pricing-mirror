/**
 * Lógica pura del modal Seleccionar Destino / Asignar Master.
 * Paridad con Legacy/src/pages/Embarques/components/SeleccionarDestino.jsx
 * (sin las ramas muertas de correlativo creado / auto-asignación pendiente,
 * que el snapshot 2026-07-16 dejó inalcanzables).
 */

export type ModoSeleccionarDestino = "completo" | "asignar_master" | "seleccionar_destino";

export interface OpcionDestino {
  id: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  requiresDate?: boolean;
}

export const DEFAULT_DESTINO_OPTIONS: OpcionDestino[] = [
  {
    id: "bodega",
    titulo: "Enviar a Bodega",
    subtitulo: "Para retiro por COURIER",
    descripcion: "La guía se envía a bodega. Un COURIER del cliente la recogerá.",
    requiresDate: false,
  },
  {
    id: "combex_con_etiquetas",
    titulo: "Enviar a COMBEX con Etiquetas",
    subtitulo: "Crear etiquetas y programar entrega",
    descripcion:
      "Se crean etiquetas y se programa fecha de entrega. Redirige a pestaña de etiquetas.",
    requiresDate: true,
  },
  {
    id: "combex_sin_etiquetas",
    titulo: "Enviar a COMBEX sin Etiquetas",
    subtitulo: "Solo cambio de estado",
    descripcion: "Envío directo a COMBEX sin generar etiquetas.",
    requiresDate: false,
  },
];

/** Estado siguiente de la coordinación según el destino elegido. */
export const ESTADOS_DESTINO: Record<string, number> = {
  combex_con_etiquetas: 70,
  combex_sin_etiquetas: 71,
  bodega: 72,
};

const DESTINO_BUTTON_TEXT: Record<string, string> = {
  combex_con_etiquetas: "Enviar a COMBEX",
  combex: "Enviar a COMBEX",
  bodega: "Enviar a Bodega",
  etiquetas: "Ir a Imprimir Etiquetas",
};

export function getConfirmButtonText(
  selectedOption: OpcionDestino | undefined,
  processing: boolean,
): string {
  if (processing) return "Procesando...";
  if (!selectedOption) return "Selecciona opción";
  return DESTINO_BUTTON_TEXT[selectedOption.id] ?? selectedOption.titulo;
}

export interface ServicioFlags {
  esDirecto: boolean;
  esCourier: boolean;
  esConsolidado: boolean;
  /** COURIER y DIRECTO muestran el resumen de guías en vez de la lista de masters. */
  usaResumenGuias: boolean;
  /** COURIER no tiene paso de asignación de guía. */
  showStep1: boolean;
}

export function getServicioFlags(servicioNombre: string | null | undefined): ServicioFlags {
  const servicio = String(servicioNombre ?? "")
    .trim()
    .toUpperCase();
  const esDirecto = servicio === "DIRECTO";
  const esCourier = servicio === "COURIER";
  const esConsolidado = servicio === "CONSOLIDADO";
  return {
    esDirecto,
    esCourier,
    esConsolidado,
    usaResumenGuias: esCourier || esDirecto,
    showStep1: !esCourier,
  };
}

export function getWizardSteps(
  modo: ModoSeleccionarDestino,
  showStep1: boolean,
  esDirecto: boolean,
): string[] {
  if (modo === "asignar_master") return ["Asignar Guía de: Destino de Coordinación"];
  if (modo === "seleccionar_destino") return ["Confirmar destino"];
  if (!showStep1) return ["Confirmar destino"];
  return [esDirecto ? "Seleccionar guía" : "Asignar guía", "Confirmar destino"];
}

export function getTituloAsignacion(esCourier: boolean, esDirecto: boolean): string {
  if (esCourier) return "Asignación para retiro en bodega";
  if (esDirecto) return "Asignación de Master";
  return "Asignación previa a envío a COMBEX";
}

export function getResumenGuiasDescription(esDirecto: boolean): string {
  if (esDirecto) return "La guía se asignara automaticamente.";
  return "Se consultó listar master disponibles para esta coordinación. Puede asignar la guía para continuar sin seleccionar un número de master manualmente.";
}

export function getAsignarGuiaLabel(isPending: boolean, esDirecto: boolean): string {
  if (isPending) return "Asignando...";
  if (esDirecto) return "Asignar Master";
  return "Asignar guía y continuar";
}

/** Forma mínima de una fila de listar-master-disponibles usada por el modal. */
export interface MasterDisponibleRow {
  correlativoGuiaMaster: string;
  guiaCoordinacion: string;
  idFile: string | number;
  paisDestino: string;
  clienteCoordinacion: string;
  lineaAerea: string;
}

export interface MasterAgrupado {
  masterGuia: string;
  houses: string[];
  paisDestino: string;
  cliente: string;
  lineaAerea: string;
}

export function filtrarMasters<T extends MasterDisponibleRow>(
  masters: readonly T[],
  searchQuery: string,
): T[] {
  const query = String(searchQuery ?? "")
    .trim()
    .toLowerCase();
  if (!query) return [...masters];
  return masters.filter((m) =>
    `${m.correlativoGuiaMaster} ${m.guiaCoordinacion} ${m.idFile} ${m.paisDestino} ${m.clienteCoordinacion} ${m.lineaAerea}`
      .toLowerCase()
      .includes(query),
  );
}

export function agruparMasters(masters: readonly MasterDisponibleRow[]): MasterAgrupado[] {
  const map = new Map<string, MasterAgrupado>();
  for (const item of masters) {
    const masterGuia = item.correlativoGuiaMaster ?? "";
    if (!map.has(masterGuia)) {
      map.set(masterGuia, {
        masterGuia,
        houses: [],
        paisDestino: item.paisDestino ?? "",
        cliente: item.clienteCoordinacion ?? "",
        lineaAerea: item.lineaAerea ?? "",
      });
    }
    if (item.guiaCoordinacion) {
      map.get(masterGuia)?.houses.push(item.guiaCoordinacion);
    }
  }
  return Array.from(map.values());
}

export interface AsignarGuiaDisabledInput {
  isPending: boolean;
  isLoadingMasters: boolean;
  esConsolidado: boolean;
  mastersCount: number;
  selectedMaster: string;
}

/** CONSOLIDADO exige elegir una master de la lista; DIRECTO/COURIER asignan sin selección. */
export function isAsignarGuiaDisabled({
  isPending,
  isLoadingMasters,
  esConsolidado,
  mastersCount,
  selectedMaster,
}: AsignarGuiaDisabledInput): boolean {
  return (
    isPending ||
    isLoadingMasters ||
    (esConsolidado && mastersCount === 0) ||
    (esConsolidado && !selectedMaster)
  );
}

/**
 * Guía que se muestra/verifica en el modal según el servicio: master para
 * CONSOLIDADO/DIRECTO, house para el resto (B.2 del plan de paridad).
 */
export function selectExistingGuia(
  servicioNombre: string,
  correlativoGuiaMaster: string | null,
  correlativoGuia: string,
): string {
  const { esConsolidado, esDirecto } = getServicioFlags(servicioNombre);
  if (esConsolidado || esDirecto) return correlativoGuiaMaster ?? "";
  return correlativoGuia;
}

/** Fecha default del picker de entrega COMBEX: mañana. */
export function fechaEntregaDefault(hoy: Date = new Date()): Date {
  const d = new Date(hoy);
  d.setDate(d.getDate() + 1);
  return d;
}
