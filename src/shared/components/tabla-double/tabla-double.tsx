"use client";

// import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Eye, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ColumnaTabla {
  key: string;
  label: string;
  moneda?: string;
  excluirTotal?: boolean;
  /** Muestra el valor tal cual (texto, alineado a la izquierda) en vez de formatearlo como monto. */
  texto?: boolean;
  /** Conteo (p. ej. cantidad de facturas): entero sin decimales, alineado a la derecha. */
  entero?: boolean;
  /** Muestra la columna antes de la columna del árbol (por defecto va después). */
  antesDeNombre?: boolean;
}

/** Separa las columnas que van antes y después de la columna del árbol. */
function dividirColumnas(columns: ColumnaTabla[]) {
  return {
    antes: columns.filter((c) => c.antesDeNombre),
    despues: columns.filter((c) => !c.antesDeNombre),
  };
}

export interface TreeNode {
  id: string;
  label: string;
  values?: Record<string, number | string>;
  children?: TreeNode[];
  [key: string]: unknown;
}

interface AccionFila {
  /** Identificador único de la acción (usado como key) */
  id: string;
  /** Texto del tooltip / aria-label del botón o checkbox */
  tooltip?: string;
  /** Ícono a mostrar; por defecto un ícono de "ojo" (solo aplica a tipo "boton") */
  icono?: React.ReactNode;
  /** "boton" (default) o "checkbox" */
  tipo?: "boton" | "checkbox";
  /** Callback al hacer click (requerido si tipo es "boton") */
  onClick?: (node: TreeNode) => void;
  /** Estado checked del checkbox (requerido si tipo es "checkbox") */
  checked?: (node: TreeNode) => boolean;
  /** Estado indeterminado (parcialmente seleccionado) del checkbox */
  indeterminate?: (node: TreeNode) => boolean;
  /** Si retorna true, la casilla se muestra deshabilitada para esa fila (solo aplica a tipo "checkbox") */
  disabled?: (node: TreeNode) => boolean;
  /** Callback al cambiar el checkbox (requerido si tipo es "checkbox") */
  onToggle?: (node: TreeNode, checked: boolean) => void;
  /** Si es false, la acción se muestra en TODAS las filas (no solo en hojas). Default: true (solo hojas) */
  soloHojas?: boolean;
  /** Si es true, la acción solo se muestra en las filas raíz (depth === 0) */
  soloRaiz?: boolean;
  /**
   * Control total sobre en qué filas se muestra la acción. Si se define,
   * IGNORA soloHojas y soloRaiz. `esPenultimo` es true cuando el nodo tiene
   * hijos y ninguno de esos hijos tiene a su vez hijos (o sea, sus hijos
   * son las filas "hoja").
   */
  mostrarSi?: (
    node: TreeNode,
    ctx: { depth: number; hasChildren: boolean; esPenultimo: boolean },
  ) => boolean;
}

interface TablaDoubleProps {
  data?: TreeNode[];
  columns?: ColumnaTabla[];
  rowKey?: string;
  showTotals?: boolean;
  firstColumnWidth?: number;
  maxHeight?: string;
  monedaMap?: Record<string, string>;
  /** Botones/checkboxes de acción por fila, p. ej. [{ id, tooltip, tipo, onClick|onToggle, soloHojas? }] */
  acciones?: AccionFila[];
  /** Si es true, las filas raíz (depth 0) no muestran los montos por columna ni el Total de fila. */
  ocultarTotalesRaiz?: boolean;
  /** Si es false, oculta la fila "Totales" del pie de tabla sin afectar la columna Total. Default: true. */
  mostrarTotalesPie?: boolean;
  /**
   * Si es false, oculta la columna Total (suma de las columnas de cada fila) y
   * deja el pie con el total de cada columna. Para columnas que no se suman entre sí. Default: true.
   */
  mostrarColumnaTotal?: boolean;
  /**
   * Nivel (1 = filas raíz) hasta el cual el árbol aparece expandido al
   * cargar los datos. P. ej. 3 expande raíz, nivel 2 y nivel 3, dejando
   * visibles sus filas hijas. Default: 0 (todo colapsado, comportamiento
   * previo). Solo aplica al montar la tabla, no reacciona a cambios de data.
   */
  nivelExpandidoInicial?: number;
  /**
   * Si es true, las `acciones` se muestran junto al nombre en la primera
   * columna (en vez de una columna "Acciones" aparte al final). Default: false.
   */
  accionesEnColumnaNombre?: boolean;
}

