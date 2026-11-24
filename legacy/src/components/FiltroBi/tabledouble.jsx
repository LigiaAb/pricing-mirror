import React, { useMemo, useState } from 'react'

// ---------- Hooks auxiliares ----------

function useExpandable() {
  const [expanded, setExpanded] = useState(new Set())

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const isExpanded = (id) => expanded.has(id)

  return { toggle, isExpanded }
}

// Ordena los nodos de un nivel según la columna y dirección activa
// Solo ordena el nivel raíz y cada nivel de children recursivamente
function sortNodes(nodes, sortKey, sortDir) {
  if (!sortKey) return nodes

  const sorted = [...nodes].sort((a, b) => {
    const va = sortKey === '__total__'
      ? Object.values(a.values || {}).reduce((s, v) => s + (Number(v) || 0), 0)
      : Number(a.values?.[sortKey] || 0)
    const vb = sortKey === '__total__'
      ? Object.values(b.values || {}).reduce((s, v) => s + (Number(v) || 0), 0)
      : Number(b.values?.[sortKey] || 0)
    return sortDir === 'asc' ? va - vb : vb - va
  })

  // Ordena recursivamente los hijos también
  return sorted.map((node) => ({
    ...node,
    children: node.children?.length
      ? sortNodes(node.children, sortKey, sortDir)
      : node.children,
  }))
}

function useColumnTotals(data, columns) {
  return useMemo(() => {
    const totals = {}
    columns.forEach((c) => (totals[c.key] = 0))
    data.forEach((node) => {
      columns.forEach((c) => {
        totals[c.key] += Number(node.values?.[c.key]) || 0
      })
    })
    return totals
  }, [data, columns])
}

function useFormatter(monedaMap = {}) {
  const SIMBOLOS = { GTQ: 'Q', USD: '$', EUR: '€', MXN: 'MX$' }

  return (v, colKey) => {
    if (v == null) return ''
    const n = Number(v)
    if (Number.isNaN(n)) return ''
    if (n === 0) return ''
    const moneda = colKey ? monedaMap[colKey] : null
    const simbolo = moneda ? (SIMBOLOS[moneda] ?? moneda + ' ') : ''
    const numero = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return simbolo ? `${simbolo} ${numero}` : numero
  }
}

// ---------- Estilos por nivel ----------

const NIVEL_ESTILOS = [
  {
    row: { background: '#006699', color: '#fff', borderBottom: '2px solid #E6F2FF' },
    cell: { padding: '7px 10px', fontWeight: 700, fontSize: 13, borderRight: '1px solid #CCE6FF', borderBottom: '2px solid #CCE6FF' },
    stickyCell: { background: '#006699', color: '#fff' },
  },
  {
    row: { background: '#E6F2FF', borderBottom: '2px solid #E6F2FF' },
    cell: { padding: '6px 10px', fontWeight: 600, fontSize: 13, borderRight: '1px solid #CCE6FF', borderBottom: '2px solid #CCE6FF', color: '#002147' },
    stickyCell: { background: '#E6F2FF', color: '#002147' },
  },
  {
    row: { background: '#f8f9fb', borderBottom: '1px solid #e2e8f0' },
    cell: { padding: '5px 10px', fontWeight: 600, fontSize: 12.5, borderRight: '1px solid #CCE6FF', borderBottom: '1px solid #CCE6FF', color: '#374151' },
    stickyCell: { background: '#f8f9fb', color: '#374151' },
  },
  {
    row: { background: '#fff', borderBottom: '1px dashed #e2e8f0' },
    cell: { padding: '4px 10px', fontWeight: 500, fontSize: 12, borderRight: '1px solid #CCE6FF', borderBottom: '1px dashed #CCE6FF', color: '#4b5563' },
    stickyCell: { background: '#fff', color: '#4b5563' },
  },
  {
    row: { background: '#fff', borderBottom: '1px solid #f1f5f9' },
    cell: { padding: '3px 10px', fontWeight: 400, fontSize: 12, borderRight: '1px solid #CCE6FF', borderBottom: '1px solid #CCE6FF', color: '#6b7280' },
    stickyCell: { background: '#fff', color: '#6b7280' },
  },
]

