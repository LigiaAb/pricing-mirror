import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ColumnSelect: dropdown para mostrar/ocultar columnas de una tabla.
//
// Props:
// - columns: arreglo de columnas disponibles [{ key: 'valor_total', label: 'Valor Total' }]
// - visibleKeys: Set o arreglo de keys actualmente visibles
// - onChange: función que recibe el nuevo Set de keys visibles

export default function ColumnSelect({ columns = [], visibleKeys = [], onChange }) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, maxHeight: 280 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        open &&
        !containerRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return

      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const spaceBelow = viewportHeight - rect.bottom - 12
      const spaceAbove = rect.top - 12
      const desiredMaxHeight = 320
      const shouldOpenUp = spaceBelow < desiredMaxHeight && spaceAbove > desiredMaxHeight

      const top = shouldOpenUp
        ? Math.max(12, rect.top - Math.min(desiredMaxHeight, spaceAbove - 12))
        : Math.min(rect.bottom + 6, viewportHeight - 24)

      const left = Math.max(12, Math.min(rect.left, viewportWidth - 240))
      const maxHeight = shouldOpenUp
        ? Math.min(desiredMaxHeight, Math.max(140, spaceAbove - 12))
        : Math.min(desiredMaxHeight, Math.max(140, spaceBelow - 12))

      setMenuPosition({ top, left, maxHeight })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  const visibleSet = new Set(visibleKeys)

  const toggleColumn = (key) => {
    const next = new Set(visibleSet)
    if (next.has(key)) {
      if (next.size === 1) return
      next.delete(key)
    } else {
      next.add(key)
    }
    onChange(next)
  }

  const seleccionarTodas = () => {
    onChange(new Set(columns.map((c) => c.key)))
  }

  const deseleccionarTodas = () => {
    onChange(new Set([columns[0]?.key]))
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          border: '1px solid #d0d5dd',
          borderRadius: 8,
          background: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          color: '#344054',
          boxShadow: '0 1px 2px rgba(16,24,40,0.05)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="2" width="4" height="12" rx="1" fill="#667085" />
          <rect x="6" y="2" width="4" height="12" rx="1" fill="#667085" />
          <rect x="11" y="2" width="4" height="12" rx="1" fill="#667085" />
        </svg>
        Columnas
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        >
          <path d="M4 6l4 4 4-4" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 2000,
            background: '#fff',
            border: '1px solid #e4e7ec',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(16,24,40,0.12)',
            minWidth: 220,
            padding: '8px 0',
            maxHeight: menuPosition.maxHeight,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '6px 14px 10px',
              borderBottom: '1px solid #f2f4f7',
            }}
          >
            <button onClick={seleccionarTodas} style={quickBtnStyle}>
              Seleccionar todas
            </button>
            <button onClick={deseleccionarTodas} style={quickBtnStyle}>
              Limpiar
            </button>
          </div>

          <div style={{ maxHeight: menuPosition.maxHeight - 48, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {columns.map((col) => {
              const isVisible = visibleSet.has(col.key)
              return (
                <div
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: isVisible ? '2px solid #7c3aed' : '2px solid #d0d5dd',
                      background: isVisible ? '#7c3aed' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    {isVisible && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 14, color: '#344054' }}>{col.label}</span>
                </div>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const quickBtnStyle = {
  fontSize: 12,
  color: '#6941c6',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 0',
  fontWeight: 500,
}