// ── Hooks auxiliares ──────────────────────────────────────────────────────────

/** Ids de los nodos con hijos hasta `nivel` (1 = raíz), para expandirlos por defecto. */
function idsExpandidosPorNivel(nodes: TreeNode[], rowKey: string, nivel: number): Set<string> {
  const ids = new Set<string>();
  if (nivel < 1) return ids;

  const recorrer = (lista: TreeNode[], depth: number) => {
    if (depth >= nivel) return;
    lista.forEach((node) => {
      if (node.children?.length) {
        ids.add(node[rowKey] as string);
        recorrer(node.children, depth + 1);
      }
    });
  };

  recorrer(nodes, 0);
  return ids;
}

function useExpandable(initial: () => Set<string>) {
  const [expanded, setExpanded] = useState<Set<string>>(initial);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isExpanded = (id: string) => expanded.has(id);

  return { toggle, isExpanded };
}

function sortNodes(nodes: TreeNode[], sortKey: string | null, sortDir: "asc" | "desc"): TreeNode[] {
  if (!sortKey) return nodes;

  const sorted = [...nodes].sort((a, b) => {
    const va =
      sortKey === "__total__"
        ? Object.values(a.values || {}).reduce((s: number, v) => s + (Number(v) || 0), 0)
        : Number(a.values?.[sortKey] || 0);
    const vb =
      sortKey === "__total__"
        ? Object.values(b.values || {}).reduce((s: number, v) => s + (Number(v) || 0), 0)
        : Number(b.values?.[sortKey] || 0);
    return sortDir === "asc" ? va - vb : vb - va;
  });

  return sorted.map((node) => ({
    ...node,
    children: node.children?.length
      ? sortNodes(node.children, sortKey, sortDir)
      : (node.children ?? []),
  }));
}

function useColumnTotals(data: TreeNode[], columns: ColumnaTabla[]) {
  return useMemo(() => {
    const totals: Record<string, number> = {};
    columns.forEach((c) => {
      totals[c.key] = 0;
    });
    data.forEach((node) => {
      columns.forEach((c) => {
        totals[c.key] = (totals[c.key] ?? 0) + (Number(node.values?.[c.key]) || 0);
      });
    });
    return totals;
  }, [data, columns]);
}

const SIMBOLOS: Record<string, string> = {
  GTQ: "Q",
  USD: "$",
  EUR: "€",
  MXN: "MX$",
};

function useFormatter(monedaMap: Record<string, string> = {}) {
  return (v: unknown, colKey?: string): string => {
    if (v == null) return "";
    const n = Number(v);
    if (Number.isNaN(n)) return "";
    if (n === 0) return "";
    const moneda = colKey ? monedaMap[colKey] : null;
    const simbolo = moneda ? (SIMBOLOS[moneda] ?? `${moneda} `) : "";
    const numero = n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return simbolo ? `${simbolo} ${numero}` : numero;
  };
}

function formatearEntero(v: unknown): string {
  if (v == null || v === "") return "";
  const n = Number(v);
  return Number.isNaN(n) ? "" : n.toLocaleString();
}

// ── Nivel styles (depth-based) ────────────────────────────────────────────────
const DEPTH_ROW_CLS = [
  "h-9 bg-blue-200 border-b-2 border-blue-300",
  "h-9 bg-blue-100 border-b border-blue-200",
  "h-8 bg-brand-50 border-b border-dashed border-border",
  "h-8 bg-brand-50 border-b border-border",
  "h-8 bg-slate-50 border-b border-slate-100",
];

const DEPTH_CELL_CLS = [
  "text-sm font-semibold text-blue-950",
  "text-sm font-semibold text-blue-900",
  "text-sm font-normal text-foreground",
  "text-sm font-normal text-muted-foreground",
  "text-sm font-medium text-slate-700",
];

const DEPTH_STICKY_BG = ["bg-blue-200", "bg-blue-100", "bg-brand-50", "bg-brand-50", "bg-slate-50"];

/** Separadores verticales del tema. */
const DEPTH_DIVIDER_CLS = [
  "border-blue-300",
  "border-blue-200",
  "border-border",
  "border-border",
  "border-slate-100",
];