const getNivelEstilo = (depth) => NIVEL_ESTILOS[Math.min(depth, NIVEL_ESTILOS.length - 1)]
const STICKY_SHADOW = '4px 0 8px -2px rgba(0,0,0,0.15)'

// ---------- Icono de orden ----------

function SortIcon({ colKey, sortKey, sortDir }) {
  const activa = sortKey === colKey

  // Flecha apunta abajo (↓) cuando desc, arriba (↑) cuando asc
  // Si la columna no está activa se muestra tenue apuntando abajo
  const rotation = activa && sortDir === 'asc' ? '180deg' : '0deg'
  const opacity = activa ? 1 : 0.35

  return (
    <span style={{ display: 'inline-flex', marginLeft: 5, verticalAlign: 'middle' }}>
      <svg
        width="10" height="10" viewBox="0 0 10 10"
        style={{
          transform: `rotate(${rotation})`,
          transition: 'transform 0.2s ease',
          opacity,
        }}
      >
        {/* flecha hacia abajo */}
        <path d="M5 8L1 3h8Z" fill="#fff" />
      </svg>
    </span>
  )
}

// ---------- Icono "ojo" por defecto (acción "ver") ----------

function EyeIcon({ color = '#006699' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"
        stroke={color} strokeWidth="2" strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </svg>
  )
}

// ---------- Botón de acción por fila ----------

function ActionButton({ accion, node }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        accion.onClick(node)
      }}
      title={accion.tooltip || ''}
      aria-label={accion.tooltip || accion.id}
      style={{
        width: 24, height: 24, borderRadius: 4,
        border: '1px solid #CCE6FF', background: '#fff',
        cursor: 'pointer', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        marginLeft: 4, flexShrink: 0,
      }}
    >
      {accion.icono ? accion.icono : <EyeIcon />}
    </button>
  )
}

// ---------- Subcomponentes ----------

