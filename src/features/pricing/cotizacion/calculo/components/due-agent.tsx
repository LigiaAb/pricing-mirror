"use client";

import { AlertTriangle, Check, Info, Plus, X } from "lucide-react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import { Combobox, type ComboboxOption } from "@/shared/components/ui/combobox";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type { useRubrosDueAgent } from "../hooks/use-rubros-due-agent";
import type { MonedaFlete } from "../lib/carrier-flete";
import { esMetodoCostoPorcentaje } from "../lib/costo-porcentaje";
import { esCoberturaMercaderia, esTipoCalculoManual, type RubroDueAgent } from "../lib/due-agent";
import { getCodServicioDueCarrier } from "../lib/due-carrier";
import FichaResumen from "./ficha-resumen";

import { formatNumero, getEstadoMetodo, getSimboloMoneda } from "../lib/utils";
import { TIPO_CALCULO } from "../lib/constantes";
import { useCatalogosCotizacion } from "../hooks/use-catalogos-cotizacion";
import { Detalles } from "./utils";

type DueAgentController = ReturnType<typeof useRubrosDueAgent>;

type Props = {
  controller: DueAgentController;

  lectura?: boolean;

  entidadNombre?: string | null;
};

/* ==========================================================================
 * HELPERS
 * ========================================================================== */

function getNombreRubro(item: RubroDueAgent) {
  return item.nombre ?? item.nombre_rubro ?? "";
}

function getNombreServicio(item: RubroDueAgent) {
  return item.servicio?.nombre ?? "";
}

function getSiglasServicio(item: RubroDueAgent) {
  return item.servicio?.siglas ?? "";
}

function getCodServicio(item: RubroDueAgent) {
  return item.servicio?.cod_servicio ?? item.cod_servicio ?? null;
}

function getCodMoneda(item: RubroDueAgent) {
  return item.servicio?.metodo?.cod_moneda_venta ?? item.servicio?.cod_moneda_venta ?? null;
}

/* ==========================================================================
 * SELECTOR
 * ========================================================================== */

function SelectorDueAgent({
  rubros,
  seleccionado,
  onChange,
  monedas,
  seleccionados,
}: {
  rubros: Array<RubroDueAgent & { blocked?: boolean }>;
  seleccionado: RubroDueAgent | null;
  onChange: (value: RubroDueAgent) => void;
  monedas: MonedaFlete[];
  seleccionados: RubroDueAgent[];
}) {
  const options = React.useMemo<Array<ComboboxOption & { original: RubroDueAgent }>>(
    () =>
      rubros.map((item) => {
        const metodo = item.servicio?.metodo;
        const tipoCalculo = item.servicio?.cod_tipo_calculo;
        const seleccionadoActualmente = seleccionados.some(
          (seleccionado) => String(seleccionado.value) === String(item.value),
        );
        const detalleValor = esMetodoCostoPorcentaje(item)
          ? "COSTO POR PORCENTAJE"
          : tipoCalculo === TIPO_CALCULO.ABIERTO
            ? "ABIERTO"
            : tipoCalculo === TIPO_CALCULO.COBERTURA_MERCADERIA
              ? "COBERTURA DE MERCADERÍA"
              : `${getSimboloMoneda(monedas, metodo?.cod_moneda_venta)}${formatNumero(metodo?.venta)}`;

        return {
          value: String(item.value ?? ""),
          label: `${getSiglasServicio(item) ? `[${getSiglasServicio(item)}] ` : ""}${getNombreServicio(item)}`,
          description: [
            getNombreRubro(item),
            detalleValor,
            seleccionadoActualmente ? "Seleccionado" : "",
            item.blocked ? "Bloqueado" : "",
          ]
            .filter(Boolean)
            .join(" · "),
          original: item,
        };
      }),
    [rubros, seleccionados, monedas],
  );

  return (
    <Combobox
      options={options}
      value={seleccionado?.value == null ? "" : String(seleccionado.value)}
      onChange={(selectedValue) => {
        const option = options.find((item) => item.value === selectedValue);
        if (option) onChange(option.original);
      }}
      ariaLabel="Servicio Due Agent"
      placeholder="Seleccionar servicio..."
      searchPlaceholder="Buscar servicio..."
      emptyMessage="No se encontraron servicios."
    />
  );
}

/* ==========================================================================
 * COMPONENTE
 * ========================================================================== */