const getDepthIdx = (depth: number) => Math.min(depth, 4);

/** Sombra de la columna congelada: usa el color de sombra del tema. */
const STICKY_SHADOW = "shadow-[4px_0_8px_-2px_rgb(var(--shadow-rgb)/0.15)]";

// Ancho de columna de acciones (px por botón/checkbox)
const ACCION_BTN_WIDTH = 40;

// ── Sub-components ────────────────────────────────────────────────────────────

function SortIcon({
  colKey,
  sortKey,
  sortDir,
}: {
  colKey: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
}) {
  const active = sortKey === colKey;
  return (
    <span className={cn("inline-flex ml-1", active ? "opacity-100" : "opacity-50")}>
      {active && sortDir === "asc" ? (
        <ChevronUp className="w-3 h-3 text-white" />
      ) : (
        <ChevronDown className="w-3 h-3 text-white" />
      )}
    </span>
  );
}

function ExpandButton({
  hasChildren,
  isExpanded,
  onClick,
  depth,
}: {
  hasChildren: boolean;
  isExpanded: boolean;
  onClick: () => void;
  depth: number;
}) {
  if (!hasChildren) return <span className="inline-block w-[22px]" />;

  const isRoot = depth === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isExpanded ? "Collapse" : "Expand"}
      className={cn(
        "mr-1.5 flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-sm leading-none transition-colors",
        isRoot
          ? "border border-brand-200 bg-brand-100 text-primary hover:bg-brand-200"
          : "border border-border bg-card text-muted-foreground hover:bg-surface-1",
      )}
    >
      {isExpanded ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
    </button>
  );
}

function ActionButton({ accion, node }: { accion: AccionFila; node: TreeNode }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        accion.onClick?.(node);
      }}
      title={accion.tooltip || ""}
      aria-label={accion.tooltip || accion.id}
      className={cn(
        "ml-1 flex size-6 shrink-0 items-center justify-center rounded-sm",
        "cursor-pointer border border-border bg-card transition-colors hover:bg-surface-1",
      )}
    >
      {accion.icono ? accion.icono : <Eye className="w-[15px] h-[15px] text-primary" />}
    </button>
  );
}

function ActionCheckbox({ accion, node }: { accion: AccionFila; node: TreeNode }) {
  const checked = accion.checked ? accion.checked(node) : false;
  const indeterminate = accion.indeterminate ? accion.indeterminate(node) : false;
  const disabled = accion.disabled ? accion.disabled(node) : false;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <span className="inline-flex w-6 h-6 items-center justify-center flex-shrink-0 ml-1">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        title={accion.tooltip || ""}
        aria-label={accion.tooltip || accion.id}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          accion.onToggle?.(node, e.target.checked);
        }}
        className={cn(
          "w-4 h-4 rounded border-border accent-brand-800",
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        )}
      />
    </span>
  );
}

