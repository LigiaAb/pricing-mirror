"use client";

import { Button } from "@/shared/components/ui/button";
import { Combobox } from "@/shared/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { asText } from "@/shared/lib/text";
import type { DimensionesCarga } from "../../lib/cargas-calculos";

interface Option {
  value: string;
  label: string;
}

interface CargaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  saving: boolean;
  /** G10: habilita "Guardar" (paridad `modalCargas.jsx:validarFilaEditable`). */
  formValido: boolean;
  camposInvalidos: string[];
  formData: Record<string, unknown>;
  dimensiones: DimensionesCarga;
  embalajeOptions: Option[];
  regimenOptions: Option[];
  unidadMedidaOptions: Option[];
  paises: Array<{ cod_pais: string | number; nombre_pais: string }>;
  onFieldChange: (field: string, value: unknown) => void;
  onSave: () => void;
  /** Detalle CTS: el diálogo solo muestra el producto, sin permitir edición. */
  readOnly?: boolean;
}

function CampoNumero({
  label,
  field,
  formData,
  onFieldChange,
  step,
  disabled,
  invalido,
}: Readonly<{
  label: string;
  field: string;
  formData: Record<string, unknown>;
  onFieldChange: (field: string, value: unknown) => void;
  step?: string | undefined;
  disabled?: boolean;
  invalido?: boolean;
}>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className={invalido ? "text-destructive" : undefined}>{label}</Label>
      <Input
        type="number"
        step={step}
        value={asText(formData[field])}
        onChange={(e) => onFieldChange(field, e.target.value)}
        placeholder="0"
        disabled={disabled}
        aria-invalid={invalido}
        className={
          invalido
            ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40"
            : undefined
        }
      />
    </div>
  );
}

function CampoSelect({
  label,
  field,
  formData,
  onFieldChange,
  options,
  disabled = false,
  invalido,
}: Readonly<{
  label: string;
  field: string;
  formData: Record<string, unknown>;
  onFieldChange: (field: string, value: unknown) => void;
  options: Option[];
  disabled?: boolean;
  invalido?: boolean;
}>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className={invalido ? "text-destructive" : undefined}>{label}</Label>
      <Select
        value={asText(formData[field])}
        onValueChange={(v) => onFieldChange(field, v)}
        disabled={disabled}
      >
        <SelectTrigger
          aria-invalid={invalido}
          className={
            invalido
              ? "border-destructive focus:border-destructive focus:ring-destructive/40"
              : undefined
          }
        >
          <SelectValue placeholder="Seleccionar" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Diálogo de alta/edición de producto (carga) de la coordinación. */
export function CargaFormDialog({
  open,
  onOpenChange,
  isEditing,
  saving,
  formValido,
  camposInvalidos,
  formData,
  dimensiones,
  embalajeOptions,
  regimenOptions,
  unidadMedidaOptions,
  paises,
  onFieldChange,
  onSave,
  readOnly = false,
}: Readonly<CargaFormDialogProps>) {
  const campoInvalido = (field: string) => isEditing && camposInvalidos.includes(field);
  const mostrarValidacion = isEditing && !formValido;
  const paisOptions = paises.map((p) => ({
    value: String(p.cod_pais),
    label: p.nombre_pais,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? "Ver producto" : isEditing ? "Editar producto" : "Agregar producto"}
          </DialogTitle>
        </DialogHeader>

        {mostrarValidacion ? (
          <p
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            Complete los campos obligatorios marcados en rojo.
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <CampoNumero
            label="Cantidad (bultos) *"
            field="cantidad"
            formData={formData}
            onFieldChange={onFieldChange}
            disabled={readOnly}
            invalido={campoInvalido("cantidad")}
          />
          <CampoNumero
            label="Peso total (kg) *"
            field="pesoTotal"
            formData={formData}
            onFieldChange={onFieldChange}
            step="0.01"
            disabled={readOnly}
            invalido={campoInvalido("pesoTotal")}
          />

          <CampoSelect
            label="Unidad de medida *"
            field="unidadMedida"
            formData={formData}
            onFieldChange={onFieldChange}
            options={unidadMedidaOptions}
            disabled={readOnly}
            invalido={campoInvalido("unidadMedida")}
          />

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Dimensiones</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["largo", "alto", "ancho"] as const).map((dim) => (
                <div key={dim} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {dim.charAt(0).toUpperCase() + dim.slice(1)}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={asText(formData[dim])}
                    onChange={(e) => onFieldChange(dim, e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                <span className="font-medium">Peso Volumétrico:</span>
                <span>
                  {dimensiones.pesoVolumetrico > 0
                    ? `${dimensiones.pesoVolumetrico.toFixed(2)} kg`
                    : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                <span className="font-medium">CW:</span>
                <span>{dimensiones.cw > 0 ? `${dimensiones.cw.toFixed(2)} kg` : "-"}</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label className={campoInvalido("descripcion") ? "text-destructive" : undefined}>
              Descripción *
            </Label>
            <Textarea
              value={asText(formData.descripcion)}
              onChange={(e) => onFieldChange("descripcion", e.target.value)}
              rows={2}
              placeholder="Descripción de la carga"
              disabled={readOnly}
              aria-invalid={campoInvalido("descripcion")}
              className={
                campoInvalido("descripcion")
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
            />
          </div>

          <CampoNumero
            label="Valor declarado *"
            field="valor"
            formData={formData}
            onFieldChange={onFieldChange}
            step="0.01"
            disabled={readOnly}
            invalido={campoInvalido("valor")}
          />
          <div className="flex flex-col gap-1.5">
            <Label className={campoInvalido("paisOrigenId") ? "text-destructive" : undefined}>
              País Origen *
            </Label>
            <Combobox
              value={asText(formData.paisOrigenId)}
              onChange={(v) => onFieldChange("paisOrigenId", v)}
              options={paisOptions}
              placeholder="Seleccionar"
              searchPlaceholder="Buscar país..."
              emptyMessage="No se encontró el país"
              disabled={readOnly}
              ariaLabel="País Origen"
              {...(campoInvalido("paisOrigenId")
                ? {
                    className:
                      "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40",
                  }
                : {})}
            />
          </div>
          <CampoSelect
            label="Tipo embalaje *"
            field="tipoEmbalaje"
            formData={formData}
            onFieldChange={onFieldChange}
            options={embalajeOptions}
            disabled={readOnly}
            invalido={campoInvalido("tipoEmbalaje")}
          />
          <div className="flex flex-col gap-1.5">
            <Label className={campoInvalido("partidaArancelaria") ? "text-destructive" : undefined}>
              Partida arancelaria *
            </Label>
            <Input
              value={asText(formData.partidaArancelaria)}
              onChange={(e) => onFieldChange("partidaArancelaria", e.target.value)}
              placeholder="00.00.00.00.00"
              maxLength={29}
              disabled={readOnly}
              aria-invalid={campoInvalido("partidaArancelaria")}
              className={
                campoInvalido("partidaArancelaria")
                  ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40"
                  : undefined
              }
            />
          </div>
          <CampoSelect
            label="Régimen aduanal *"
            field="regimenAduanal"
            formData={formData}
            onFieldChange={onFieldChange}
            options={regimenOptions}
            disabled={readOnly}
            invalido={campoInvalido("regimenAduanal")}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {readOnly ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={onSave} disabled={saving || !formValido}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