export function DueAgent({
  controller,
  lectura = false,
  entidadNombre,
}: Props) {
  const { monedas, metodos } = useCatalogosCotizacion().calculo;
  const {
    rubros: rubrosDisponibles,

    seleccionados,

    valoresManual,

    obligatoriosPendientes,

    // totalDueAgent,

    toggleRubro,

    cambiarValorManual,

    cambiarValorFactura,
  } = controller;

  const [rubroActualValue, setRubroActualValue] = React.useState<string | null>(null);

  /*
   * Sustituye currentIndex SIN sincronizar estado con un useEffect.
   *
   * Si la selección explícita todavía existe, se conserva.
   * Si desapareció (o todavía no se eligió nada), se usa el primer
   * rubro disponible únicamente como valor derivado.
   *
   * Esto evita el ciclo:
   * rubrosDisponibles -> useEffect -> setState -> render -> rubrosDisponibles.
   */
  const rubroActualValueEfectivo = React.useMemo(() => {
    if (
      rubroActualValue != null &&
      rubrosDisponibles.some((item) => String(item.value) === rubroActualValue)
    ) {
      return rubroActualValue;
    }

    const primero = rubrosDisponibles[0]?.value;

    return primero == null ? null : String(primero);
  }, [rubrosDisponibles, rubroActualValue]);

  const rubroActual = React.useMemo(
    () => rubrosDisponibles.find((item) => String(item.value) === rubroActualValueEfectivo) ?? null,
    [rubrosDisponibles, rubroActualValueEfectivo],
  );

  const totalPorMoneda = React.useMemo(() => {
    const resultado: Record<
      string,
      {
        moneda: MonedaFlete;

        total: number;
      }
    > = {};

    for (const item of seleccionados) {
      const codMoneda = getCodMoneda(item);

      if (codMoneda == null) {
        continue;
      }

      const moneda = monedas.find((m) => String(m.cod_moneda) === String(codMoneda));

      if (!moneda) {
        continue;
      }

      const key = String(moneda.cod_moneda);

      resultado[key] = {
        moneda,

        total: (resultado[key]?.total ?? 0) + Number(item.servicio?.metodo?.venta ?? 0),
      };
    }

    return resultado;
  }, [seleccionados, monedas]);

  return (
    <section className="overflow-hidden  rounded-lg border flex flex-row">
      {/* =====================================================
          ENCABEZADO
      ====================================================== */}
      <div className="">
        <div className="flex w-12 shrink-0 items-center justify-center bg-primary text-primary-foreground h-full">
          <span className="-rotate-90 whitespace-nowrap text-sm font-semibold tracking-[0.2em]">
            DUE AGENT
          </span>
        </div>
      </div>
      <div className="overflow-x-auto flex-1 flex-col">
        <div className="flex items-stretch border-b">
          <div className="min-w-0 flex-1 space-y-1 px-4 py-3">
            {entidadNombre ? (
              <p className="text-sm font-medium text-primary">{entidadNombre}</p>
            ) : null}

            <p className="text-sm text-muted-foreground">
              Seleccione los servicios de <strong className="text-foreground">Due Agent</strong>{" "}
              para agregarlos a la cotización.
            </p>
          </div>
        </div>
        <div className="space-y-4 p-4">
          {/* =====================================================
            SELECCIÓN
        ====================================================== */}

          {!lectura ? (
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-sm font-medium">Servicio</p>

                <SelectorDueAgent
                  rubros={rubrosDisponibles}
                  seleccionado={rubroActual}
                  onChange={(item) => setRubroActualValue(String(item.value))}
                  monedas={monedas}
                  seleccionados={seleccionados}
                />
              </div>

              <Button
                type="button"
                disabled={
                  !rubroActual ||
                  rubroActual.blocked ||
                  seleccionados.find((item) => item.value === rubroActual.value)?.quitarBoton ===
                    true
                }
                variant={
                  seleccionados.some((item) => item.value === rubroActual?.value)
                    ? "destructive"
                    : "default"
                }
                onClick={() => {
                  if (rubroActual) {
                    toggleRubro(rubroActual);
                  }
                }}
              >
                {seleccionados.some((item) => item.value === rubroActual?.value) ? (
                  <>
                    <X className="size-4" />
                    Quitar
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Agregar
                  </>
                )}
              </Button>
            </div>
          ) : null}

          {/* =====================================================
            BLOQUEADO
        ====================================================== */}

          {!lectura && rubroActual?.blocked ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              Este rubro está bloqueado para evitar duplicidad.
            </div>
          ) : null}

          {/* =====================================================
            OBLIGATORIOS
        ====================================================== */}

          {obligatoriosPendientes.length > 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />

              <div>
                Hace falta seleccionar un servicio para los rubros:{" "}
                <strong>
                  {obligatoriosPendientes.map((item) => item.nombre_rubro).join(", ")}
                </strong>
              </div>
            </div>
          ) : null}

          {/* =====================================================
            TABLA
        ====================================================== */}

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />

                  {!lectura ? <TableHead className="w-20">Acciones</TableHead> : null}

                  <TableHead>Código</TableHead>

                  <TableHead>Tipo</TableHead>

                  <TableHead>Siglas</TableHead>

                  <TableHead>Servicio</TableHead>

                  <TableHead className="text-right">Venta</TableHead>

                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {seleccionados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={lectura ? 5 : 6}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No hay servicios Due Agent seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  seleccionados.map((item) => {
                    const metodoCatalogo = metodos.find(
                      (metodo) => String(metodo.cod_servicio) === String(getCodServicio(item)),
                    );

                    const { vencida, proximaAVencer } = getEstadoMetodo(
                      metodoCatalogo?.fecha_final,
                    );

                    const metodo = item.servicio?.metodo;

                    const manual = esTipoCalculoManual(item);

                    const cobertura = esCoberturaMercaderia(item);

                    const simbolo = getSimboloMoneda(monedas, metodo?.cod_moneda_venta);

                    const codServicio = getCodServicioDueCarrier(item);

                    return (
                      <TableRow
                        key={item.value}
                        className={cn(
                          proximaAVencer && "bg-warning/10",

                          vencida && "bg-destructive/10",
                        )}
                      >
                        {/* INFO */}

                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* <span title={vencida ? "Tarifa vencida" : proximaAVencer ? "Tarifa próxima a vencer" : "Información de tarifa"}> */}
                              {vencida || proximaAVencer ? (
                                <AlertTriangle
                                  className={cn(
                                    "size-4",

                                    vencida ? "text-destructive" : "text-warning",
                                  )}
                                />
                              ) : (
                                <Info className="size-4 text-primary" />
                              )}
                              {/* </span> */}
                            </TooltipTrigger>
                            <TooltipContent
                              className={cn("text-xs bg-background text-foreground border-3 p-0")}
                              side="right"
                            >
                              <FichaResumen item={item} />
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* QUITAR */}

                        {!lectura ? (
                          <TableCell>
                            {item.quitarBoton === true ? (
                              <Check className="size-4 text-muted-foreground" />
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:text-destructive"
                                onClick={() => toggleRubro(item)}
                              >
                                <X className="size-4" />

                                <span className="sr-only">Quitar servicio</span>
                              </Button>
                            )}
                          </TableCell>
                        ) : null}

                        {/* CÓDIGO */}

                        <TableCell className="font-mono text-xs">[{codServicio ?? "—"}]</TableCell>

                        {/* TIPO */}

                        <TableCell>
                          {item.es_tarifa_spot ? (
                            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              SPOT
                            </span>
                          ) : item.es_flete ? (
                            <span className="text-xs text-muted-foreground">Flete</span>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        {/* SIGLAS */}

                        <TableCell className="font-medium">
                          {getSiglasServicio(item) ? `[${getSiglasServicio(item)}]` : "—"}
                        </TableCell>

                        {/* SERVICIO */}

                        <TableCell>{getNombreServicio(item)}</TableCell>

                        {/* VENTA */}

                        <TableCell className="min-w-[190px] text-right">
                          {manual && !lectura ? (
                            esMetodoCostoPorcentaje(item) ? (
                              <div className="ml-auto grid max-w-[220px] gap-1">
                                <span className="text-left text-xs text-muted-foreground">
                                  Costo
                                </span>
                                <Input
                                  value={valoresManual[item.value] ?? ""}
                                  inputMode="decimal"
                                  className="text-right"
                                  onChange={(event) => cambiarValorManual(item, event.target.value)}
                                />
                                <span className="font-medium tabular-nums">
                                  Venta: {simbolo} {formatNumero(metodo?.venta)}
                                </span>
                              </div>
                            ) : cobertura ? (
                              <div className="ml-auto grid max-w-[220px] gap-1">
                                <span className="text-left text-xs text-muted-foreground">
                                  Valor factura comercial
                                </span>

                                <Input
                                  value={valoresManual[`${item.value}_a_calcular`] ?? ""}
                                  inputMode="decimal"
                                  className="text-right"
                                  onChange={(event) =>
                                    cambiarValorFactura(item, event.target.value)
                                  }
                                />

                                <span className="font-medium tabular-nums">
                                  {simbolo}{" "}
                                  {formatNumero(valoresManual[item.value] ?? metodo?.venta)}
                                </span>
                              </div>
                            ) : (
                              <div className="ml-auto max-w-[150px]">
                                <Input
                                  value={valoresManual[item.value] ?? metodo?.venta ?? ""}
                                  inputMode="decimal"
                                  className="text-right"
                                  onChange={(event) => cambiarValorManual(item, event.target.value)}
                                />
                              </div>
                            )
                          ) : metodo?.venta != null ? (
                            <span className="font-medium tabular-nums">
                              {simbolo} {formatNumero(metodo.venta)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* DETALLE */}

                        <TableCell>
                          <Detalles detalles={metodo?.detalles ?? []} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>

              {/* =================================================
                TOTALES
            ================================================== */}

              {Object.keys(totalPorMoneda).length > 0 ? (
                <TableFooter>
                  {Object.entries(totalPorMoneda).map(([key, total]) => (
                    <TableRow key={key}>
                      <TableCell colSpan={lectura ? 5 : 6} className="font-semibold">
                        TOTAL
                      </TableCell>

                      <TableCell className="text-right font-semibold tabular-nums">
                        {getSimboloMoneda(monedas, total.moneda.cod_moneda)}{" "}
                        {formatNumero(total.total)}
                      </TableCell>

                      <TableCell />
                    </TableRow>
                  ))}
                </TableFooter>
              ) : null}
            </Table>
          </div>
        </div>
      </div>
    </section>
  );
}
