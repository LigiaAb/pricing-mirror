"use client";

import { Plus, Save, X } from "lucide-react";
import React from "react";

import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";

import { Button } from "@/shared/components/ui/button";

import { Field, FieldLabel } from "@/shared/components/ui/field";

import { InputGroup, InputGroupInput } from "@/shared/components/ui/input-group";
import { useFiltroOpciones } from "../../../hooks/use-opciones-tarifa";
import {
  type FilaMetodoScalling,
  METODO_SCALLING,
  type MonedaScallingOption,
  type PuntoEnlaceScallingOption,
  type TipoPuntoEnlaceScallingOption,
} from "../../../lib/metodos/scalling";

type Props = {
  value?: FilaMetodoScalling | null;

  tiposPuntoEnlace: TipoPuntoEnlaceScallingOption[];
  puntosEnlace: PuntoEnlaceScallingOption[];
  monedas: MonedaScallingOption[];

  tipoPuntoEnlaceDefault?: TipoPuntoEnlaceScallingOption | null;

  onGuardar: (row: FilaMetodoScalling) => void;
  onCancelar?: () => void;

  isPending?: boolean;
};

export function ScallingForm({
  value,
  tiposPuntoEnlace,
  puntosEnlace,
  monedas,
  tipoPuntoEnlaceDefault,
  onGuardar,
  onCancelar,
  isPending = false,
}: Props) {
  const crearBase = React.useCallback(
    // punto_enlace null, costo 0 y moneda null: `inicial` en lib/metodos/scalling.ts.
    (): FilaMetodoScalling => ({
      cod_tarifa_scalling: 0,

      tipo_puntoenlace: tipoPuntoEnlaceDefault ?? null,

      ...METODO_SCALLING.filaNueva(),

      cod_puntoenlace: null,
      cod_moneda: null,
    }),
    [tipoPuntoEnlaceDefault],
  );

  const [row, setRow] = React.useState<FilaMetodoScalling>(value ?? crearBase());

  React.useEffect(() => {
    setRow(value ?? crearBase());
  }, [value, crearBase]);

  const puntosFiltrados = React.useMemo(() => {
    if (!row.tipo_puntoenlace) {
      return [];
    }

    return puntosEnlace.filter(
      (punto) => String(punto.cod_tipo) === String(row.tipo_puntoenlace?.cod_tipo),
    );
  }, [puntosEnlace, row.tipo_puntoenlace]);

  const fetchTipos = useFiltroOpciones(tiposPuntoEnlace);

  const fetchPuntos = useFiltroOpciones(puntosFiltrados);

  const fetchMonedas = useFiltroOpciones(monedas);

  const esEdicion = value?.cod_tarifa_scalling != null && Number(value.cod_tarifa_scalling) !== 0;

  // Punto y moneda requeridos (ver la definición); el tipo, por la cascada.
  const puedeGuardar = row.tipo_puntoenlace != null && METODO_SCALLING.validar(row).valido;

  const guardar = () => {
    if (!puedeGuardar) return;

    onGuardar(row);

    if (!esEdicion) {
      setRow(crearBase());
    }
  };

  return (
    <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Field>
        <FieldLabel>Tipo</FieldLabel>

        <InputGroup>
          <div className="w-full">
            <AsyncComboboxInput<TipoPuntoEnlaceScallingOption>
              value={row.tipo_puntoenlace ?? null}
              onChange={(tipo_puntoenlace) =>
                setRow((prev) => ({
                  ...prev,

                  /*
                   * Igual que el viejo:
                   * cambiar Tipo no reinicia
                   * automáticamente la fila.
                   */
                  tipo_puntoenlace,
                }))
              }
              fetchOptions={fetchTipos}
              initialOptions={tiposPuntoEnlace}
              getOptionValue={(option) => option.value}
              getOptionLabel={(option) => option.label}
              placeholder="Seleccione..."
              searchPlaceholder="Buscar tipo..."
              minSearchLength={0}
              fetchOnEmpty
              clearable
            />
          </div>
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Aduana/Puerto/Aeropuerto</FieldLabel>

        <InputGroup>
          <div className="w-full">
            <AsyncComboboxInput<PuntoEnlaceScallingOption>
              value={row.punto_enlace ?? null}
              onChange={(punto_enlace) =>
                setRow((prev) => ({
                  /*
                   * El componente viejo al cambiar
                   * punto de enlace reiniciaba
                   * costo y moneda.
                   */
                  ...crearBase(),

                  /*
                   * No reseteamos aquí el ID de BD.
                   * El viejo lo hacía accidentalmente
                   * por el spread de objetoBase.
                   */
                  ...(prev.cod_tarifa_scalling === undefined
                    ? {}
                    : { cod_tarifa_scalling: prev.cod_tarifa_scalling }),

                  tipo_puntoenlace: prev.tipo_puntoenlace ?? null,

                  punto_enlace: punto_enlace ?? null,
                }))
              }
              fetchOptions={fetchPuntos}
              initialOptions={puntosFiltrados}
              getOptionValue={(option) => option.value}
              getOptionLabel={(option) => option.label}
              placeholder="Seleccione..."
              searchPlaceholder="Buscar punto..."
              minSearchLength={0}
              fetchOnEmpty
              clearable
              disabled={!row.tipo_puntoenlace}
            />
          </div>
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Moneda</FieldLabel>

        <InputGroup>
          <div className="w-full">
            <AsyncComboboxInput<MonedaScallingOption>
              value={row.moneda ?? null}
              onChange={(moneda) =>
                setRow((prev) => ({
                  ...prev,
                  moneda,
                }))
              }
              fetchOptions={fetchMonedas}
              initialOptions={monedas}
              getOptionValue={(option) => option.value}
              getOptionLabel={(option) => option.label}
              placeholder="Seleccione..."
              searchPlaceholder="Buscar moneda..."
              minSearchLength={0}
              fetchOnEmpty
              clearable
            />
          </div>
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Valor</FieldLabel>

        <InputGroup>
          <InputGroupInput
            type="number"
            value={row.costo ?? ""}
            onChange={(event) =>
              setRow((prev) => ({
                ...prev,

                costo: event.target.value === "" ? null : Number(event.target.value),
              }))
            }
          />
        </InputGroup>
      </Field>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={guardar}
          disabled={!puedeGuardar || isPending}
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
