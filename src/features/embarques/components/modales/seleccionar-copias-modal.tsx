"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";

const ORIGINALES = [
  "ORIGINAL 1 (FOR ISSUING CARRIER)",
  "ORIGINAL 2 (FOR CONSIGNEE)",
  "ORIGINAL 3 (FOR SHIPPER)",
];

const COPIAS = [
  "COPY 4 (DELIVERY RECEIPT)",
  "COPY 5 (FOR AIRPORT OF DESTINATION)",
  "COPY 6 (FOR FIRST CARRIER)",
  "COPY 7 (FOR SECOND CARRIER)",
  "COPY 8 (FOR THIRD CARRIER)",
  "COPY 9 (FOR AGENT)",
  "COPY 10",
];

interface SeleccionarCopiasModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onGenerate: (copias: string[]) => void;
  readonly isGenerating?: boolean;
}

export default function SeleccionarCopiasModal({
  open,
  onClose,
  onGenerate,
  isGenerating = false,
}: SeleccionarCopiasModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(ORIGINALES));

  useEffect(() => {
    if (open) {
      setSelected(new Set(ORIGINALES));
    }
  }, [open]);

  const toggle = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const handleGenerate = () => {
    const ordered = [...ORIGINALES, ...COPIAS].filter((l) => selected.has(l));
    onGenerate(ordered);
  };

  const handleClose = () => {
    if (!isGenerating) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Descargar PDF</DialogTitle>
          <DialogDescription>Seleccione las copias a generar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold mb-1">Originales</p>
            <div className="space-y-1.5">
              {ORIGINALES.map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <Checkbox
                    id={label}
                    checked={selected.has(label)}
                    onCheckedChange={() => toggle(label)}
                    disabled={isGenerating}
                  />
                  <Label htmlFor={label} className="text-sm cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-semibold mb-1">Copias</p>
            <div className="space-y-1.5">
              {COPIAS.map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <Checkbox
                    id={label}
                    checked={selected.has(label)}
                    onCheckedChange={() => toggle(label)}
                    disabled={isGenerating}
                  />
                  <Label htmlFor={label} className="text-sm cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleGenerate} disabled={selected.size === 0 || isGenerating}>
            {isGenerating && <Loader2 className="size-4 animate-spin" />}
            {isGenerating ? "Generando PDF..." : "Generar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
