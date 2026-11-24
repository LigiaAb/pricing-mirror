import React, { useState, useMemo } from 'react';
import {
  Popper,
  Paper,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  ClickAwayListener
} from '@mui/material';

import TablaComponent from './TablaComponent';

// Componente de filtro individual
const FiltroColumna = ({ 
  open, 
  anchorEl, 
  columna, 
  datos, 
  filtrosActivos, 
  onFiltrosChange, 
  onClose 
}) => {
  // Función para obtener el valor de un campo considerando múltiples posibles nombres
  const obtenerValorCampo = (item, campo) => {
    // Lista de posibles nombres de campos (lowercase y uppercase)
    const posiblesNombres = [
      campo,
      campo.toUpperCase(),
      campo.toLowerCase(),
      // Mapeos específicos para campos comunes
      ...(campo === 'tipo_descripcion_embarque' ? ['TIPO_DESCRIPCION_EMBARQUE', 'tipo_descripcion_embarque'] : []),
      ...(campo === 'servicio_nombre' ? ['SERVICIO_NOMBRE', 'servicio_nombre'] : []),
      ...(campo === 'tipo_descripcion' ? ['TIPO_DESCRIPCION', 'tipo_descripcion'] : []),
      ...(campo === 'nombre_pais_origen' ? ['NOMBRE_PAIS_ORIGEN', 'nombre_pais_origen'] : []),
      ...(campo === 'nombre_pais_destino' ? ['NOMBRE_PAIS_DESTINO', 'nombre_pais_destino'] : []),
      ...(campo === 'puntoenlace_nombre_origen' ? ['PUNTOENLACE_NOMBRE_ORIGEN', 'puntoenlace_nombre_origen'] : []),
      ...(campo === 'puntoenlace_nombree_destino' ? ['PUNTOENLACE_NOMBREE_DESTINO', 'puntoenlace_nombree_destino'] : []),
      ...(campo === 'entidad_nombre' ? ['ENTIDAD_NOMBRE', 'entidad_nombre'] : []),
      ...(campo === 'estado_descripcion' ? ['ESTADO_DESCRIPCION', 'estado_descripcion'] : [])
    ];

    for (const nombre of posiblesNombres) {
      if (item[nombre] !== undefined && item[nombre] !== null && item[nombre] !== '') {
        // console.log(`[FiltroColumna] Campo ${campo} encontrado como ${nombre}:`, item[nombre]);
        return item[nombre];
      }
    }

    //console.log(`[FiltroColumna] Campo ${campo} no encontrado en item:`, Object.keys(item));
    return null;
  };

  // Generar opciones únicas para la columna
  const opciones = useMemo(() => {
    const valoresUnicos = new Set();
    
    datos.forEach((item) => {
      let valor = obtenerValorCampo(item, columna.campo);
      
      // Aplicar formato si existe
      if (columna.formato && typeof columna.formato === 'function') {
        valor = columna.formato(valor, item);
      }
      
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
            Filtrar por {columna.label}
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

// Componente principal que envuelve TablaComponent
const TablaConFiltros = (props) => {
  const { encabezado, datos = [], ...restProps } = props;
  
  // Estados para filtros
  const [filtrosActivos, setFiltrosActivos] = useState({});
  const [filtroAnchorEl, setFiltroAnchorEl] = useState(null);
  const [columnaFiltroActiva, setColumnaFiltroActiva] = useState(null);

  // Columnas que pueden tener filtros
  const columnasFiltrables = [
    'tipo_descripcion_embarque', 
    'servicio_nombre', 
    'tipo_descripcion',
    'nombre_pais_origen',
    'nombre_pais_destino',
    'puntoenlace_nombre_origen',
    'puntoenlace_nombree_destino',
    'entidad_nombre',
    'estado_descripcion'
  ];

  // Función para obtener el valor de un campo considerando múltiples posibles nombres
  const obtenerValorCampo = (item, campo) => {
    // Lista de posibles nombres de campos (lowercase y uppercase)
    const posiblesNombres = [
      campo,
      campo.toUpperCase(),
      campo.toLowerCase(),
      // Mapeos específicos para campos comunes
      ...(campo === 'tipo_descripcion_embarque' ? ['TIPO_DESCRIPCION_EMBARQUE', 'tipo_descripcion_embarque'] : []),
      ...(campo === 'servicio_nombre' ? ['SERVICIO_NOMBRE', 'servicio_nombre'] : []),
      ...(campo === 'tipo_descripcion' ? ['TIPO_DESCRIPCION', 'tipo_descripcion'] : []),
      ...(campo === 'nombre_pais_origen' ? ['NOMBRE_PAIS_ORIGEN', 'nombre_pais_origen'] : []),
      ...(campo === 'nombre_pais_destino' ? ['NOMBRE_PAIS_DESTINO', 'nombre_pais_destino'] : []),
      ...(campo === 'puntoenlace_nombre_origen' ? ['PUNTOENLACE_NOMBRE_ORIGEN', 'puntoenlace_nombre_origen'] : []),
      ...(campo === 'puntoenlace_nombree_destino' ? ['PUNTOENLACE_NOMBREE_DESTINO', 'puntoenlace_nombree_destino'] : []),
      ...(campo === 'entidad_nombre' ? ['ENTIDAD_NOMBRE', 'entidad_nombre'] : []),
      ...(campo === 'estado_descripcion' ? ['ESTADO_DESCRIPCION', 'estado_descripcion'] : [])
    ];

    for (const nombre of posiblesNombres) {
      if (item[nombre] !== undefined && item[nombre] !== null && item[nombre] !== '') {
        //console.log(`[TablaConFiltros] Campo ${campo} encontrado como ${nombre}:`, item[nombre]);
        return item[nombre];
      }
    }
    
    //console.log(`[TablaConFiltros] Campo ${campo} no encontrado en item:`, Object.keys(item));
    return null;
  };

  // Función para aplicar filtros
  const aplicarFiltros = (datos, filtros) => {
    if (!filtros || Object.keys(filtros).length === 0) {
      return datos;
    }

    return datos.filter(item => {
      return Object.keys(filtros).every(campo => {
        const valoresFiltro = filtros[campo];
        if (!valoresFiltro || valoresFiltro.length === 0) return true;

        let valorItem = obtenerValorCampo(item, campo);
        
        // Si no se encuentra el valor, continuar con el siguiente filtro
        if (valorItem === null) return true;
        
        // Aplicar formato si existe
        const columna = encabezado.find(col => col.campo === campo);
        if (columna && columna.formato && typeof columna.formato === 'function') {
          valorItem = columna.formato(valorItem, item);
        }
        
        const valorString = String(valorItem);
        return valoresFiltro.includes(valorString);
      });
    });
  };

  // Datos filtrados
  const datosFiltrados = useMemo(() => {
    //console.log('Aplicando filtros a datos:', datos.length, 'elementos');
    //console.log('Filtros activos:', filtrosActivos);
    const resultado = aplicarFiltros(datos, filtrosActivos);
    //console.log('Resultado filtrado:', resultado.length, 'elementos');
    return resultado;
  }, [datos, filtrosActivos]);

    // Modificar encabezado para agregar iconos de filtro
  const encabezadoConFiltros = useMemo(() => {
    //console.log('Generando encabezado con filtros');
    //console.log('Columnas filtrables:', columnasFiltrables);
    //console.log('Encabezado original:', encabezado);
    
    return encabezado.map(columna => {
      //console.log(`Procesando columna: ${columna.campo}, es filtrable: ${columnasFiltrables.includes(columna.campo)}`);
      
      if (columnasFiltrables.includes(columna.campo)) {
        const tieneFiltros = filtrosActivos[columna.campo] && filtrosActivos[columna.campo].length > 0;
        
        //console.log(`Columna ${columna.campo} tiene filtros:`, tieneFiltros);
        
        return {
          ...columna,
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{columna.label}</span>
              <IconButton
                size="small"
                onClick={(event) => {
                  //console.log(`Abriendo filtro para columna: ${columna.campo}`);
                  setFiltroAnchorEl(event.currentTarget);
                  setColumnaFiltroActiva(columna);
                }}
                sx={{ 
                  p: 0.5,
                  color: tieneFiltros ? 'primary.main' : 'text.secondary',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                <span style={{ fontSize: '16px' }}>🔍</span>
              </IconButton>
              {tieneFiltros && (
                <Chip
                  label={filtrosActivos[columna.campo].length}
                  size="small"
                  color="primary"
                  sx={{ height: 16, fontSize: '0.7rem' }}
                />
              )}
            </span>
          )
        };
      }
      return columna;
    });
  }, [encabezado, filtrosActivos, columnasFiltrables]);

  const handleCloseFiltro = () => {
    setFiltroAnchorEl(null);
    setColumnaFiltroActiva(null);
  };

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltrosActivos(nuevosFiltros);
  };

  return (
    <>
      <TablaComponent
        {...restProps}
        encabezado={encabezadoConFiltros}
        datos={datosFiltrados}
      />
      
      {columnaFiltroActiva && filtroAnchorEl && (
        <FiltroColumna
          open={true}
          anchorEl={filtroAnchorEl}
          columna={columnaFiltroActiva}
          datos={datos}
          filtrosActivos={filtrosActivos}
          onFiltrosChange={handleFiltrosChange}
          onClose={handleCloseFiltro}
        />
      )}
    </>
  );
};

export default TablaConFiltros; 