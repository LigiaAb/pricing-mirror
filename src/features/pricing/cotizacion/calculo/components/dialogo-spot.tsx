"use client";
import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { useTarifaRangos } from "../../../tarifas/api/tarifa-rangos";
import {
  getCodServicioDueCarrier,
  getEntidadIdDueCarrier,
  getMetodoDueCarrier,
  type RubroDueCarrier,
} from "../lib/due-carrier";

import { formatNumero, getSimboloMoneda } from "../lib/utils";
import { useCatalogosCotizacion } from "../hooks/use-catalogos-cotizacion";
function buscarFleteBaseNormal(item: RubroDueCarrier, rubros: RubroDueCarrier[]) {
  if (!item.es_tarifa_spot) {
    return item;
  }

  /*
   * Si estamos cambiando un SPOT,
   * recuperar el flete NORMAL equivalente.
   *
   * Esto evita construir:
   *
   * xxx-SPOT-SPOT
   *
   * y elimina una fuente posible
   * de duplicados.
   */
  return (
    rubros.find(
      (rubro) =>
        rubro.es_flete === true &&
        rubro.es_tarifa_spot !== true &&
        String(rubro.cod_rubro) === String(item.cod_rubro) &&
        String(getCodServicioDueCarrier(rubro)) === String(getCodServicioDueCarrier(item)) &&
        String(getEntidadIdDueCarrier(rubro)) === String(getEntidadIdDueCarrier(item)),
    ) ?? item
  );
}

export function DialogoSpot({
  open,
  onOpenChange,
  rubro,
  rubros,
  valorCw,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  rubro: RubroDueCarrier | null;
  rubros: RubroDueCarrier[];
  valorCw?: string | number | null | undefined;
  onConfirm: (rubro: RubroDueCarrier, valorFlete: number, rate: number) => void;
}) {
  const { monedas } = useCatalogosCotizacion().calculo;

  const [tarifaSpot, setTarifaSpot] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTarifaSpot("");
    }
  }, [open]);

  const rubroBase = rubro ? buscarFleteBaseNormal(rubro, rubros) : null;
  const metodo = rubroBase?.metodo ?? (rubroBase ? getMetodoDueCarrier(rubroBase) : null);
  const esMinimo = metodo?.rate_venta != null && Number(metodo.rate_venta) === 0;
  const codMetodo = metodo?.cod_metodo ?? rubroBase?.servicio?.metodo?.cod_metodo;
  const rangos = useTarifaRangos({
    codEstado: 1,
    ...(open && esMinimo && codMetodo != null ? { codMetodo: String(codMetodo) } : {}),
  });
  const primerRango = rangos.data?.reduce<(typeof rangos.data)[number] | undefined>(
    (menor, rango) => (!menor || Number(rango.inicio) < Number(menor.inicio) ? rango : menor),
    undefined,
  );
  if (!rubroBase) return null;
  const cw = Number(valorCw ?? 0);
  const rateActual = Number(esMinimo ? (primerRango?.venta ?? 0) : (metodo?.rate_venta ?? 0));
  const rateSpot = esMinimo ? rateActual : Number(tarifaSpot || 0);
  const fleteActual = esMinimo ? Number(metodo?.venta ?? 0) : cw * rateActual;
  const fleteSpot = esMinimo ? Number(tarifaSpot || 0) : cw * rateSpot;
  const simbolo = getSimboloMoneda(monedas, metodo?.cod_moneda_venta);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Tarifa SPOT de flete
            {esMinimo && (
              <p className="text-sm text-muted-foreground">
                La modificación se aplica al mínimo; se conserva la tarifa actual.
                {rangos.isError
                  ? " No se pudieron cargar los rangos."
                  : !rangos.isFetching && !primerRango
                    ? " No hay rangos disponibles."
                    : ""}
              </p>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 overflow-auto ">
          <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Tarifa actual</p>

              <p className="font-medium tabular-nums">
                <pre>
                  {simbolo} {formatNumero(rateActual)}
                </pre>
              </p>
            </div>
            {!esMinimo && (
              <div>
                <p className="text-xs text-muted-foreground">CW</p>

                <p className="font-medium tabular-nums">
                  <pre>{formatNumero(cw)}</pre>
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">
                {esMinimo ? "Mínimo actual" : "Flete actual"}
              </p>

              <p className="font-medium tabular-nums">
                <pre>
                  {simbolo} {formatNumero(fleteActual)}
                </pre>
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {esMinimo && <div className="rounded-md  p-3" />}
            <div className="space-y-1">
              <label htmlFor="tarifa-spot" className="text-sm font-medium">
                {esMinimo ? "Nuevo flete mínimo" : "Tarifa SPOT"}
              </label>

              <Input
                id="tarifa-spot"
                value={tarifaSpot}
                inputMode="decimal"
                placeholder="0.00"
                onChange={(event) => {
                  const value = event.target.value.replace(/[^0-9.]/g, "");

                  setTarifaSpot(value);
                }}
              />
            </div>

            {!esMinimo && (
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Flete SPOT</p>

                <p className="text-lg tabular-nums">
                  <pre>
                    {simbolo} {formatNumero(fleteSpot)}
                  </pre>
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>

            <Button
              type="button"
              disabled={
                !Number.isFinite(fleteSpot) ||
                fleteSpot <= 0 ||
                (esMinimo &&
                  (rangos.isFetching ||
                    rangos.isError ||
                    !primerRango ||
                    !Number.isFinite(rateActual)))
              }
              onClick={() => {
                onConfirm(rubroBase, fleteSpot, rateSpot);

                onOpenChange(false);
              }}
            >
              Calcular
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
