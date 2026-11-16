"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { asText } from "@/shared/lib/text";
import { DialogTitleWithClose } from "./shared";
import {
  cloneRows,
  getPaymentLabel,
  normalizeDecimalInput,
  PAYMENT_OPTIONS,
  toNumberOrNull,
} from "./utils";

interface TarifaRow {
  key: string;
  gruporubroNombre: string;
  servicioSiglas: string;
  codTipoPago: number | string | null;
  rateCosto: number | string;
  rateVenta: number | string;
  [key: string]: unknown;
}

interface TarifaCorrectionDialogProps {
  readonly open: boolean;
  readonly rows: TarifaRow[];
  readonly onClose: () => void;
  readonly onAccept: (rows: TarifaRow[]) => void;
}

export function TarifaCorrectionDialog({
  open,
  rows,
  onClose,
  onAccept,
}: TarifaCorrectionDialogProps) {
  const [localRows, setLocalRows] = useState<TarifaRow[]>([]);
  const hasRows = localRows.length > 0;

  useEffect(() => {
    if (open) {
      setLocalRows(cloneRows(rows));
    }
  }, [open, rows]);

  const handleFieldChange = (rowKey: string, field: string, rawValue: string) => {
    setLocalRows((currentRows) =>
      currentRows.map((row) => {
        if (row.key !== rowKey) {
          return row;
        }

        if (field === "codTipoPago") {
          return {
            ...row,
            codTipoPago: toNumberOrNull(rawValue) ?? "",
          };
        }

        return {
          ...row,
          [field]: normalizeDecimalInput(rawValue),
        };
      }),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogTitleWithClose
          title="Tarifa"
          subtitle="Cambios temporales sobre coordinación gastos."
          onClose={onClose}
        />
        <div className="px-6">
          {hasRows ? (
            <div className="flex flex-col gap-4">
              {localRows.map((row) => (
                <div key={row.key} className="rounded-lg border p-4">
                  <h3 className="text-base font-semibold">{row.gruporubroNombre || "Tarifa"}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[row.servicioSiglas || "Sin siglas", getPaymentLabel(row.codTipoPago)].join(
                      " - ",
                    )}
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor={`tarifa-tipo-pago-${row.key}`}
                        className="text-sm font-medium"
                      >
                        Tipo de pago
                      </label>
                      <Select
                        value={asText(row.codTipoPago)}
                        onValueChange={(value) => handleFieldChange(row.key, "codTipoPago", value)}
                      >
                        <SelectTrigger id={`tarifa-tipo-pago-${row.key}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor={`tarifa-costo-${row.key}`} className="text-sm font-medium">
                        Rate costo
                      </label>
                      <Input
                        id={`tarifa-costo-${row.key}`}
                        type="number"
                        value={row.rateCosto}
                        onChange={(e) => handleFieldChange(row.key, "rateCosto", e.target.value)}
                        min={0}
                        step="0.001"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor={`tarifa-venta-${row.key}`} className="text-sm font-medium">
                        Rate venta
                      </label>
                      <Input
                        id={`tarifa-venta-${row.key}`}
                        type="number"
                        value={row.rateVenta}
                        onChange={(e) => handleFieldChange(row.key, "rateVenta", e.target.value)}
                        min={0}
                        step="0.001"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No hay tarifas para editar.</p>
          )}
        </div>
        <DialogFooter className="px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onAccept(localRows)} disabled={!hasRows}>
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
