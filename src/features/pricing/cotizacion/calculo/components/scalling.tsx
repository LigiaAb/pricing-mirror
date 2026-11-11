"use client";

import { ArrowDown, ArrowUp, Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import { ComboboxList } from "@/shared/components/ui/combobox-list";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  popoverListClassName,
} from "@/shared/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

import type { useRubrosScalling } from "../hooks/use-rubros-scalling";
import {
  obtenerValorPuntoScalling,
  type PuntoEnlaceScalling,
} from "../lib/scalling";
import { formatNumero, simboloDeMoneda } from "../lib/utils";

type ScallingController = ReturnType<typeof useRubrosScalling>;

type Props = {
  controller: ScallingController;

  lectura?: boolean;

  entidadNombre?: string | null;

  calculando?: boolean;
};

/* ==========================================================================
 * FORMATO
 * ========================================================================== */

/* ==========================================================================
 * SELECTOR
 * ========================================================================== */

type PuntoOption = {
  value: string;

  label: string;

  description?: string;

  original: PuntoEnlaceScalling;
};

function SelectorPunto({
  id,
  puntos,
  value,
  seleccionados,
  disabled,
  onChange,
}: {
  id?: string;

  puntos: PuntoEnlaceScalling[];

  value: PuntoEnlaceScalling | null;

  seleccionados: PuntoEnlaceScalling[];

  disabled?: boolean;

  onChange: (punto: PuntoEnlaceScalling | null) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const options = React.useMemo<PuntoOption[]>(
    () =>
      puntos.map((punto) => {
        const seleccionado = seleccionados.some(
          (item) => String(item.value) === String(punto.value),
        );

        return {
          value: String(punto.value),

          label: punto.label,

          description: [
            punto.codigo ? `Código: ${punto.codigo}` : null,
            seleccionado ? "Incluido en cálculo" : null,
          ]
            .filter(Boolean)
            .join(" · "),

          original: punto,
        };
      }),
    [puntos, seleccionados],
  );

  const selectedValue = value == null ? null : String(value.value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!disabled) {
          setOpen(next);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between font-normal",

            value == null && "text-muted-foreground",
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {value?.label ?? "Seleccione una parada"}
          </span>

          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className={cn(popoverListClassName, "p-0")} align="start" sideOffset={4}>
        <ComboboxList
          options={options}
          isSelected={(option) => option.value === selectedValue}
          onSelect={(option) => {
            onChange(option.original);

            setOpen(false);
          }}
          searchPlaceholder="Buscar parada..."
          emptyMessage="No hay paradas disponibles."
          estimatedRowHeight={52}
          renderOption={(option, selected) => {
            const incluido = seleccionados.some((item) => String(item.value) === option.value);

            return (
              <>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {incluido ? <Check className="size-4 shrink-0 text-primary" /> : null}

                    <span className="wrap-anywhere">{option.label}</span>
                  </div>

                  {option.description ? (
                    <p className="wrap-anywhere text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  ) : null}
                </div>

                <Check
                  className={cn(
                    "ml-auto mt-0.5 size-4 shrink-0 text-primary",

                    selected ? "opacity-100" : "opacity-0",
                  )}
                />
              </>
            );
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ==========================================================================
 * COMPONENTE
 * ========================================================================== */

export function Scalling({
  controller,
  lectura = false,
  entidadNombre,
  calculando = false,
}: Props) {
  const {
    rutasProcesadas,

    puntosPosibles,

    puntosSeleccionados,

    puntosOrdenados,

    puntoSeleccionado,

    isLoadingRutas,

    setPuntoSeleccionado,

    togglePunto,

    moverPunto,
  } = controller;

  const puntoYaSeleccionado =
    puntoSeleccionado != null &&
    puntosSeleccionados.some((item) => String(item.value) === String(puntoSeleccionado.value));

  return (
    <section className="overflow-hidden rounded-lg border flex flex-row">
      {/* =====================================================
          CABECERA
      ====================================================== */}
      <div className="">
        <div className="flex flex-col w-12 shrink-0 items-center justify-center bg-primary text-primary-foreground h-full">
          <span className="-rotate-90 whitespace-nowrap text-sm font-semibold tracking-[0.2em]">
            RUTAS
          </span>
          <span className="w-2 bg-white h-m-2"> </span>
        </div>
      </div>
      <div className="flex-1 flex-col">
        <div className="flex items-stretch border-b">
          <div className="min-w-0 flex-1 space-y-1 px-4 py-3">
            {entidadNombre ? (
              <p className="text-sm font-medium text-primary">{entidadNombre}</p>
            ) : null}

            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Seleccione y ordene las paradas del embarque para calcular el rubro de{" "}
                <strong className="text-foreground">rutas</strong>.
              </p>

              {calculando ? <Loader2 className="size-4 animate-spin text-primary" /> : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {/* ===================================================
            SELECTOR
        ==================================================== */}

          {!lectura ? (
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor="punto-scalling" className="text-sm font-medium">
                  Parada
                </label>

                {isLoadingRutas ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="w-full justify-start font-normal"
                  >
                    <Loader2 className="size-4 animate-spin" />
                    Cargando rutas...
                  </Button>
                ) : (
                  <SelectorPunto
                    id="punto-scalling"
                    puntos={puntosPosibles}
                    value={puntoSeleccionado}
                    seleccionados={puntosSeleccionados}
                    onChange={setPuntoSeleccionado}
                  />
                )}
              </div>

              <Button
                type="button"
                variant={puntoYaSeleccionado ? "destructive" : "default"}
                disabled={!puntoSeleccionado || isLoadingRutas}
                onClick={() => togglePunto()}
              >
                {puntoYaSeleccionado ? (
                  <>
                    <X className="size-4" />
                    Quitar
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Agregar
                  </>
                )}
              </Button>
            </div>
          ) : null}

          {/* ===================================================
            TABLA
        ==================================================== */}

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {!lectura ? <TableHead className="w-12" /> : null}

                  <TableHead>Parada</TableHead>

                  <TableHead>Código</TableHead>

                  <TableHead className="text-right">Valor</TableHead>

                  {!lectura ? <TableHead className="w-28 text-center">Orden</TableHead> : null}
                </TableRow>
              </TableHeader>

              <TableBody>
                {puntosOrdenados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={lectura ? 3 : 5}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No hay paradas seleccionadas.
                    </TableCell>
                  </TableRow>
                ) : (
                  puntosOrdenados.map((punto, index) => {
                    const valor = obtenerValorPuntoScalling({
                      codigo: punto.codigo ?? null,

                      rutas: rutasProcesadas,

                      puntos: puntosOrdenados,
                    });

                    const simbolo = simboloDeMoneda(valor?.moneda);

                    return (
                      <TableRow key={String(punto.value)}>
                        {/* QUITAR */}

                        {!lectura ? (
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => togglePunto(punto)}
                            >
                              <X className="size-4" />

                              <span className="sr-only">Quitar parada</span>
                            </Button>
                          </TableCell>
                        ) : null}

                        {/* PUNTO */}

                        <TableCell className="font-medium">{punto.label}</TableCell>

                        {/* CÓDIGO */}

                        <TableCell className="font-mono text-xs">{punto.codigo ?? "—"}</TableCell>

                        {/* VALOR */}

                        <TableCell className="text-right">
                          {valor?.venta ? (
                            <span className="font-medium tabular-nums">
                              {simbolo} {formatNumero(valor.venta)}
                            </span>
                          ) : calculando ? (
                            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="size-3 animate-spin" />
                              Calculando
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No cuenta con valor
                            </span>
                          )}
                        </TableCell>

                        {/* ORDEN */}

                        {!lectura ? (
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={index === 0}
                                onClick={() => moverPunto(index, "up")}
                              >
                                <ArrowUp className="size-4" />

                                <span className="sr-only">Subir parada</span>
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={index === puntosOrdenados.length - 1}
                                onClick={() => moverPunto(index, "down")}
                              >
                                <ArrowDown className="size-4" />

                                <span className="sr-only">Bajar parada</span>
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </section>
  );
}
