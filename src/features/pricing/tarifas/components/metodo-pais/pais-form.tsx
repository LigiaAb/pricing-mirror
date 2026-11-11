"use client";

import { Plus, Save, X } from "lucide-react";
import React from "react";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
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

function useFetchOptionsLocal(options: RutaOption[]) {
  return React.useCallback(
    async (search: string): Promise<RutaOption[]> => {
      const busqueda = search.trim().toLowerCase();

      if (!busqueda) return options;

      return options.filter((option) => option.label.toLowerCase().includes(busqueda));
    },
    [options],
  );
}

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

  const fetchTiposRuta = useFetchOptionsLocal(tiposRuta);
  const fetchContinentes = useFetchOptionsLocal(continentes);
  const fetchPaises = useFetchOptionsLocal(paisesFiltrados);
  const fetchTiposPuntoEnlace = useFetchOptionsLocal(tiposPuntoEnlace);
  const fetchPuntosEnlace = useFetchOptionsLocal(puntosFiltrados);
  const fetchCiudades = useFetchOptionsLocal(ciudadesFiltradas);

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
          <AsyncComboboxInput<RutaOption>
            label="Tipo de Ruta"
            value={row.tipo ?? null}
            onChange={(tipo) =>
              setRow((prev) => ({
                ...prev,
                tipo,
              }))
            }
            fetchOptions={fetchTiposRuta}
            initialOptions={tiposRuta}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar tipo de ruta..."
            minSearchLength={0}
            fetchOnEmpty
            clearable
          />
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Continente</FieldLabel>

        <InputGroup>
          <AsyncComboboxInput<RutaOption>
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
            fetchOptions={fetchContinentes}
            initialOptions={continentes}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar continente..."
            minSearchLength={0}
            fetchOnEmpty
            clearable
          />
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>País</FieldLabel>

        <InputGroup>
          <AsyncComboboxInput<RutaOption>
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
            fetchOptions={fetchPaises}
            initialOptions={paisesFiltrados}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar país..."
            minSearchLength={0}
            fetchOnEmpty
            clearable
            disabled={!row.continente}
          />
        </InputGroup>
      </Field>

      {esTerrestre ? (
        <Field>
          <FieldLabel>Ciudad</FieldLabel>

          <InputGroup>
            <AsyncComboboxInput<RutaOption>
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
              fetchOptions={fetchCiudades}
              initialOptions={ciudadesFiltradas}
              getOptionValue={(option) => option.value}
              getOptionLabel={(option) => option.label}
              placeholder="Seleccione..."
              searchPlaceholder="Buscar ciudad..."
              minSearchLength={0}
              fetchOnEmpty
              clearable
              disabled={!row.pais}
            />
          </InputGroup>
        </Field>
      ) : (
        <>
          <Field>
            <FieldLabel>Tipo</FieldLabel>

            <InputGroup>
              <AsyncComboboxInput<RutaOption>
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
                fetchOptions={fetchTiposPuntoEnlace}
                initialOptions={tiposPuntoEnlace}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                placeholder="Seleccione..."
                searchPlaceholder="Buscar tipo..."
                minSearchLength={0}
                fetchOnEmpty
                clearable
                disabled={!row.pais}
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>Aduana/Puerto/Aeropuerto</FieldLabel>

            <InputGroup>
              <AsyncComboboxInput<RutaOption>
                label="Aduana/Puerto/Aeropuerto"
                value={row.punto_enlace ?? null}
                onChange={(punto_enlace) =>
                  setRow((prev) => ({
                    ...prev,
                    punto_enlace,
                    ciudad: null,
                  }))
                }
                fetchOptions={fetchPuntosEnlace}
                initialOptions={puntosFiltrados}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                placeholder="Seleccione..."
                searchPlaceholder="Buscar punto de enlace..."
                minSearchLength={0}
                fetchOnEmpty
                clearable
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
