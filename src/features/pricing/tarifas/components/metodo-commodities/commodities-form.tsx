"use client";

import { Plus, Save, X } from "lucide-react";
import React from "react";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup } from "@/shared/components/ui/input-group";
import type {
  CommodityOption,
  EstadoCommodityOption,
  FilaMetodoCommodity,
} from "./commodities-columns";

type Props = {
  value?: FilaMetodoCommodity | null;

  commodities: CommodityOption[];
  estados: EstadoCommodityOption[];
  estadoActivo?: EstadoCommodityOption | null;

  onGuardar: (row: FilaMetodoCommodity) => void;
  onCancelar?: () => void;

  isPending?: boolean;
};

function filtrarOpciones<T extends { label: string }>(options: T[], search: string): T[] {
  const busqueda = search.trim().toLowerCase();

  if (!busqueda) return options;

  return options.filter((option) => option.label.toLowerCase().includes(busqueda));
}

export function CommoditiesForm({
  value,
  commodities,
  estados,
  estadoActivo,
  onGuardar,
  onCancelar,
  isPending = false,
}: Props) {
  const [row, setRow] = React.useState<FilaMetodoCommodity>({
    estado: estadoActivo ?? null,
    cod_estado: 1,
  });

  React.useEffect(() => {
    if (value) {
      setRow(value);
      return;
    }

    setRow({
      estado: estadoActivo ?? null,
      cod_estado: 1,
    });
  }, [value, estadoActivo]);

  const fetchCommodities = React.useCallback(
    async (search: string) => filtrarOpciones(commodities, search),
    [commodities],
  );

  const fetchEstados = React.useCallback(
    async (search: string) => filtrarOpciones(estados, search),
    [estados],
  );

  const esEdicion = Boolean(row.cod_metodocommodity);

  const guardar = () => {
    if (!row.commodity) return;
    if (!row.estado) return;

    onGuardar(row);

    if (!esEdicion) {
      setRow({
        estado: estadoActivo ?? null,
        cod_estado: 1,
      });
    }
  };

  return (
    <div className="grid items-end gap-2 md:grid-cols-3">
      <Field>
        <FieldLabel>Commodity</FieldLabel>

        <InputGroup>
          <AsyncComboboxInput<CommodityOption>
            label="Commodity"
            value={row.commodity ?? null}
            onChange={(commodity) =>
              setRow((prev) => ({
                ...prev,
                commodity,
              }))
            }
            fetchOptions={fetchCommodities}
            initialOptions={commodities}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar commodity..."
            minSearchLength={0}
            fetchOnEmpty
            clearable
          />
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Estado</FieldLabel>

        <InputGroup>
          <AsyncComboboxInput<EstadoCommodityOption>
            label="Estado"
            value={row.estado ?? null}
            onChange={(estado) =>
              setRow((prev) => ({
                ...prev,
                estado,
              }))
            }
            fetchOptions={fetchEstados}
            initialOptions={estados}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            placeholder="Estado"
            searchPlaceholder="Buscar estado..."
            minSearchLength={0}
            fetchOnEmpty
            clearable={false}
            // Igual que el viejo:
            // Estado visible pero no editable.
            disabled
          />
        </InputGroup>
      </Field>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={guardar}
          disabled={!row.commodity || !row.estado || isPending}
        >
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
