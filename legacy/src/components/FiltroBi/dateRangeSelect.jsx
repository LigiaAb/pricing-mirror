import React, { useEffect, useMemo, useRef, useState } from 'react'
import moment from 'moment'

// ---------- Tokens de diseño (mismos que ClienteBi) ----------

const TOKENS = {
  primary: '#006699',       // azul corporativo — acento principal
  primaryDark: '#004A70',   // texto fuerte, valores activos
  primarySoft: '#EAF3F8',   // fondos suaves
  accent: '#E6A817',        // dorado — detalle secundario
  border: '#DCE6EC',        // bordes sutiles
  track: '#E4ECF1',         // fondo del track del slider (deriva de border)
  surface: '#FFFFFF',
  ink: '#1F2D36',           // texto principal
  inkMuted: '#5B6B76',      // texto secundario / labels
}

// ---------- Utilidades ----------

const pad = (value) => String(value).padStart(2, '0')
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const parseTimestamp = (value) => {
  if (value == null || value === '') return null
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()

  const normalized = String(value).trim()
  const parsed = moment(normalized, [
    'YYYY-MM-DD HH:mm:ss.SSS',
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DDTHH:mm:ss.SSS',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DD',
    moment.ISO_8601,
  ], true)

  if (parsed.isValid()) return parsed.valueOf()

  const fallback = new Date(normalized.replace(' ', 'T'))
  return Number.isNaN(fallback.getTime()) ? null : fallback.getTime()
}

const formatTimestamp = (timestamp, tipo) => {
  if (timestamp == null) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return tipo === 'datetime'
    ? `${year}-${month}-${day}T${hours}:${minutes}`
    : `${year}-${month}-${day}`
}

const formatLabel = (timestamp, tipo) => {
  if (timestamp == null) return '—'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '—'

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return tipo === 'datetime'
    ? `${day}/${month}/${year} ${hours}:${minutes}`
    : `${day}/${month}/${year}`
}

// ---------- Estilos (paleta alineada a ClienteBi) ----------

