"use client";

import { Calculator } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  CalculadoraCargasProps,
  CalculadoraCargasResult,
  CalculadoraCargasValues,
} from "@/features/embarques/api/types-embarque";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const valoresIniciales: CalculadoraCargasValues = {
  cantidad: 1,
  volumenTotal: 0,
  pesoTotal: 0,
  largo: "",
  alto: "",
  ancho: "",
};

export function CalculadoraCargas({
  open,
  onClose,
  onApply,
  initialValues = {},
}: CalculadoraCargasProps) {
  const [values, setValues] = useState<CalculadoraCargasValues>({
    ...valoresIniciales,
    cantidad: initialValues.cantidad ?? 1,
    volumenTotal: initialValues.volumenTotal ?? 0,
    pesoTotal: initialValues.pesoTotal ?? 0,
    largo: initialValues.largo ?? "",
    alto: initialValues.alto ?? "",
    ancho: initialValues.ancho ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (open) {
      setValues({
        ...valoresIniciales,
        cantidad: initialValues.cantidad ?? 1,
        volumenTotal: initialValues.volumenTotal ?? 0,
        pesoTotal: initialValues.pesoTotal ?? 0,
        largo: initialValues.largo ?? "",
        alto: initialValues.alto ?? "",
        ancho: initialValues.ancho ?? "",
      });
      setErrors({});
    }
  }, [
    open,
    initialValues.pesoTotal,
    initialValues.ancho,
    initialValues.volumenTotal,
    initialValues.largo,
    initialValues.cantidad,
    initialValues.alto,
  ]);

  const handleChange =
    (field: keyof CalculadoraCargasValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setValues((prev) => ({ ...prev, [field]: val }));
      setErrors((prev) => ({ ...prev, [field]: null }));
    };

  const calcular = () => {
    const largo = Number(values.largo) || 0;
    const alto = Number(values.alto) || 0;
    const ancho = Number(values.ancho) || 0;
    const cantidad = Number(values.cantidad) || 1;

    if (largo <= 0 || alto <= 0 || ancho <= 0) {
      setErrors({
        largo: largo ? null : "Requerido",
        alto: alto ? null : "Requerido",
        ancho: ancho ? null : "Requerido",
      });
      return;
    }

    const volumenUnitario = (largo * alto * ancho) / 6000;
    const volumen = Number((volumenUnitario * cantidad).toFixed(3));

    setValues((prev) => ({
      ...prev,
      volumenTotal: volumen,
    }));
  };

  const handleApply = () => {
    const largo = Number(values.largo) || 0;
    const alto = Number(values.alto) || 0;
    const ancho = Number(values.ancho) || 0;
    const cantidad = Number(values.cantidad) || 1;

    let volumenTotal = Number(values.volumenTotal);
    if (largo > 0 && alto > 0 && ancho > 0) {
      const volumenUnitario = (largo * alto * ancho) / 6000;
      volumenTotal = Number((volumenUnitario * cantidad).toFixed(3));
    }

    const resultado: CalculadoraCargasResult = {
      pesoTotal: Number(values.pesoTotal) || 0,
      volumenTotal,
      cantidad,
      largo: values.largo ? Number(values.largo) : undefined,
      alto: values.alto ? Number(values.alto) : undefined,
      ancho: values.ancho ? Number(values.ancho) : undefined,
    };

    onApply(resultado);
  };

  return (
    <Dialog open={open} onOpenChange={(abrir) => !abrir && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Cargas
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-2">
          <div>
            <Label className="text-sm text-muted-foreground">Dimensiones (cm)</Label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="largo">Largo</Label>
              <Input
                id="largo"
                value={values.largo}
                onChange={handleChange("largo")}
                className={errors.largo ? "border-destructive" : ""}
              />
              {errors.largo && <p className="text-xs text-destructive">{errors.largo}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="alto">Alto</Label>
              <Input
                id="alto"
                value={values.alto}
                onChange={handleChange("alto")}
                className={errors.alto ? "border-destructive" : ""}
              />
              {errors.alto && <p className="text-xs text-destructive">{errors.alto}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ancho">Ancho</Label>
              <Input
                id="ancho"
                value={values.ancho}
                onChange={handleChange("ancho")}
                className={errors.ancho ? "border-destructive" : ""}
              />
              {errors.ancho && <p className="text-xs text-destructive">{errors.ancho}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                value={values.cantidad}
                onChange={handleChange("cantidad")}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={calcular} className="h-10 w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calcular Volumen
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volumen">Volumen (kg)</Label>
              <Input
                id="volumen"
                type="number"
                value={values.volumenTotal}
                onChange={handleChange("volumenTotal")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input
                id="peso"
                type="number"
                value={values.pesoTotal}
                onChange={handleChange("pesoTotal")}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
