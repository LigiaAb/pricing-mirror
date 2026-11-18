"use client";

import { Plus, Save, X } from "lucide-react";
import React from "react";
import { ComboboxOpcion } from "@/features/pricing/shared";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup } from "@/shared/components/ui/input-group";
import type { FilaMetodoPais, RutaOption } from "./pais-columns";

type Props = {
  value?: FilaMetodoPais | null;

  esTerrestre: boolean;

  tiposRuta: RutaOption[];
  continentes: RutaOption[];
  paises: RutaOption[];
  tiposPuntoEnlace: RutaOption[];
  puntosEnlace: RutaOption[];
  ciudades: RutaOption[];

  onGuardar: (row: FilaMetodoPais) => void;
  onCancelar?: () => void;

  isPending?: boolean;
};

export function PaisForm({
  value,
  esTerrestre,
  tiposRuta,
  continentes,
  paises,
  tiposPuntoEnlace,
  puntosEnlace,
  ciudades,
  onGuardar,
  onCancelar,
  isPending = false,
}: Props) {
  const [row, setRow] = React.useState<FilaMetodoPais>(value ?? ({} as FilaMetodoPais));

  React.useEffect(() => {
    setRow(value ?? ({} as FilaMetodoPais));
  }, [value]);

  const paisesFiltrados = React.useMemo(() => {
    if (!row.continente) return [];

    return paises.filter((pais) => String(pais.cod_continente) === String(row.continente?.value));
  }, [paises, row.continente]);

  const ciudadesFiltradas = React.useMemo(() => {
    if (!row.pais) return [];

    return ciudades.filter((ciudad) => String(ciudad.cod_pais) === String(row.pais?.value));
  }, [ciudades, row.pais]);

  const puntosFiltrados = React.useMemo(() => {
    if (!row.pais || !row.tipo_puntoenlace) return [];

    return puntosEnlace.filter(
      (punto) =>
        String(punto.cod_pais) === String(row.pais?.value) &&
        String(punto.cod_tipo) === String(row.tipo_puntoenlace?.value),
    );
  }, [puntosEnlace, row.pais, row.tipo_puntoenlace]);

  const guardar = () => {
    if (!row.tipo) return;
    if (!row.continente) return;

    onGuardar(row);
  };

  const esEdicion = Boolean(row.cod_tarifa_ruta);

  return (
    <div className="grid items-end gap-2 md:grid-cols-2 xl:grid-cols-6">
      <Field>
        <FieldLabel>Tipo de Ruta</FieldLabel>

        <InputGroup>
          <ComboboxOpcion<RutaOption>
            label="Tipo de Ruta"
            value={row.tipo ?? null}
            onChange={(tipo) =>
              setRow((prev) => ({
                ...prev,
                tipo,
              }))
            }
            options={tiposRuta}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar tipo de ruta..."
          />
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Continente</FieldLabel>

        <InputGroup>
          <ComboboxOpcion<RutaOption>
            label="Continente"
            value={row.continente ?? null}
            onChange={(continente) =>
              setRow((prev) => ({
                ...prev,
                continente,
                pais: null,
                ciudad: null,
                tipo_puntoenlace: null,
                punto_enlace: null,
              }))
            }
            options={continentes}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar continente..."
          />
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>País</FieldLabel>

        <InputGroup>
          <ComboboxOpcion<RutaOption>
            label="País"
            value={row.pais ?? null}
            onChange={(pais) =>
              setRow((prev) => ({
                ...prev,
                pais,
                ciudad: null,
                punto_enlace: null,
              }))
            }
            options={paisesFiltrados}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar país..."
            disabled={!row.continente}
          />
        </InputGroup>
      </Field>

      {esTerrestre ? (
        <Field>
          <FieldLabel>Ciudad</FieldLabel>

          <InputGroup>
            <ComboboxOpcion<RutaOption>
              label="Ciudad"
              value={row.ciudad ?? null}
              onChange={(ciudad) =>
                setRow((prev) => ({
                  ...prev,
                  ciudad,
                  tipo_puntoenlace: null,
                  punto_enlace: null,
                }))
              }
              options={ciudadesFiltradas}
              placeholder="Seleccione..."
              searchPlaceholder="Buscar ciudad..."
              disabled={!row.pais}
            />
          </InputGroup>
        </Field>
      ) : (
        <>
          <Field>
            <FieldLabel>Tipo</FieldLabel>

            <InputGroup>
              <ComboboxOpcion<RutaOption>
                label="Tipo"
                value={row.tipo_puntoenlace ?? null}
                onChange={(tipo_puntoenlace) =>
                  setRow((prev) => ({
                    ...prev,
                    tipo_puntoenlace,
                    punto_enlace: null,
                    ciudad: null,
                  }))
                }
                options={tiposPuntoEnlace}
                placeholder="Seleccione..."
                searchPlaceholder="Buscar tipo..."
                disabled={!row.pais}
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>Aduana/Puerto/Aeropuerto</FieldLabel>

            <InputGroup>
              <ComboboxOpcion<RutaOption>
                label="Aduana/Puerto/Aeropuerto"
                value={row.punto_enlace ?? null}
                onChange={(punto_enlace) =>
                  setRow((prev) => ({
                    ...prev,
                    punto_enlace,
                    ciudad: null,
                  }))
                }
                options={puntosFiltrados}
                placeholder="Seleccione..."
                searchPlaceholder="Buscar punto de enlace..."
                disabled={!row.pais || !row.tipo_puntoenlace}
              />
            </InputGroup>
          </Field>
        </>
      )}

      <div className="flex gap-2">
        <Button type="button" onClick={guardar} disabled={isPending}>
          {esEdicion ? <Save className="size-4" /> : <Plus className="size-4" />}

          {esEdicion ? "Guardar" : "Agregar"}
        </Button>

        {esEdicion && (
          <Button type="button" variant="outline" onClick={onCancelar} disabled={isPending}>
            <X className="size-4" />
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
