"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Combobox } from "@/shared/components/ui/combobox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { logger } from "@/shared/lib/logger";
import { asText } from "@/shared/lib/text";

interface RutaDialogProps {
  readonly open: boolean;
  readonly initialData: Record<string, unknown> | null;
  readonly onClose: () => void;
  readonly onSave: (data: Record<string, unknown>) => Promise<void>;
  readonly aerolineasOptions: Array<{ value: string; label: string }>;
  readonly paisesOptions: Array<{ value: string; label: string }>;
  readonly filterPuntosEnlaceByPais: (
    paisValue: unknown,
  ) => Array<{ value: string; label: string; cod_pais: string }>;
  readonly isLoadingAerolineas: boolean;
  readonly isLoadingPaises: boolean;
  readonly isLoadingPuntosEnlace: boolean;
}

const FORM_EMPTY = {
  embLegsId: null,
  codEntidadProv: "",
  codPaisOrigen: "",
  puertoIdOrigen: "",
  codPaisDestino: "",
  puertoIdDestino: "",
  flightNumber: "",
  fechaSalida: "",
  fechaLlegada: "",
  costoEstimado: 0,
  costoReal: 0,
};

export function RutaDialog({
  open,
  initialData,
  onClose,
  onSave,
  aerolineasOptions,
  paisesOptions,
  filterPuntosEnlaceByPais,
  isLoadingAerolineas,
  isLoadingPaises,
  isLoadingPuntosEnlace,
}: RutaDialogProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData ?? FORM_EMPTY);
  const [saving, setSaving] = useState(false);
  const [optionsReady, setOptionsReady] = useState(false);

  useEffect(() => {
    if (open) setFormData(initialData ?? FORM_EMPTY);
  }, [open, initialData]);

  useEffect(() => {
    if (!open) {
      setOptionsReady(false);
      return;
    }
    const id = requestAnimationFrame(() => setOptionsReady(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  const handleFormChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "codPaisOrigen") next.puertoIdOrigen = "";
      if (field === "codPaisDestino") next.puertoIdDestino = "";
      return next;
    });
  };

  const puntosOrigenFiltrados = filterPuntosEnlaceByPais(formData.codPaisOrigen);

  const puntosDestinoFiltrados = filterPuntosEnlaceByPais(formData.codPaisDestino);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      logger.error("Error al guardar ruta:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          {formData.embLegsId ? "Editar Ruta" : "Agregar Ruta"}
        </h2>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Aerolínea</Label>
            <Select
              value={String(formData.codEntidadProv)}
              onValueChange={(v) => handleFormChange("codEntidadProv", v)}
              disabled={isLoadingAerolineas}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar aerolínea" />
              </SelectTrigger>
              <SelectContent className="max-h-50">
                {optionsReady &&
                  aerolineasOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>País Origen *</Label>
            <Combobox
              value={String(formData.codPaisOrigen)}
              onChange={(v) => handleFormChange("codPaisOrigen", v)}
              options={paisesOptions}
              disabled={isLoadingPaises}
              placeholder="Seleccionar país"
              searchPlaceholder="Buscar país..."
              emptyMessage="No se encontró el país"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Aeropuerto Origen *</Label>
            <Select
              value={String(formData.puertoIdOrigen)}
              onValueChange={(v) => handleFormChange("puertoIdOrigen", v)}
              disabled={isLoadingPuntosEnlace}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar aeropuerto" />
              </SelectTrigger>
              <SelectContent className="max-h-75">
                {optionsReady &&
                  puntosOrigenFiltrados.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>País Destino *</Label>
            <Combobox
              value={String(formData.codPaisDestino)}
              onChange={(v) => handleFormChange("codPaisDestino", v)}
              options={paisesOptions}
              disabled={isLoadingPaises}
              placeholder="Seleccionar país"
              searchPlaceholder="Buscar país..."
              emptyMessage="No se encontró el país"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Aeropuerto Destino *</Label>
            <Select
              value={String(formData.puertoIdDestino)}
              onValueChange={(v) => handleFormChange("puertoIdDestino", v)}
              disabled={isLoadingPuntosEnlace}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar aeropuerto" />
              </SelectTrigger>
              <SelectContent className="max-h-50">
                {optionsReady &&
                  puntosDestinoFiltrados.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Nro. Vuelo</Label>
            <Input
              value={asText(formData.flightNumber)}
              onChange={(e) => handleFormChange("flightNumber", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
