"use client";

import { Plus } from "lucide-react";
import React from "react";
import { useFetchEntidades } from "@/features/entidades";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup } from "@/shared/components/ui/input-group";
import type { EntidadTarifaOption } from "../../api/buscar-entidad";

type Props = {
  fetchOptions: (search: string) => Promise<EntidadTarifaOption[]>;
  onAgregar: (entidad: EntidadTarifaOption) => void;
  isPending?: boolean;
};

export function EntidadForm({ fetchOptions, onAgregar, isPending = false }: Props) {
  const [entidad, setEntidad] = React.useState<EntidadTarifaOption | null>(null);

  const entidadesConsultadas = useFetchEntidades({ tipo_entidad: "CLIENTE" });
  const agregar = () => {
    if (!entidad) return;

    onAgregar(entidad);
    setEntidad(null);
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Field>
          <FieldLabel>Entidad</FieldLabel>

          <InputGroup>
            <AsyncComboboxInput<EntidadTarifaOption>
              label="Entidad"
              value={entidad}
              onChange={setEntidad}
              fetchOptions={fetchOptions}
              initialOptions={entidadesConsultadas.data ?? []}
              getOptionValue={(option) => option.entidad_id}
              getOptionLabel={(option) => option.entidad_nombre}
              placeholder="Seleccione una entidad..."
              searchPlaceholder="Buscar entidad..."
              minSearchLength={1}
              fetchOnEmpty
              clearable
            />
          </InputGroup>
        </Field>
      </div>

      <Button type="button" onClick={agregar} disabled={!entidad || isPending}>
        <Plus className="size-4" />
        Agregar
      </Button>
    </div>
  );
}
