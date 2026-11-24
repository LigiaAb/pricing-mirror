import React, { useEffect, useMemo, useRef, useState } from 'react'

// ---------- Tokens de diseño (mismos que DateRangeSelect / ClienteBi) ----------

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

// ---------- Estilos (idénticos en estructura a DateRangeSelect) ----------

const styles = {
  container: {
    display: 'flex', flexDirection: 'column', gap: 12,
    width: '100%', maxWidth: 500, fontFamily: 'inherit',
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
  inputGroup: { flex: '1 1 140px', minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4 },
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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const roundToStep = (value, step, min) => {
  const stepped = Math.round((value - min) / step) * step + min
  return Number(stepped.toFixed(8))
}

export default function RangeSelect({
  label = 'Rango',
  min = 0,
  max = 100,
  step = 1,
  value = [0, 100],
  onChange = () => {},
  showNumberInputs = true,
  formatValue = (val) => val,
}) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [focusedInput, setFocusedInput] = useState(null) // 'low' | 'high' | null
  const [range, setRange] = useState(() => {
    if (!Array.isArray(value) || value.length !== 2) return [min, max]
    return [clamp(value[0], min, max), clamp(value[1], min, max)]
  })

  const [low, high] = range

  const [lowText, setLowText] = useState(String(low));
  const [highText, setHighText] = useState(String(high))

  useEffect(() => {
    if (!Array.isArray(value) || value.length !== 2) return
    const nextLow = clamp(value[0], min, max)
    const nextHigh = clamp(value[1], min, max)
    setRange([nextLow, nextHigh])
    setLowText(String(nextLow))
    setHighText(String(nextHigh))
  }, [value, min, max])

  useEffect(() => {
    if (!dragging) return undefined

    const handleMove = (event) => {
      const clientX = event.clientX ?? (event.touches && event.touches[0]?.clientX)
      if (clientX == null || !trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
      const raw = min + ratio * (max - min)
      const nextValue = clamp(roundToStep(raw, step, min), min, max)

      if (dragging === 'low') {
        const nextLow = Math.min(nextValue, high)
        setRange([nextLow, high])
        onChange([nextLow, high])
      } else {
        const nextHigh = Math.max(nextValue, low)
        setRange([low, nextHigh])
        onChange([low, nextHigh])
      }
    }

    const handleUp = () => setDragging(null)

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleUp)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [dragging, high, low, max, min, onChange, step])

  const updateRange = (nextRange) => {
    const next = [clamp(nextRange[0], min, max), clamp(nextRange[1], min, max)]
    const stable = next[0] <= next[1] ? next : [next[1], next[0]]
    setRange(stable)
    setLowText(String(stable[0]))
    setHighText(String(stable[1]))
    onChange(stable)
  }

  const percentLow = max === min ? 0 : ((low - min) / (max - min)) * 100
  const percentHigh = max === min ? 100 : ((high - min) / (max - min)) * 100

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
          {formatValue(low)} — {formatValue(high)}
        </span>
      </div>

      {/* Slider */}
      <div style={styles.sliderWrapper} ref={trackRef}>
        <div style={styles.track} />
        <div
          style={{
            ...styles.rangeHighlight,
            left: `${percentLow}%`,
            width: `${Math.max(percentHigh - percentLow, 0)}%`,
          }}
        />
        <div
          role="slider"
          aria-label={`Min ${label}`}
          aria-valuetext={String(formatValue(low))}
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
          aria-label={`Max ${label}`}
          aria-valuetext={String(formatValue(high))}
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

      {/* Inputs numéricos */}
      {showNumberInputs && (
        <div style={styles.inputsRow}>
          <div style={styles.inputGroup}>
            <span style={styles.inputCaption}>Desde</span>
            <input
              type="number"
              value={lowText}
              step={step}
              onChange={(event) => {
                const raw = event.target.value
                setLowText(raw) // siempre refleja lo que el usuario escribe, incluso "-" o "-5"

                // Solo confirmamos el cambio si ya es un número completo y válido
                if (raw === '' || raw === '-') return
                const numeric = Number(raw)
                if (Number.isNaN(numeric)) return

                const nextLow = clamp(Math.min(numeric, high), min, max)
                setRange([nextLow, high])
                onChange([nextLow, high])
              }}
              onBlur={() => {
                setFocusedInput(null)
                // al salir del input, si quedó algo inválido o vacío, lo normalizamos al valor actual
                setLowText(String(low))
              }}
              onFocus={() => setFocusedInput('low')}
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
              type="number"
              value={highText}
              step={step}
              onChange={(event) => {
                const raw = event.target.value
                setHighText(raw)

                if (raw === '' || raw === '-') return
                const numeric = Number(raw)
                if (Number.isNaN(numeric)) return

                const nextHigh = clamp(Math.max(numeric, low), min, max)
                setRange([low, nextHigh])
                onChange([low, nextHigh])
              }}
              onBlur={() => {
                setFocusedInput(null)
                setHighText(String(high))
              }}
              onFocus={() => setFocusedInput('high')}
              style={{
                ...styles.input,
                ...(focusedInput === 'high' ? inputFocusStyle : null),
              }}
              aria-label={`Fin de rango ${label}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}