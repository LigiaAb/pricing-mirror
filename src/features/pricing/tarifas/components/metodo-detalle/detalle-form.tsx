"use client";

import { Plus, Save, X } from "lucide-react";
import React from "react";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupInput } from "@/shared/components/ui/input-group";
import { useFiltroOpciones } from "../../hooks/use-opciones-tarifa";
import type { DetalleTipoOption, FilaMetodoDetalle } from "./detalle-columns";

type Props = {
  value?: FilaMetodoDetalle | null;
  tipos: DetalleTipoOption[];

  onGuardar: (row: FilaMetodoDetalle) => void;
  onCancelar?: () => void;

  isPending?: boolean;
};

export function DetalleForm({ value, tipos, onGuardar, onCancelar, isPending = false }: Props) {
  const [row, setRow] = React.useState<FilaMetodoDetalle>(value ?? {});

  React.useEffect(() => {
    setRow(value ?? {});
  }, [value]);

  const fetchTipos = useFiltroOpciones(tipos);

  const guardar = () => {
    // comportamiento ACTUAL del componente viejo:
    // solamente tipo es obligatorio.
    if (!row.tipo) return;

    onGuardar(row);

    if (!row.cod_tarifa_detalle) {
      setRow({});
    }
  };

  const esEdicion = Boolean(row.cod_tarifa_detalle);

  return (
    <div className="grid items-end gap-2 md:grid-cols-2 xl:grid-cols-4">
      <Field>
        <FieldLabel>Tipo de Detalle</FieldLabel>

        <InputGroup>
          <AsyncComboboxInput<DetalleTipoOption>
            label="Tipo de Detalle"
            value={row.tipo ?? null}
            onChange={(tipo) =>
              setRow((prev) => ({
                ...prev,
                tipo,
              }))
            }
            fetchOptions={fetchTipos}
            initialOptions={tipos}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar tipo..."
            minSearchLength={0}
            fetchOnEmpty
            clearable
          />
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Descripción</FieldLabel>

        <InputGroup>
          <InputGroupInput
            value={row.descripcion ?? ""}
            onChange={(event) =>
              setRow((prev) => ({
                ...prev,
                descripcion: event.target.value === "" ? null : event.target.value,
              }))
            }
          />
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Valor</FieldLabel>

        <InputGroup>
          <InputGroupInput
            type="number"
            value={row.valor ?? ""}
            onChange={(event) =>
              setRow((prev) => ({
                ...prev,
                valor: event.target.value === "" ? null : Number(event.target.value),
              }))
            }
          />
        </InputGroup>
      </Field>

      <div className="flex gap-2">
        <Button type="button" onClick={guardar} disabled={!row.tipo || isPending}>
          {esEdicion ? <Save className="size-4" /> : <Plus className="size-4" />}

          {esEdicion ? "Guardar" : "Agregar"}
        </Button>

        {esEdicion && (
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancelar}>
            <X className="size-4" />
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