function ExpandButton({ hasChildren, isExpanded, onClick, depth }) {
  if (!hasChildren) return <span style={{ display: 'inline-block', width: 22 }} />
  const esRaiz = depth === 0
  return (
    <button
      onClick={onClick}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
      style={{
        marginRight: 6, width: 18, height: 18, borderRadius: 3,
        border: esRaiz ? '1px solid rgba(255,255,255,0.4)' : '1px solid #cbd5e1',
        background: esRaiz ? 'rgba(255,255,255,0.15)' : '#fff',
        color: esRaiz ? '#fff' : '#475569',
        cursor: 'pointer', fontSize: 13, lineHeight: 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      {isExpanded ? '−' : '+'}
    </button>
  )
}

function TableRow({ node, depth, columns, showTotals, rowKey, expandable, format, firstColumnWidth, acciones }) {
  const id = node[rowKey]
  const hasChildren = node.children?.length > 0
  const expanded = expandable.isExpanded(id)
  const estilo = getNivelEstilo(depth)

  const rowTotal = useMemo(
    () => columns.reduce((sum, c) => sum + (Number(node.values?.[c.key]) || 0), 0),
    [node, columns]
  )

  const indentBar = depth > 0
    ? <span style={{
      display: 'inline-block', width: 3, height: '1em',
      background: depth <= 2 ? '#006699' : '#e2e8f0',
      borderRadius: 2, marginRight: 6, verticalAlign: 'middle', flexShrink: 0,
    }} />
    : null

  const accionesVisibles = acciones.filter((a) => {
    const okHojas = (a.soloHojas === false) || !hasChildren
    const okRaiz = !a.soloRaiz || depth === 0
    return okHojas && okRaiz
  }
  )

  return (
    <>
      <tr style={estilo.row}>
        <td style={{
          ...estilo.cell, ...estilo.stickyCell,
          position: 'sticky', left: 0, zIndex: 2, boxShadow: STICKY_SHADOW,
          paddingLeft: 10 + depth * 18, verticalAlign: 'top',
          width: firstColumnWidth, minWidth: firstColumnWidth, maxWidth: firstColumnWidth,
          wordBreak: 'break-word', overflowWrap: 'anywhere',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ExpandButton hasChildren={hasChildren} isExpanded={expanded} onClick={() => expandable.toggle(id)} depth={depth} />
            {indentBar}
            <span style={{ color: 'inherit', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', display: 'inline-block', width: '100%' }}>
              {node.label}
            </span>
          </span>
        </td>

        {columns.map((c) => (
          <td key={c.key} style={{ ...estilo.cell, textAlign: 'right', whiteSpace: 'nowrap', minWidth: 140 }}>
            {format(node.values?.[c.key], c.key)}
          </td>
        ))}

        {showTotals && (
          <td style={{ ...estilo.cell, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap', minWidth: 140 }}>
            {format(rowTotal)}
          </td>
        )}

        {acciones.length > 0 && (
          <td style={{ ...estilo.cell, textAlign: 'center', whiteSpace: 'nowrap', width: 40 * Math.max(acciones.length, 1) }}>
            {accionesVisibles.map((accion) => (
              <ActionButton key={accion.id} accion={accion} node={node} />
            ))}
          </td>
        )}
      </tr>

      {hasChildren && !expanded && depth <= 1 && (
        <tr>
          <td colSpan={columns.length + (showTotals ? 2 : 1) + (acciones.length > 0 ? 1 : 0)} style={{ height: 2, background: depth === 0 ? '#006699' : '#e2e8f0', padding: 0 }} />
        </tr>
      )}

      {hasChildren && expanded &&
        node.children.map((child) => (
          <TableRow
            key={child[rowKey]} node={child} depth={depth + 1}
            columns={columns} showTotals={showTotals} rowKey={rowKey}
            expandable={expandable} format={format} firstColumnWidth={firstColumnWidth}
            acciones={acciones}
          />
        ))
      }

      {hasChildren && expanded && depth === 0 && (
        <tr>
          <td colSpan={columns.length + (showTotals ? 2 : 1) + (acciones.length > 0 ? 1 : 0)} style={{ height: 3, background: '#006699', padding: 0 }} />
        </tr>
      )}
    </>
  )
}

// onSort recibe la colKey clickeada
function TableHeader({ columns, showTotals, firstColumnWidth, sortKey, sortDir, onSort, acciones }) {

  const thBase = {
    textAlign: 'right', padding: '10px 12px', color: '#e0e7ff',
    fontWeight: 600, fontSize: 12, background: '#024a92',
    borderRight: '1px solid #CCE6FF', borderBottom: '2px solid #CCE6FF',
    whiteSpace: 'nowrap', minWidth: 140,
    cursor: 'pointer', userSelect: 'none',
  }

  return (
    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
      <tr style={{ background: '#024a92' }}>
        {/* Columna sticky — sin ordenamiento (es el label) */}
        <th style={{
          position: 'sticky', left: 0, zIndex: 11, background: '#024a92',
          textAlign: 'left', padding: '10px 12px', color: '#fff', fontWeight: 700, fontSize: 13,
          borderRight: '1px solid #CCE6FF', borderBottom: '2px solid #CCE6FF',
          whiteSpace: 'nowrap', width: firstColumnWidth, minWidth: firstColumnWidth, maxWidth: firstColumnWidth,
          boxShadow: STICKY_SHADOW,
        }}>
          Filtro
        </th>

        {/* Columnas de valores — con flecha de orden */}
        {columns.map((c) => (
          <th
            key={c.key}
            style={{
              ...thBase,
              background: sortKey === c.key ? '#035dba' : '#024a92',  // resalta la columna activa
            }}
            onClick={() => onSort(c.key)}
            title={`Ordenar por ${c.label}`}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
              {c.label}
              {c.moneda && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>({c.moneda})</span>}
              <SortIcon colKey={c.key} sortKey={sortKey} sortDir={sortDir} />
            </span>
          </th>
        ))}

        {showTotals && (
          <th
            style={{
              ...thBase,
              color: '#fff', fontWeight: 700, fontSize: 13,
              borderRight: acciones.length > 0 ? '1px solid #CCE6FF' : 'none',
              background: sortKey === '__total__' ? '#035dba' : '#024a92',
            }}
            onClick={() => onSort('__total__')}
            title="Ordenar por Total"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
              Total
              <SortIcon colKey="__total__" sortKey={sortKey} sortDir={sortDir} />
            </span>
          </th>
        )}

        {acciones.length > 0 && (
          <th style={{
            ...thBase, cursor: 'default', textAlign: 'center',
            borderRight: 'none', width: 40 * acciones.length, minWidth: 40 * acciones.length,
          }}>
            Acciones
          </th>
        )}
      </tr>
    </thead>
  )
}

function TableFooter({ columns, totals, format, showTotals, firstColumnWidth, acciones }) {
  if (!showTotals) return null
  const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0)

  return (
    <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
      <tr style={{ background: '#024a92', borderTop: '3px solid #024a92' }}>
        <td style={{
          position: 'sticky', left: 0, zIndex: 11, background: '#024a92',
          padding: '8px 12px', fontWeight: 700, color: '#fff', fontSize: 13,
          width: firstColumnWidth, minWidth: firstColumnWidth, maxWidth: firstColumnWidth,
          boxShadow: STICKY_SHADOW,
        }}>
          Totales
        </td>
        {columns.map((c) => (
          <td key={c.key} style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 700, color: '#CCE6FF', fontSize: 13, whiteSpace: 'nowrap', background: '#024a92' }}>
            {format(totals[c.key], c.key)}
          </td>
        ))}
        <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 700, color: '#fff', fontSize: 13, whiteSpace: 'nowrap', background: '#024a92' }}>
          {format(grandTotal)}
        </td>
        {acciones.length > 0 && (
          <td style={{ background: '#024a92' }} />
        )}
      </tr>
    </tfoot>
  )
}

// ---------- Componente principal ----------

export default function TablaDouble({
  data = [],
  columns = [],
  rowKey = 'id',
  showTotals = true,
  firstColumnWidth = 350,
  maxHeight = '65vh',
  monedaMap = {},
  acciones = [], // [{ id, tooltip, icono?, onClick(node), soloHojas? }]
}) {
  const expandable = useExpandable()
  const format = useFormatter(monedaMap)

  // Estado de ordenamiento: qué columna y en qué dirección
  const [sortKey, setSortKey] = useState(null)   // null = sin orden
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'

  const handleSort = (key) => {
    if (sortKey === key) {
      // Si ya estaba activa: toggle dirección
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      // Nueva columna: empieza desc (mayor → menor)
      setSortKey(key)
      setSortDir('desc')
    }
  }

  // Aplica el orden a los datos antes de renderizar
  const dataSorted = useMemo(
    () => sortNodes(data, sortKey, sortDir),
    [data, sortKey, sortDir]
  )

  const totals = useColumnTotals(dataSorted, columns)

  return (
    <div style={{
      width: '100%', borderRadius: 8,
      boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
      maxHeight, overflowY: 'auto', overflowX: 'auto',
    }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'auto' }}>
        <TableHeader
          columns={columns}
          showTotals={showTotals}
          firstColumnWidth={firstColumnWidth}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          acciones={acciones}
        />
        <tbody>
          {dataSorted.map((node) => (
            <TableRow
              key={node[rowKey]} node={node} depth={0}
              columns={columns} showTotals={showTotals} rowKey={rowKey}
              expandable={expandable} format={format} firstColumnWidth={firstColumnWidth}
              acciones={acciones}
            />
          ))}
        </tbody>
        <TableFooter columns={columns} totals={totals} format={format} showTotals={showTotals} firstColumnWidth={firstColumnWidth} acciones={acciones} />
      </table>
    </div>
  )
}