function TableRow({
  node,
  depth,
  columns,
  showTotals,
  rowKey,
  expandable,
  format,
  firstColumnWidth,
  acciones,
  ocultarTotalesRaiz,
  accionesEnColumnaNombre,
}: {
  node: TreeNode;
  depth: number;
  columns: ColumnaTabla[];
  showTotals: boolean;
  rowKey: string;
  expandable: ReturnType<typeof useExpandable>;
  format: ReturnType<typeof useFormatter>;
  firstColumnWidth: number;
  acciones: AccionFila[];
  ocultarTotalesRaiz: boolean;
  accionesEnColumnaNombre: boolean;
}) {
  const id = node[rowKey] as string;
  const hasChildren = (node.children?.length ?? 0) > 0;
  const expanded = expandable.isExpanded(id);
  const di = getDepthIdx(depth);
  const ocultarValores = ocultarTotalesRaiz && depth === 0;

  // Nodo "penúltimo nivel": tiene hijos, y ninguno de esos hijos tiene
  // a su vez hijos (sus hijos son directamente las filas hoja/documento).
  const esPenultimo = useMemo(
    () => hasChildren && (node.children ?? []).every((c) => (c.children?.length ?? 0) === 0),
    [hasChildren, node.children],
  );

  const rowTotal = useMemo(
    () =>
      columns
        .filter((c) => !c.excluirTotal)
        .reduce((sum, c) => sum + (Number(node.values?.[c.key]) || 0), 0),
    [node, columns],
  );

  const accionesVisibles = acciones.filter((a) => {
    if (a.mostrarSi) {
      return a.mostrarSi(node, { depth, hasChildren, esPenultimo });
    }
    const okHojas = a.soloHojas === false || !hasChildren;
    const okRaiz = !a.soloRaiz || depth === 0;
    return okHojas && okRaiz;
  });

  const mostrarColumnaAcciones = acciones.length > 0 && !accionesEnColumnaNombre;
  const colSpanTotal = columns.length + (showTotals ? 2 : 1) + (mostrarColumnaAcciones ? 1 : 0);
  const { antes, despues } = dividirColumnas(columns);

  const celdaValor = (c: ColumnaTabla) => (
    <td
      key={c.key}
      className={cn(
        "min-w-[140px] border-r px-2.5 py-1.5 whitespace-nowrap",
        c.texto ? "text-left" : "text-right tabular-nums",
        DEPTH_DIVIDER_CLS[di],
        DEPTH_CELL_CLS[di],
      )}
    >
      {ocultarValores
        ? ""
        : c.texto
          ? String(node.values?.[c.key] ?? "")
          : c.entero
            ? formatearEntero(node.values?.[c.key])
            : format(node.values?.[c.key], c.key)}
    </td>
  );

  return (
    <>
      <tr className={DEPTH_ROW_CLS[di]}>
        {antes.map(celdaValor)}

        {/* Sticky first column */}
        <td
          className={cn(
            "sticky left-0 z-[2] border-r py-1.5 pr-2.5 align-top wrap-break-word",
            STICKY_SHADOW,
            DEPTH_DIVIDER_CLS[di],
            DEPTH_CELL_CLS[di],
            DEPTH_STICKY_BG[di],
          )}
          style={{
            width: firstColumnWidth,
            minWidth: firstColumnWidth,
            maxWidth: firstColumnWidth,
            // Única medida que sigue siendo inline: la sangría del árbol depende
            // de la profundidad, no hay clase que la exprese.
            paddingLeft: 10 + depth * 18,
            overflowWrap: "anywhere",
          }}
        >
          <span className="flex items-center justify-between gap-1.5">
            <span className="inline-flex min-w-0 items-center">
              <ExpandButton
                hasChildren={hasChildren}
                isExpanded={expanded}
                onClick={() => expandable.toggle(id)}
                depth={depth}
              />
              {depth > 0 && (
                <span
                  className={cn(
                    "inline-block w-[3px] h-[1em] rounded-sm mr-1.5 flex-shrink-0",
                    depth <= 2 ? "bg-brand-800" : "bg-surface-2",
                  )}
                />
              )}
              <span className="w-full wrap-break-word">{node.label}</span>
            </span>

            {accionesEnColumnaNombre && accionesVisibles.length > 0 && (
              <span className="inline-flex shrink-0 items-center">
                {accionesVisibles.map((accion) =>
                  accion.tipo === "checkbox" ? (
                    <ActionCheckbox key={accion.id} accion={accion} node={node} />
                  ) : (
                    <ActionButton key={accion.id} accion={accion} node={node} />
                  ),
                )}
              </span>
            )}
          </span>
        </td>

        {/* Value columns */}
        {despues.map(celdaValor)}

        {/* Total column */}
        {showTotals && (
          <td
            className={cn(
              "min-w-[140px] px-2.5 py-1.5 text-right font-semibold tabular-nums whitespace-nowrap",
              DEPTH_CELL_CLS[di],
              mostrarColumnaAcciones ? cn("border-r", DEPTH_DIVIDER_CLS[di]) : "",
            )}
          >
            {ocultarValores ? "" : format(rowTotal)}
          </td>
        )}

        {/* Actions column */}
        {mostrarColumnaAcciones && (
          <td
            className="px-1.5 py-1.5 text-center whitespace-nowrap"
            style={{
              width: ACCION_BTN_WIDTH * Math.max(acciones.length, 1),
            }}
          >
            <span className="inline-flex items-center justify-center">
              {accionesVisibles.map((accion) =>
                accion.tipo === "checkbox" ? (
                  <ActionCheckbox key={accion.id} accion={accion} node={node} />
                ) : (
                  <ActionButton key={accion.id} accion={accion} node={node} />
                ),
              )}
            </span>
          </td>
        )}
      </tr>

      {/* Separator when collapsed */}
      {hasChildren && !expanded && depth <= 1 && (
        <tr>
          <td
            colSpan={colSpanTotal}
            className={cn("p-0 h-[2px]", depth === 0 ? "bg-brand-800" : "bg-surface-2")}
          />
        </tr>
      )}

      {/* Children */}
      {hasChildren &&
        expanded &&
        node.children?.map((child) => (
          <TableRow
            key={child[rowKey] as string}
            node={child}
            depth={depth + 1}
            columns={columns}
            showTotals={showTotals}
            rowKey={rowKey}
            expandable={expandable}
            format={format}
            firstColumnWidth={firstColumnWidth}
            acciones={acciones}
            ocultarTotalesRaiz={ocultarTotalesRaiz}
            accionesEnColumnaNombre={accionesEnColumnaNombre}
          />
        ))}

      {/* Bottom separator after expanded root */}
      {hasChildren && expanded && depth === 0 && (
        <tr>
          <td colSpan={colSpanTotal} className="p-0 h-[3px] bg-brand-800" />
        </tr>
      )}
    </>
  );
}

