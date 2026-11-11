"use client";

import { AlertTriangle, Calculator, Info, X } from "lucide-react";
import React from "react";
import { Button } from "@/shared/components/ui/button";
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
import type { useRubrosDueCarrier } from "../hooks/use-rubros-due-carrier";
import { esMetodoCostoPorcentaje } from "../lib/costo-porcentaje";
import {
  esDueCarrierManual,
  getCodMonedaDueCarrier,
  getCodServicioDueCarrier,
  getEntidadIdDueCarrier,
  getMetodoDueCarrier,
  type RubroDueCarrier,
} from "../lib/due-carrier";
import { DialogoSpot } from "./dialogo-spot";
import { FichaResumen } from "./ficha-resumen";

import { formatNumero, getEstadoMetodo, getSimboloMoneda } from "../lib/utils";
import { useCatalogosCotizacion } from "../hooks/use-catalogos-cotizacion";
import { Detalles } from "./utils";

type DueCarrierController = ReturnType<typeof useRubrosDueCarrier>;

type Props = {
  controller: DueCarrierController;

  /*
   * Se conserva separado del controller porque el diálogo SPOT
   * necesita recuperar el flete NORMAL original.
   * controller.rubros ya viene procesado y, cuando existe SPOT,
   * ese flete normal puede haber sido filtrado.
   */
  rubros: RubroDueCarrier[];

  lectura?: boolean;

  entidadNombre?: string | null;

  valorCw?: string | number | null;

  /*
   * Se utiliza solamente en el Carrier
   * principal.
   *
   * En Due Carrier basado en Due Agent
   * simplemente no se envía.
   */
  onAgregarSpot?: (rubro: RubroDueCarrier, valorFlete: number, rate: number) => void;

  onRemoveSpot?: () => void;
};

/* ==========================================================================
 * FORMATOS
 * ========================================================================== */

/* ==========================================================================
 * DETALLES
 * ========================================================================== */

/* ==========================================================================
 * SPOT
 * ========================================================================== */

export function DueCarrier({
  controller,
  rubros,
  lectura = false,
  entidadNombre,
  valorCw,
  onAgregarSpot,
  onRemoveSpot,
}: Props) {
  const { monedas, metodos } = useCatalogosCotizacion().calculo;

  const {
    rubros: rubrosProcesados,
    valoresManual,
    totalPorMoneda,
    cambiarValorManual,
  } = controller;

  const [rubroSpot, setRubroSpot] = React.useState<RubroDueCarrier | null>(null);

  const [spotOpen, setSpotOpen] = React.useState(false);

  const tieneSpot = rubrosProcesados.some((item) => item.es_tarifa_spot === true);

  return (
    <>
      <section className="overflow-hidden rounded-lg border flex flex-row">
        {/* =====================================================
            CABECERA
        ====================================================== */}
        <div className="">
          <div className="flex w-12 shrink-0 items-center justify-center bg-primary text-primary-foreground h-full">
            <span className="-rotate-90 whitespace-nowrap text-sm font-semibold tracking-[0.2em]">
              DUE CARRIER
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
                Servicios del <strong className="text-foreground">Carrier</strong> aplicados a la
                cotización.
              </p>
            </div>
          </div>

          {/* =====================================================
            TABLA
        ====================================================== */}

          <div className="space-y-4 p-4">
            <div className=" rounded-md border">
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
                  {rubrosProcesados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                        No hay rubros Due Carrier.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rubrosProcesados.map((item) => {
                      const codServicio = getCodServicioDueCarrier(item);

                      const metodoCatalogo = metodos.find(
                        (metodo) => String(metodo.cod_servicio) === String(codServicio),
                      );

                      const { vencida, proximaAVencer } = getEstadoMetodo(
                        metodoCatalogo?.fecha_final,
                      );

                      const metodo = getMetodoDueCarrier(item);

                      const manual = esDueCarrierManual(item);

                      const simbolo = getSimboloMoneda(monedas, getCodMonedaDueCarrier(item));

                      return (
                        <TableRow
                          key={
                            item.value ??
                            `${item.cod_rubro}-${codServicio}-${getEntidadIdDueCarrier(item)}-${item.es_tarifa_spot ? "SPOT" : "NORMAL"}`
                          }
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

                          {/* ACCIONES */}

                          {!lectura && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {!lectura && item.es_tarifa_spot && onRemoveSpot ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 text-destructive hover:text-destructive"
                                    onClick={onRemoveSpot}
                                  >
                                    <X className="size-4" />

                                    <span className="sr-only">Quitar SPOT</span>
                                  </Button>
                                ) : null}

                                {!lectura && item.es_flete && onAgregarSpot ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    title={
                                      tieneSpot ? "Cambiar tarifa SPOT" : "Agregar tarifa SPOT"
                                    }
                                    onClick={() => {
                                      setRubroSpot(item);

                                      setSpotOpen(true);
                                    }}
                                  >
                                    <Calculator className="size-4" />

                                    <span className="sr-only">
                                      {tieneSpot ? "Cambiar tarifa SPOT" : "Agregar tarifa SPOT"}
                                    </span>
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          )}

                          {/* CÓDIGO */}

                          <TableCell className="font-mono text-xs">
                            [{codServicio ?? "—"}]
                          </TableCell>

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
                            {item.siglas ? `[${item.siglas}]` : "—"}
                          </TableCell>

                          {/* SERVICIO */}

                          <TableCell>{item.servicio?.nombre ?? "—"}</TableCell>

                          {/* VENTA */}

                          <TableCell className="min-w-[150px] text-right">
                            {esMetodoCostoPorcentaje(item) && !lectura ? (
                              <div className="ml-auto grid max-w-[140px] gap-1">
                                <span className="text-left text-xs text-muted-foreground">
                                  Costo
                                </span>
                                <Input
                                  value={valoresManual[String(item.value)] ?? ""}
                                  inputMode="decimal"
                                  className="text-right"
                                  onChange={(event) => cambiarValorManual(item, event.target.value)}
                                />
                                <span className="font-medium tabular-nums">
                                  Venta: {simbolo} {formatNumero(metodo?.venta)}
                                </span>
                              </div>
                            ) : manual && !lectura ? (
                              <div className="ml-auto grid max-w-[140px] gap-1">
                                <Input
                                  value={valoresManual[String(item.value)] ?? metodo?.venta ?? ""}
                                  inputMode="decimal"
                                  className="text-right"
                                  onChange={(event) => cambiarValorManual(item, event.target.value)}
                                />

                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {simbolo} {formatNumero(valoresManual[String(item.value)] ?? 0)}
                                </span>
                              </div>
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
                TOTAL
            ================================================== */}

                {Object.keys(totalPorMoneda).length ? (
                  <TableFooter>
                    {Object.entries(totalPorMoneda).map(([key, data]) => (
                      <TableRow key={key}>
                        <TableCell colSpan={lectura ? 5 : 6} className="font-semibold">
                          TOTAL
                        </TableCell>

                        <TableCell className="text-right font-semibold tabular-nums">
                          {getSimboloMoneda(monedas, data.moneda.cod_moneda)}{" "}
                          {formatNumero(data.total)}
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

      {/* =======================================================
          SPOT
      ======================================================== */}

      {onAgregarSpot ? (
        <DialogoSpot
          open={spotOpen}
          onOpenChange={setSpotOpen}
          rubro={rubroSpot}
          rubros={rubros}
          valorCw={valorCw}
          onConfirm={onAgregarSpot}
        />
      ) : null}
    </>
  );
}
