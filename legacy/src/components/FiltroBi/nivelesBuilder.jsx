import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Chip,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DragIndicator } from '@mui/icons-material';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

/**
 * Fila individual arrastable de la lista de "Niveles activos".
 * Usa el hook useSortable de dnd-kit, que da el listener de arrastre,
 * el transform/transition para la animacion, y el isDraagging
 */

function NivelArrastrable({ id, index, etiqueta, onQuitar }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
     transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      disablePadding
      sx={{
        mb: 0.5,
        px: 1,
        py: 0.5,
        background: '#fff',
        border: '1px solid #93c5fd',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            color: 'text.disabled',
            touchAction: 'none'
          }}
        >
          <DragIndicator fontSize='small' />

        </Box>
        <strong style={{ color: '#1d4ed8', fontSize: 13 }}>{index + 1}.</strong>
        <Typography variant='body2' noWrap>{etiqueta}</Typography>
      </Box>

      <Chip
        label="quitar"
        size='small'
        onClick={onQuitar}
        sx={{ cursor: 'pointer', height: 20, fontSize: 11, flexShrink: 0 }}
      />

    </ListItem>
  )

}

/**
 * Constructor de jerarquía SIN drag & drop, solo MUI puro:
 * - Un checkbox por campo activa/desactiva ese nivel.
 * - Los niveles activos se numeran en el orden en que fueron activados
 *   (= orden del árbol, de raíz a hoja) y se pueden reordenar con flechas ↑↓.
 *
 * Misma interfaz que la versión drag & drop, así que no hay que tocar
 * nada en ClienteBi.jsx: recibe los mismos props y llama a onChange
 * con el mismo formato [{ campo, etiqueta }, ...] en el orden deseado.
 *
 * @param {Array<{campo: string, etiqueta: string}>} camposDisponibles - todos los campos posibles
 * @param {Array<{campo: string, etiqueta: string}>} nivelesActivos - subconjunto + orden actual
 * @param {(nuevosNiveles: Array) => void} onChange
 */
export default function NivelesBuilder({ camposDisponibles, nivelesActivos, onChange }) {
  const estaActivo = (campo) => nivelesActivos.some((n) => n.campo === campo);

  const toggleCampo = (campoObj) => {
    if (estaActivo(campoObj.campo)) {
      // Desactivar: lo quitamos de la lista de activos
      onChange(nivelesActivos.filter((n) => n.campo !== campoObj.campo));
    } else {
      // Activar: se agrega al final (será el último nivel = hoja, por ahora)
      onChange([...nivelesActivos, campoObj]);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = nivelesActivos.findIndex((n) => n.campo === active.id);
    const newIndex = nivelesActivos.findIndex((n) => n.campo === over.id)
    if (oldIndex === -1 || newIndex === -1) return;

    onChange(arrayMove(nivelesActivos, oldIndex, newIndex))

  }

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
      {/* Columna: todos los campos, con checkbox para activar/desactivar */}
      <Box sx={{ flex: '1 1 240px', minWidth: 240 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          Campos disponibles
        </Typography>
        <List dense sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 0 }}>
          {camposDisponibles.map((campoObj) => (
            <ListItem key={campoObj.campo} disablePadding sx={{ px: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Checkbox
                  edge="start"
                  size="small"
                  checked={estaActivo(campoObj.campo)}
                  onChange={() => toggleCampo(campoObj)}
                />
              </ListItemIcon>
              <ListItemText primary={campoObj.etiqueta} primaryTypographyProps={{ fontSize: 13 }} />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ flex: '1 1 280px', minWidth: 280 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          Niveles del árbol (de raíz a hoja) — arrastra para reordenar
        </Typography>
        <List
          dense
          sx={{
            border: '1px dashed #93c5fd',
            borderRadius: 1,
            p: 1,
            background: '#eef6ff',
            minHeight: 60,
          }}
        >
          {nivelesActivos.length === 0 ? (
            <Typography variant="caption" sx={{ color: 'text.disabled', p: 1 }}>
              Marca campos en la lista de la izquierda para armar el árbol
            </Typography>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={nivelesActivos.map((n) => n.campo)}
                strategy={verticalListSortingStrategy}
              >
                {nivelesActivos.map((campoObj, index) => (
                  <NivelArrastrable
                    key={campoObj.campo}
                    id={campoObj.campo}
                    index={index}
                    etiqueta={campoObj.etiqueta}
                    onQuitar={() => toggleCampo(campoObj)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </List>
      </Box>

    </Box>
  );
}