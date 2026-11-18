"use client";

import { Plus, Save, X } from "lucide-react";
import React from "react";
import { ComboboxOpcion } from "@/features/pricing/shared";
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
          <ComboboxOpcion<CommodityOption>
            label="Commodity"
            value={row.commodity ?? null}
            onChange={(commodity) =>
              setRow((prev) => ({
                ...prev,
                commodity,
              }))
            }
            options={commodities}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar commodity..."
          />
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Estado</FieldLabel>

        <InputGroup>
          <ComboboxOpcion<EstadoCommodityOption>
            label="Estado"
            value={row.estado ?? null}
            onChange={(estado) =>
              setRow((prev) => ({
                ...prev,
                estado,
              }))
            }
            options={estados}
            placeholder="Estado"
            searchPlaceholder="Buscar estado..."
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
