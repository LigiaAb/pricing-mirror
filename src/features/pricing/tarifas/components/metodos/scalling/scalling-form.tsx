"use client";

import { Plus, Save, X } from "lucide-react";
import React from "react";

import { ComboboxOpcion } from "@/features/pricing/shared";

import { Button } from "@/shared/components/ui/button";

import { Field, FieldLabel } from "@/shared/components/ui/field";

import { InputGroup } from "@/shared/components/ui/input-group";
import {
  type FilaMetodoScalling,
  METODO_SCALLING,
  type MonedaScallingOption,
  type PuntoEnlaceScallingOption,
  type TipoPuntoEnlaceScallingOption,
} from "../../../lib/metodos/scalling";
import { CampoMetodo } from "../campo-metodo";

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

  const cambiar = React.useCallback((cambio: Partial<FilaMetodoScalling>) => {
    setRow((prev) => ({ ...prev, ...cambio }));
  }, []);

  // Moneda y Valor: de la definición (lib/metodos/scalling.ts). Tipo y punto, a mano por la cascada.
  const campo = {
    metodo: METODO_SCALLING,
    fila: row,
    onChange: cambiar,
    monedas,
    comboEnvuelto: true,
  };

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
            <ComboboxOpcion<TipoPuntoEnlaceScallingOption>
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
              options={tiposPuntoEnlace}
              placeholder="Seleccione..."
              searchPlaceholder="Buscar tipo..."
            />
          </div>
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Aduana/Puerto/Aeropuerto</FieldLabel>

        <InputGroup>
          <div className="w-full">
            <ComboboxOpcion<PuntoEnlaceScallingOption>
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
              options={puntosFiltrados}
              placeholder="Seleccione..."
              searchPlaceholder="Buscar punto..."
              disabled={!row.tipo_puntoenlace}
            />
          </div>
        </InputGroup>
      </Field>

      <CampoMetodo {...campo} campo="cod_moneda" />

      <CampoMetodo {...campo} campo="costo" />

      <div className="flex gap-2">
        <Button type="button" onClick={guardar} disabled={!puedeGuardar || isPending}>
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