function TableHeader({
  columns,
  showTotals,
  firstColumnWidth,
  sortKey,
  sortDir,
  onSort,
  acciones,
  accionesEnColumnaNombre,
}: {
  columns: ColumnaTabla[];
  showTotals: boolean;
  firstColumnWidth: number;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  acciones: AccionFila[];
  accionesEnColumnaNombre: boolean;
}) {
  const mostrarColumnaAcciones = acciones.length > 0 && !accionesEnColumnaNombre;
  const { antes, despues } = dividirColumnas(columns);

  const encabezadoValor = (c: ColumnaTabla) => (
    <th
      key={c.key}
      onClick={() => onSort(c.key)}
      title={`Ordenar por ${c.label}`}
      className={cn(
        "h-9 px-3 text-right text-xs font-semibold tracking-wide text-white uppercase",
        "min-w-[140px] border-r border-b-2 border-white/15 whitespace-nowrap",
        "cursor-pointer transition-colors select-none",
        sortKey === c.key ? "bg-brand-600" : "bg-brand-700 hover:bg-brand-600",
      )}
    >
      <span className="inline-flex items-center justify-end w-full">
        {c.label}
        <SortIcon colKey={c.key} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <thead className="sticky top-0 z-10">
      <tr className="bg-brand-700">
        {antes.map(encabezadoValor)}

        {/* Label column — no sort */}
        <th
          className={cn(
            "sticky left-0 z-[11] h-9 bg-brand-700 px-3 text-left text-xs font-semibold tracking-wide text-white uppercase",
            "border-r border-b-2 border-white/15 whitespace-nowrap",
            STICKY_SHADOW,
          )}
          style={{
            width: firstColumnWidth,
            minWidth: firstColumnWidth,
            maxWidth: firstColumnWidth,
          }}
        >
          Filtro
        </th>

        {/* Value columns */}
        {despues.map(encabezadoValor)}

        {/* Total column */}
        {showTotals && (
          <th
            onClick={() => onSort("__total__")}
            title="Ordenar por Total"
            className={cn(
              "h-9 px-3 text-right text-xs font-semibold tracking-wide text-white uppercase",
              "min-w-[140px] border-b-2 border-white/15 whitespace-nowrap",
              "cursor-pointer transition-colors select-none",
              sortKey === "__total__" ? "bg-brand-600" : "bg-brand-700 hover:bg-brand-600",
              mostrarColumnaAcciones ? "border-r" : "",
            )}
          >
            <span className="inline-flex items-center justify-end w-full">
              Total
              <SortIcon colKey="__total__" sortKey={sortKey} sortDir={sortDir} />
            </span>
          </th>
        )}

        {/* Actions column */}
        {mostrarColumnaAcciones && (
          <th
            className="h-9 cursor-default border-b-2 border-white/15 bg-brand-700 px-3 text-center text-xs font-semibold tracking-wide text-white uppercase whitespace-nowrap"
            style={{
              width: ACCION_BTN_WIDTH * acciones.length,
              minWidth: ACCION_BTN_WIDTH * acciones.length,
            }}
          >
            Acciones
          </th>
        )}
      </tr>
    </thead>
  );
}