const styles = {
  container: {
    display: 'flex', flexDirection: 'column', gap: 12,
    width: '100%', maxWidth: 540, fontFamily: 'inherit',
  },
  labelRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: 12, fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
    color: TOKENS.inkMuted, textTransform: 'uppercase',
  },
  valueChip: {
    fontSize: 13, fontWeight: 700, color: TOKENS.primaryDark,
    background: TOKENS.primarySoft, borderRadius: 999,
    padding: '4px 12px', whiteSpace: 'nowrap', letterSpacing: 0,
    textTransform: 'none',
  },
  sliderWrapper: { position: 'relative', width: '100%', minHeight: 40, padding: '16px 2px' },
  track: {
    position: 'absolute', top: '50%', left: 0, right: 0, height: 6,
    transform: 'translateY(-50%)', borderRadius: 999, background: TOKENS.track,
  },
  rangeHighlight: {
    position: 'absolute', top: '50%', height: 6,
    transform: 'translateY(-50%)', borderRadius: 999,
    background: `linear-gradient(90deg, ${TOKENS.primary}, ${TOKENS.primaryDark})`,
  },
  thumb: {
    position: 'absolute', top: '50%', width: 18, height: 18, borderRadius: '50%',
    transform: 'translate(-50%, -50%)', background: TOKENS.surface,
    border: `2px solid ${TOKENS.primary}`,
    boxShadow: `0 0 0 4px ${TOKENS.primarySoft}, 0 1px 2px rgba(0,0,0,0.15)`,
    cursor: 'grab', transition: 'box-shadow 0.15s ease',
  },
  thumbActive: {
    boxShadow: `0 0 0 6px ${TOKENS.primarySoft}, 0 2px 4px rgba(0,0,0,0.2)`,
    cursor: 'grabbing',
  },
  inputsRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  inputGroup: { flex: '1 1 160px', minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4 },
  inputCaption: {
    fontSize: 11, fontWeight: 600, color: TOKENS.inkMuted,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  input: {
    padding: '8px 10px', border: `1px solid ${TOKENS.border}`, borderRadius: 8,
    fontSize: 14, outline: 'none', color: TOKENS.ink, background: TOKENS.surface,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
}

// ---------- Componente ----------

export default function DateRangeSelect({
  label = 'Rango de fechas',
  tipo = 'date',
  value = [null, null],
  onChange = () => {},
  min,
  max,
}) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(null)   // 'low' | 'high' | null
  const [focusedInput, setFocusedInput] = useState(null) // 'low' | 'high' | null

  // Límites como timestamps
  const minTs = useMemo(() => parseTimestamp(min), [min])
  const maxTs = useMemo(() => parseTimestamp(max), [max])
  const defaultMin = minTs ?? (maxTs ? maxTs - 30 * 24 * 60 * 60 * 1000 : Date.now() - 30 * 24 * 60 * 60 * 1000)
  const defaultMax = maxTs ?? (minTs ? minTs + 30 * 24 * 60 * 60 * 1000 : Date.now())

  // Rango inicial
  const initialRange = useMemo(() => {
    const start = parseTimestamp(value[0]) ?? defaultMin
    const end   = parseTimestamp(value[1]) ?? defaultMax
    return [
      clamp(Math.min(start, end), defaultMin, defaultMax),
      clamp(Math.max(start, end), defaultMin, defaultMax),
    ]
  }, [value, defaultMin, defaultMax])

  const [range, setRange] = useState(initialRange)

  useEffect(() => { setRange(initialRange) }, [initialRange])

  const [low, high] = range

  // ---------- Drag del slider ----------

  useEffect(() => {
    if (!dragging) return

    const handleMove = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX
      if (clientX == null || !trackRef.current) return

      const rect  = trackRef.current.getBoundingClientRect()
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
      const raw   = defaultMin + ratio * (defaultMax - defaultMin)
      const next  = clamp(raw, defaultMin, defaultMax)

      if (dragging === 'low') {
        const nextLow = Math.min(next, high)
        setRange([nextLow, high])
        onChange([nextLow, high])
      } else {
        const nextHigh = Math.max(next, low)
        setRange([low, nextHigh])
        onChange([low, nextHigh])
      }
    }

    const handleUp = () => setDragging(null)

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup',   handleUp)
    window.addEventListener('touchmove',   handleMove)
    window.addEventListener('touchend',    handleUp)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup',   handleUp)
      window.removeEventListener('touchmove',   handleMove)
      window.removeEventListener('touchend',    handleUp)
    }
  }, [dragging, low, high, defaultMin, defaultMax, onChange])

  // ---------- Inputs de texto ----------

  const handleInputChange = (index, e) => {
    const parsed = parseTimestamp(e.target.value)
    if (parsed === null) return

    const next = [...range]
    next[index] = parsed
    const normalized = [
      clamp(Math.min(next[0], next[1]), defaultMin, defaultMax),
      clamp(Math.max(next[0], next[1]), defaultMin, defaultMax),
    ]
    setRange(normalized)
    onChange(normalized)
  }

  // ---------- Porcentajes para el slider ----------

  const span        = defaultMax - defaultMin || 1
  const percentLow  = ((low  - defaultMin) / span) * 100
  const percentHigh = ((high - defaultMin) / span) * 100

  const inputFocusStyle = {
    borderColor: TOKENS.primary,
    boxShadow: `0 0 0 3px ${TOKENS.primarySoft}`,
  }

  return (
    <div style={styles.container}>

      {/* Fila de label + valores actuales */}
      <div style={styles.labelRow}>
        <span>{label}</span>
        <span style={styles.valueChip}>
          {formatLabel(low, tipo)} — {formatLabel(high, tipo)}
        </span>
      </div>

      {/* Slider */}
      <div style={styles.sliderWrapper} ref={trackRef}>
        <div style={styles.track} />
        <div style={{
          ...styles.rangeHighlight,
          left:  `${percentLow}%`,
          width: `${Math.max(percentHigh - percentLow, 0)}%`,
        }} />
        <div
          role="slider"
          aria-label={`Inicio ${label}`}
          aria-valuetext={formatLabel(low, tipo)}
          tabIndex={0}
          onPointerDown={() => setDragging('low')}
          onTouchStart={() => setDragging('low')}
          style={{
            ...styles.thumb,
            left: `${percentLow}%`,
            ...(dragging === 'low' ? styles.thumbActive : null),
          }}
        />
        <div
          role="slider"
          aria-label={`Fin ${label}`}
          aria-valuetext={formatLabel(high, tipo)}
          tabIndex={0}
          onPointerDown={() => setDragging('high')}
          onTouchStart={() => setDragging('high')}
          style={{
            ...styles.thumb,
            left: `${percentHigh}%`,
            ...(dragging === 'high' ? styles.thumbActive : null),
          }}
        />
      </div>

      {/* Inputs de fecha */}
      <div style={styles.inputsRow}>
        <div style={styles.inputGroup}>
          <span style={styles.inputCaption}>Desde</span>
          <input
            type={tipo === 'datetime' ? 'datetime-local' : 'date'}
            value={formatTimestamp(low, tipo)}
            min={formatTimestamp(defaultMin, tipo)}
            max={formatTimestamp(high, tipo)}
            onChange={(e) => handleInputChange(0, e)}
            onFocus={() => setFocusedInput('low')}
            onBlur={() => setFocusedInput(null)}
            style={{
              ...styles.input,
              ...(focusedInput === 'low' ? inputFocusStyle : null),
            }}
            aria-label={`Inicio de rango ${label}`}
          />
        </div>
        <div style={styles.inputGroup}>
          <span style={styles.inputCaption}>Hasta</span>
          <input
            type={tipo === 'datetime' ? 'datetime-local' : 'date'}
            value={formatTimestamp(high, tipo)}
            min={formatTimestamp(low, tipo)}
            max={formatTimestamp(defaultMax, tipo)}
            onChange={(e) => handleInputChange(1, e)}
            onFocus={() => setFocusedInput('high')}
            onBlur={() => setFocusedInput(null)}
            style={{
              ...styles.input,
              ...(focusedInput === 'high' ? inputFocusStyle : null),
            }}
            aria-label={`Fin de rango ${label}`}
          />
        </div>
      </div>

    </div>
  )
}