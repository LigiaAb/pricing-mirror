"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@radix-ui/react-checkbox";
import { GripVertical, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "../ui/badge";

// NOTA: instala las dependencias de drag & drop si aún no las tienes:
// npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CampoConfig {
  campo: string;
  etiqueta: string;
}

interface NivelesBuilderProps {
  camposDisponibles: CampoConfig[];
  nivelesActivos: CampoConfig[];
  onChange: (nuevosNiveles: CampoConfig[]) => void;
}

// ── Fila arrastrable de "Niveles activos" ─────────────────────────────────────

function NivelArrastrable({
  id,
  index,
  etiqueta,
  onQuitar,
}: {
  id: string;
  index: number;
  etiqueta: string;
  onQuitar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between gap-2",
        "bg-card border border-primary/20 rounded-md px-2 py-1.5",
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex items-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-primary flex-shrink-0">{index + 1}.</span>
        <span className="text-sm text-foreground truncate">{etiqueta}</span>
      </div>

      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar ${etiqueta}`}
        className="flex-shrink-0 flex items-center gap-1 h-5 px-2 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground text-xs transition-colors cursor-pointer"
      >
        quitar
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function NivelesBuilder({
  camposDisponibles,
  nivelesActivos,
  onChange,
}: NivelesBuilderProps) {
  const estaActivo = (campo: string) => nivelesActivos.some((n) => n.campo === campo);

  const toggleCampo = (campoObj: CampoConfig) => {
    if (estaActivo(campoObj.campo)) {
      onChange(nivelesActivos.filter((n) => n.campo !== campoObj.campo));
    } else {
      onChange([...nivelesActivos, campoObj]);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = nivelesActivos.findIndex((n) => n.campo === active.id);
    const newIndex = nivelesActivos.findIndex((n) => n.campo === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onChange(arrayMove(nivelesActivos, oldIndex, newIndex));
  };

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {/* ── Campos disponibles ── */}
      <div className="flex-1 min-w-60">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Campos disponibles
        </p>
        <div className="border border-border rounded-md divide-y divide-border">
          {camposDisponibles.map((campoObj) => (
            <label
              key={campoObj.campo}
              htmlFor={`campo-${campoObj.campo}`}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors select-none",
                estaActivo(campoObj.campo)
                  ? "bg-primary/10 text-primary font-semibold"
                  : "hover:bg-muted",
              )}
            >
              <Checkbox
                id={`campo-${campoObj.campo}`}
                checked={estaActivo(campoObj.campo)}
                onCheckedChange={() => toggleCampo(campoObj)}
                className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm text-foreground font-medium">{campoObj.etiqueta}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Niveles activos (orden, arrastrable) ── */}
      <div className="flex-1 min-w-70">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Niveles del árbol{" "}
          <span className="font-normal normal-case text-muted-foreground">
            (de raíz a hoja) — arrastra para reordenar
          </span>
        </p>

        <div
          className={cn(
            "border border-dashed border-primary/30 rounded-md p-2 bg-primary/5 min-h-15",
            "flex flex-col gap-1.5",
          )}
        >
          {nivelesActivos.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1 py-2">
              Marca campos en la lista de la izquierda para armar el árbol
            </p>
          ) : (
            <DndContext
              id="niveles-builder-dnd"
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
        </div>

        {/* Active count badge */}
        {nivelesActivos.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className="text-xs bg-primary/10 text-primary border-primary/20"
            >
              {nivelesActivos.length} {nivelesActivos.length === 1 ? "nivel" : "niveles"} activo
              {nivelesActivos.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
