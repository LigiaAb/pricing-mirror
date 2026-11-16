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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { asText } from "@/shared/lib/text";
import { DialogTitleWithClose } from "./shared";
import { cloneRows, normalizeDecimalInput, PAYMENT_OPTIONS, toNumberOrNull } from "./utils";

interface GastoRow {
  key: string;
  gruporubroNombre: string;
  servicioSiglas: string;
  codTipoPago: number | string | null;
  rateCosto: number | string;
  costoRubro: number | string;
  rateVenta: number | string;
  ventaRubro: number | string;
  [key: string]: unknown;
}

interface GastosCorrectionDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly rows: GastoRow[];
  readonly onClose: () => void;
  readonly onAccept: (rows: GastoRow[]) => void;
  readonly dialogClassName?: string;
}

export function GastosCorrectionDialog({
  open,
  title,
  rows,
  onClose,
  onAccept,
  dialogClassName = "max-w-6xl",
}: GastosCorrectionDialogProps) {
  const [localRows, setLocalRows] = useState<GastoRow[]>([]);
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
      <DialogContent className={dialogClassName}>
        <DialogTitleWithClose
          title={title}
          subtitle="Cambios temporales sobre coordinación gastos."
          onClose={onClose}
        />
        <div className="px-6">
          {hasRows ? (
            <div className="max-h-130 overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="w-60">Rubro / Servicio</TableHead>
                    <TableHead className="w-60">Tipo</TableHead>
                    <TableHead className="w-60">Rate costo</TableHead>
                    <TableHead className="w-60">Costo</TableHead>
                    <TableHead className="w-60">Rate venta</TableHead>
                    <TableHead className="w-60">Venta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold">
                            {row.gruporubroNombre || "Sin rubro"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.servicioSiglas || "Sin siglas"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={asText(row.codTipoPago)}
                          onValueChange={(value) =>
                            handleFieldChange(row.key, "codTipoPago", value)
                          }
                        >
                          <SelectTrigger className="h-8">
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
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.rateCosto}
                          onChange={(e) => handleFieldChange(row.key, "rateCosto", e.target.value)}
                          min={0}
                          step="0.001"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.costoRubro}
                          onChange={(e) => handleFieldChange(row.key, "costoRubro", e.target.value)}
                          min={0}
                          step="0.001"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.rateVenta}
                          onChange={(e) => handleFieldChange(row.key, "rateVenta", e.target.value)}
                          min={0}
                          step="0.001"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.ventaRubro}
                          onChange={(e) => handleFieldChange(row.key, "ventaRubro", e.target.value)}
                          min={0}
                          step="0.001"
                          className="h-8"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No hay gastos para editar.</p>
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
