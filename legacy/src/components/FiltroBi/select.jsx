import React, { useEffect, useRef, useState } from 'react'

const defaultStyles = {
  container:   { position: 'relative', width: 320, fontFamily: 'inherit' },
  control:     { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: 8, border: '1px solid #ccc', borderRadius: 6, cursor: 'text', background: '#fff' },
  input:       { border: 'none', outline: 'none', flex: 1, minWidth: 80, fontSize: 14 },
  chip:        { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#eee', borderRadius: 16, fontSize: 13 },
  dropdown:    { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, border: '1px solid #ddd', background: '#fff', maxHeight: 220, overflow: 'auto', marginTop: 6, borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' },
  option:      { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'pointer' },
  optionHover: { background: '#f5f5f5' },
  empty:       { padding: 12, color: '#666' },
}

function normalizeOptions(options = [], valueKey = 'value', labelKey = 'label', chipLabelKey = null) {
  const getFirstDefined = (obj, keys) => {
    for (const key of keys) {
      const value = obj?.[key]
      if (value !== undefined && value !== null && value !== '') return value
    }
    return undefined
  }

  const candidateValueKeys = [valueKey, 'value', 'id', 'codigo', 'cod', 'serie', 'SERIE', 'nombre', 'name']
  const candidateLabelKeys = [labelKey, 'label', 'nombre', 'name', 'descripcion', 'descripcion_corta', 'text', 'texto', 'title', 'serie', 'SERIE', 'codigo', 'cod']

  return options
    .filter((o) => o != null)
    .map((o) => {
      if (o && typeof o === 'object') {
        const resolvedValue = getFirstDefined(o, candidateValueKeys)
        const resolvedLabel = getFirstDefined(o, candidateLabelKeys)
        const value = resolvedValue ?? resolvedLabel
        const label = resolvedLabel != null ? String(resolvedLabel) : resolvedValue != null ? String(resolvedValue) : ''
        const chipLabel = chipLabelKey && o[chipLabelKey] != null
        ? String(o[chipLabelKey])
        : label

        return {
          value,
          label,
          chipLabel,
          orig: o,
        }
      }
      return { value: o, label: String(o ?? ''), chipLabel: String(o ?? '') ,orig: o }
    })
    .filter((o) => o.value != null && String(o.value).trim() !== '')
}

export default function SelectFiltro({
  options    = [],
  value      = [],
  onChange   = () => {},
  placeholder = 'Buscar...',
  multi      = true,
  searchable = true,
  valueKey   = 'value',
  labelKey   = 'label',
  chipLabelKey =null,
  emitObjects = false,
}) {
  const normalized = normalizeOptions(options, valueKey, labelKey, chipLabelKey)

  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  const toValues = (val) => {
    if (!Array.isArray(val)) return []
    if (emitObjects) return val.map((v) => (v && v[valueKey] !== undefined ? v[valueKey] : v))
    return val
  }

  const [selected, setSelected] = useState(() => toValues(value))

  useEffect(() => {
    setSelected(toValues(value))
  }, [value, emitObjects, valueKey])

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const toggleOption = (val) => {
    let next
    if (multi) {
      next = selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]
    } else {
      next = selected.includes(val) ? [] : [val]
      setOpen(false)
    }
    setSelected(next)

    if (emitObjects) {
      const objs = next.map((v) => {
        const found = normalized.find((n) => n.value === v)
        if (found) {
          return { value: found.value, label: found.label, chipLabel: found.chipLabel ,orig: found.orig }
        }
        return { value: v, label: String(v ?? '') }
      })
      onChange(objs)
    } else {
      onChange(next)
    }
  }

  // ← Protección: String(label) antes de toLowerCase por si acaso
  const filtered = normalized.filter((o) =>
    String(o.label).toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={defaultStyles.container} ref={ref}>
      <div style={defaultStyles.control} onClick={() => setOpen(true)}>
        {selected
          .map((val) => normalized.find((n) => n.value === val))
          .filter(Boolean)
          .map((sel) => (
            <div key={sel.value} style={defaultStyles.chip}>
              <span>{sel.chipLabel}</span>
              <button
                onClick={(e) => { e.stopPropagation(); toggleOption(sel.value) }}
                aria-label="remove"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
          ))}

        {searchable && (
          <input
            style={defaultStyles.input}
            value={query}
            placeholder={placeholder}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {open && (
        <div style={defaultStyles.dropdown}>
          {filtered.length === 0 ? (
            <div style={defaultStyles.empty}>Sin opciones</div>
          ) : (
            filtered.map((opt) => {
              const checked = selected.includes(opt.value)
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={checked}
                  style={defaultStyles.option}
                  onClick={() => toggleOption(opt.value)}
                >
                  <input type="checkbox" readOnly checked={checked} />
                  <div style={{ flex: 1 }}>{opt.label}</div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}