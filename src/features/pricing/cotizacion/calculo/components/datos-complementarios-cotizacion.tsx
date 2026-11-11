"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

type Props = {
  value: Record<string, unknown> | null;

  lectura?: boolean;

  onChange: (campo: string, value: unknown) => void;

  onValidChange?: (valid: boolean) => void;
};

const CAMPOS_REQUERIDOS = [
  {
    id: "tipo_servicio",
    label: "Tipo de Servicio",
  },
  {
    id: "tipo_transito",
    label: "Tiempo de Tránsito",
  },
  {
    id: "salida",
    label: "Salida",
  },
  {
    id: "tipo_producto",
    label: "Tipo de Producto",
  },
] as const;

function tieneValor(value: unknown) {
  /*
   * Regla literal del legado:
   * los campos requeridos se validan por truthiness.
   *
   * No normalizamos ni hacemos trim aquí para no
   * cambiar el comportamiento existente.
   */
  return Boolean(value);
}

export function DatosComplementariosCotizacion({
  value,
  lectura = false,
  onChange,
  onValidChange,
}: Props) {
  const [open, setOpen] = React.useState(true);

  const camposFaltantes = React.useMemo(
    () =>
      CAMPOS_REQUERIDOS.filter((campo) => !tieneValor(value?.[campo.id])).map(
        (campo) => campo.label,
      ),
    [value],
  );

  const isValid = camposFaltantes.length === 0;

  React.useEffect(() => {
    onValidChange?.(isValid);
  }, [isValid, onValidChange]);

  return (
    <section className="overflow-hidden rounded-lg border">
      {/* CABECERA */}

      <Button
        type="button"
        variant="ghost"
        className="h-auto w-full justify-between rounded-none bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-base font-semibold">Datos complementarios de cotización</span>

        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </Button>

      {open ? (
        <div className="space-y-4 p-4">
          {!lectura && camposFaltantes.length ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Debe llenar los campos: {camposFaltantes.join(", ")}
            </div>
          ) : null}

          {/* OBSERVACIÓN */}

          <div className="space-y-1">
            <label htmlFor="observacion" className="text-sm font-medium">
              Observación
            </label>

            <textarea
              id="observacion"
              rows={2}
              disabled={lectura}
              value={String(value?.observacion ?? "")}
              className="border-input bg-background w-full resize-y rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(event) => onChange("observacion", event.target.value)}
            />
          </div>

          {/* TIPO SERVICIO */}

          <div className="space-y-1">
            <label htmlFor="tipo_servicio" className="text-sm font-medium">
              Tipo de Servicio
              <span className="text-destructive"> *</span>
            </label>

            <Input
              id="tipo_servicio"
              disabled={lectura}
              value={String(value?.tipo_servicio ?? "")}
              onChange={(event) => onChange("tipo_servicio", event.target.value)}
            />
          </div>

          {/* TRÁNSITO */}

          <div className="space-y-1">
            <label htmlFor="tipo_transito" className="text-sm font-medium">
              Tiempo de Tránsito
              <span className="text-destructive"> *</span>
            </label>

            <Input
              id="tipo_transito"
              disabled={lectura}
              value={String(value?.tipo_transito ?? "")}
              onChange={(event) => onChange("tipo_transito", event.target.value)}
            />
          </div>

          {/* SALIDA */}

          <div className="space-y-1">
            <label htmlFor="salida" className="text-sm font-medium">
              Salida
              <span className="text-destructive"> *</span>
            </label>

            <Input
              id="salida"
              disabled={lectura}
              value={String(value?.salida ?? "")}
              onChange={(event) => onChange("salida", event.target.value)}
            />
          </div>

          {/* PRODUCTO */}

          <div className="space-y-1">
            <label htmlFor="tipo_producto" className="text-sm font-medium">
              Tipo de Producto
              <span className="text-destructive"> *</span>
            </label>

            <Input
              id="tipo_producto"
              disabled={lectura}
              value={String(value?.tipo_producto ?? "")}
              onChange={(event) => onChange("tipo_producto", event.target.value)}
            />
          </div>

          {/* OPCIONALES */}

          <div className="space-y-1">
            <label htmlFor="opcionales" className="text-sm font-medium">
              Opcionales
            </label>

            <textarea
              id="opcionales"
              rows={2}
              disabled={lectura}
              value={String(value?.opcionales ?? "")}
              className="border-input bg-background w-full resize-y rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(event) => onChange("opcionales", event.target.value)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