function TableFooter({
  columns,
  totals,
  format,
  showTotals,
  firstColumnWidth,
  acciones,
  mostrarTotalesPie,
  mostrarColumnaTotal,
  accionesEnColumnaNombre,
}: {
  columns: ColumnaTabla[];
  totals: Record<string, number>;
  format: ReturnType<typeof useFormatter>;
  showTotals: boolean;
  firstColumnWidth: number;
  acciones: AccionFila[];
  mostrarTotalesPie: boolean;
  mostrarColumnaTotal: boolean;
  accionesEnColumnaNombre: boolean;
}) {
  if (!showTotals || !mostrarTotalesPie) return null;

  const grandTotal = columns
    .filter((c) => !c.excluirTotal)
    .reduce((sum, c) => sum + (totals[c.key] ?? 0), 0);

  const { antes, despues } = dividirColumnas(columns);
  const totalColumna = (c: ColumnaTabla) => (
    <td
      key={c.key}
      className="h-9 bg-brand-700 px-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap text-white"
    >
      {c.texto ? "" : c.entero ? formatearEntero(totals[c.key]) : format(totals[c.key], c.key)}
    </td>
  );

  return (
    <tfoot className="sticky bottom-0 z-10">
      <tr className="bg-brand-700 border-t-[3px] border-brand-700">
        {antes.map(totalColumna)}
        <td
          className={cn(
            "sticky left-0 z-[11] h-9 bg-brand-700 px-3 text-sm font-semibold text-white",
            STICKY_SHADOW,
          )}
          style={{
            width: firstColumnWidth,
            minWidth: firstColumnWidth,
            maxWidth: firstColumnWidth,
          }}
        >
          Totales
        </td>
        {despues.map(totalColumna)}
        {mostrarColumnaTotal && (
          <td className="h-9 bg-brand-700 px-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap text-white">
            {format(grandTotal)}
          </td>
        )}
        {acciones.length > 0 && !accionesEnColumnaNombre && <td className="bg-brand-700" />}
      </tr>
    </tfoot>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function TablaDouble({
  data = [],
  columns = [],
  rowKey = "id",
  showTotals = true,
  firstColumnWidth = 350,
  maxHeight = "65vh",
  monedaMap = {},
  acciones = [],
  ocultarTotalesRaiz = false,
  mostrarTotalesPie = true,
  mostrarColumnaTotal = true,
  nivelExpandidoInicial = 0,
  accionesEnColumnaNombre = false,
}: TablaDoubleProps) {
  const expandable = useExpandable(() =>
    idsExpandidosPorNivel(data, rowKey, nivelExpandidoInicial),
  );
  const format = useFormatter(monedaMap);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const dataSorted = useMemo(() => sortNodes(data, sortKey, sortDir), [data, sortKey, sortDir]);

  const totals = useColumnTotals(dataSorted, columns);
  const columnaTotal = showTotals && mostrarColumnaTotal;

  return (
    <div
      className="w-full rounded-lg shadow-sm overflow-auto"
      style={{ maxHeight, overflowY: "auto", overflowX: "auto" }}
    >
      <table className="border-collapse w-full" style={{ tableLayout: "auto" }}>
        <TableHeader
          columns={columns}
          showTotals={columnaTotal}
          firstColumnWidth={firstColumnWidth}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          acciones={acciones}
          accionesEnColumnaNombre={accionesEnColumnaNombre}
        />
        <tbody>
          {dataSorted.map((node) => (
            <TableRow
              key={node[rowKey] as string}
              node={node}
              depth={0}
              columns={columns}
              showTotals={columnaTotal}
              rowKey={rowKey}
              expandable={expandable}
              format={format}
              firstColumnWidth={firstColumnWidth}
              acciones={acciones}
              ocultarTotalesRaiz={ocultarTotalesRaiz}
              accionesEnColumnaNombre={accionesEnColumnaNombre}
            />
          ))}
        </tbody>
        <TableFooter
          columns={columns}
          totals={totals}
          format={format}
          showTotals={showTotals}
          mostrarTotalesPie={mostrarTotalesPie}
          mostrarColumnaTotal={mostrarColumnaTotal}
          firstColumnWidth={firstColumnWidth}
          acciones={acciones}
          accionesEnColumnaNombre={accionesEnColumnaNombre}
        />
      </table>
    </div>
  );
}
