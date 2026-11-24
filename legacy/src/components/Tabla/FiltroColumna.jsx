import React, { useMemo } from 'react';
import {
  Popper,
  Paper,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  Button,
  Chip,
  ClickAwayListener
} from '@mui/material';

const FiltroColumna = ({ 
  open, 
  anchorEl, 
  columna, 
  datos, 
  filtrosActivos, 
  onFiltrosChange, 
  onClose 
}) => {
  // Generar opciones únicas para la columna
  const opciones = useMemo(() => {
    const valoresUnicos = new Set();
    
    datos.forEach((item) => {
      const valor = item[columna.campo];
      
      if (valor !== null && valor !== undefined && valor !== '') {
        const valorString = String(valor);
        valoresUnicos.add(valorString);
      }
    });
    
    return Array.from(valoresUnicos).sort();
  }, [datos, columna]);

  const valoresSeleccionados = filtrosActivos[columna.campo] || [];

  const handleCheckboxChange = (valor) => {
    const nuevosValores = valoresSeleccionados.includes(valor)
      ? valoresSeleccionados.filter(v => v !== valor)
      : [...valoresSeleccionados, valor];

    const nuevosFiltros = { ...filtrosActivos };
    
    if (nuevosValores.length > 0) {
      nuevosFiltros[columna.campo] = nuevosValores;
    } else {
      delete nuevosFiltros[columna.campo];
    }
    
    onFiltrosChange(nuevosFiltros);
    onClose();
  };

  const handleLimpiar = () => {
    const nuevosFiltros = { ...filtrosActivos };
    delete nuevosFiltros[columna.campo];
    onFiltrosChange(nuevosFiltros);
    onClose();
  };

  // Si no está abierto, no renderizar nada
  if (!open) {
    return null;
  }

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      style={{ zIndex: 1300 }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            minWidth: 200, 
            maxHeight: 300, 
            overflow: 'auto' 
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Filtrar por {columna.titulo}
            </Typography>
            
            {valoresSeleccionados.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Filtros activos:
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {valoresSeleccionados.map((valor, index) => (
                    <Chip
                      key={index}
                      label={valor}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            {opciones.map((opcion) => (
              <FormControlLabel
                key={opcion}
                control={
                  <Checkbox
                    checked={valoresSeleccionados.includes(opcion)}
                    onChange={() => handleCheckboxChange(opcion)}
                    size="small"
                  />
                }
                label={opcion}
                sx={{ 
                  display: 'block', 
                  mb: 0.5,
                  '& .MuiFormControlLabel-label': { fontSize: '0.875rem' }
                }}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleLimpiar}
              disabled={valoresSeleccionados.length === 0}
            >
              Limpiar
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </Box>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
};

export default FiltroColumna; 