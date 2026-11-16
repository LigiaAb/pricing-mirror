"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { DialogTitleWithClose, DisplayValue } from "./shared";
import {
  type CargaDraft,
  cloneRows,
  deriveCargaDraft,
  normalizeDecimalInput,
  normalizeIntegerInput,
} from "./utils";

interface CargasCorrectionDialogProps {
  readonly open: boolean;
  readonly rows: CargaDraft[];
  readonly onClose: () => void;
  readonly onAccept: (rows: CargaDraft[]) => void;
}

export function CargasCorrectionDialog({
  open,
  rows,
  onClose,
  onAccept,
}: CargasCorrectionDialogProps) {
  const [localRows, setLocalRows] = useState<CargaDraft[]>([]);
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

        const nextValue =
          field === "bultos" ? normalizeIntegerInput(rawValue) : normalizeDecimalInput(rawValue);

        return deriveCargaDraft({
          ...row,
          [field]: nextValue,
        });
      }),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogTitleWithClose
          title="Corrección de cargas"
          subtitle="Edite bultos, dimensiones y peso. Peso volumétrico y CW se recalculan automáticamente."
          onClose={onClose}
        />
        <div className="px-6">
          {hasRows ? (
            <div className="max-h-130 overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="w-55">Descripción</TableHead>
                    <TableHead className="w-55">Bultos</TableHead>
                    <TableHead className="w-55">Alto</TableHead>
                    <TableHead className="w-55">Ancho</TableHead>
                    <TableHead className="w-55">Largo</TableHead>
                    <TableHead className="w-55">Peso</TableHead>
                    <TableHead className="w-55">Peso volumétrico</TableHead>
                    <TableHead className="w-55">CW</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>
                        <span className="text-sm">{row.descripcion || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.bultos}
                          onChange={(e) => handleFieldChange(row.key, "bultos", e.target.value)}
                          min={0}
                          step={1}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.alto}
                          onChange={(e) => handleFieldChange(row.key, "alto", e.target.value)}
                          min={0}
                          step="0.001"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.ancho}
                          onChange={(e) => handleFieldChange(row.key, "ancho", e.target.value)}
                          min={0}
                          step="0.001"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.largo}
                          onChange={(e) => handleFieldChange(row.key, "largo", e.target.value)}
                          min={0}
                          step="0.001"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.peso}
                          onChange={(e) => handleFieldChange(row.key, "peso", e.target.value)}
                          min={0}
                          step="0.001"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <DisplayValue value={row.pesoVolumetrico} />
                      </TableCell>
                      <TableCell>
                        <DisplayValue value={row.cw} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No hay cargas para editar.</p>
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
