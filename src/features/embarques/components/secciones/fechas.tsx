"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useCoordinacion,
  useCreateCoordinacionFechaMov,
  useDeleteCoordinacionFechaMov,
  useFetchCoordinacionFechaMov,
  useUpdateCoordinacionFechaMov,
} from "@/features/coordinaciones";
import { useEmbarqueContext } from "@/features/embarques/components/context";
import { useFetchTiposFecha } from "@/features/embarques/hooks/use-fetch-embarques";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  popoverListClassName,
} from "@/shared/components/ui/popover";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatearFecha } from "@/shared/lib/date";
import { logger } from "@/shared/lib/logger";
import { asText, safeString } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";
import { TablaDue } from "../tablas/tabla-due";

interface FechasSectionProps {
  readonly onValidityChange?: (valid: boolean) => void;
}

const FORM_EMPTY = {
  idFechaRegEmbarque: null,
  id_tipo_fecha: "",
  fecha: "",
  observacion: "",
};

const EXCLUDED_TIPOS_FECHA = new Set([158, 160]);

const formatDate = (valor: unknown): string => {
  if (!valor) return "";
  const rawValue = typeof valor === "string" ? valor : safeString(valor);
  const fechaSinHora = rawValue.includes("T") ? (rawValue.split("T")[0] ?? rawValue) : rawValue;
  const fechaObj = new Date(fechaSinHora);
  if (Number.isNaN(fechaObj.getTime())) return rawValue;
  return formatearFecha(fechaObj);
};

export function FechasSection({ onValidityChange }: FechasSectionProps) {
  const { embarque_id } = useEmbarqueContext();
  const { data: embarqueData } = useCoordinacion(embarque_id);

  const embarqueId = (embarqueData?.embarqueId ?? null) as number | null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFecha, setEditingFecha] = useState<Record<string, unknown> | null>(null);

  const {
    data: fechas = [],
    isLoading: isLoadingFechas,
    refetch: refetchFechas,
  } = useFetchCoordinacionFechaMov(embarqueId ? { embarque_id: embarqueId } : {}, {
    enabled: !!embarqueId,
  });

  const { data: tiposFecha = [], isLoading: isLoadingTipos } = useFetchTiposFecha();
  const { mutateAsync: crearFecha } = useCreateCoordinacionFechaMov({
    meta: { successMessage: "Fecha agregada correctamente" },
  });
  const { mutateAsync: actualizarFecha } = useUpdateCoordinacionFechaMov({
    meta: { successMessage: "Fecha actualizada correctamente" },
  });
  const { mutateAsync: eliminarFecha } = useDeleteCoordinacionFechaMov(embarqueId ?? "", {
    meta: { successMessage: "Fecha eliminada correctamente" },
  });

  useEffect(() => {
    onValidityChange?.(true);
  }, [onValidityChange]);

  const handleOpenAdd = () => {
    setEditingFecha(FORM_EMPTY);
    setDialogOpen(true);
  };

  const handleOpenEdit = (fecha: Record<string, unknown>) => {
    const rawFecha = fecha.fecha ?? "";
    const fechaSinHora =
      typeof rawFecha === "string" && rawFecha.includes("T") ? rawFecha.split("T")[0] : rawFecha;
    setEditingFecha({
      idFechaRegEmbarque: fecha.ID_FECHA_REG_EMBARQUE ?? fecha.idFechaRegEmbarque ?? null,
      id_tipo_fecha: fecha.ID_FECHA_TIPO ?? fecha.id_fecha_tipo ?? "",
      fecha: fechaSinHora,
      observacion: fecha.OBSERVACION ?? fecha.observacion ?? "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => setDialogOpen(false);

  const handleSave = async (formData: Record<string, unknown>) => {
    if (!embarqueId) return;
    try {
      if (formData.idFechaRegEmbarque) {
        await actualizarFecha({
          id_fecha_reg_embarque: asText(formData.idFechaRegEmbarque),
          embarque_id: embarqueId,
          id_tipo_fecha: asText(formData.id_tipo_fecha),
          fecha: asText(formData.fecha),
          observacion: asText(formData.observacion),
          estado_cod: "1",
        });
      } else {
        await crearFecha({
          embarqueId: embarqueId,
          id_tipo_fecha: asText(formData.id_tipo_fecha),
          fecha: asText(formData.fecha),
          observacion: asText(formData.observacion),
          estado_cod: "1",
        });
      }
      await refetchFechas();
      setDialogOpen(false);
    } catch (err) {
      logger.error("Error al guardar fecha:", err);
    }
  };

  const handleDelete = async (fecha: Record<string, unknown>) => {
    const id = fecha.ID_FECHA_REG_EMBARQUE ?? fecha.idFechaRegEmbarque;
    if (!id) return;
    try {
      await eliminarFecha({ id_fecha_reg_embarque: asText(id) });
      await refetchFechas();
    } catch (err) {
      logger.error("Error al eliminar fecha:", err);
    }
  };

  const fechasItems = fechas.map((fecha, index) => {
    const tipoDesc = fecha.tipo_descripcion || fecha.nomenclatura || `Fecha ${index + 1}`;
    const fechaVal = fecha.fecha || "";
    const observacion = fecha.observacion || "";
    const id: string | number =
      fecha.id_fecha_reg_embarque ?? fecha.idFechaRegEmbarque ?? `temp_${index}`;
    return {
      key: id,
      nombre: tipoDesc,
      nombreProveedor: "",
      monedaSimbolo: "",
      valor: 0,
      detallesColumns: true,
      _fecha: fecha,
      detalles: [
        {
          tarifadetalle_id: `fecha-${index}`,
          tipo_desc: "Fecha",
          tarifadetalle_descripcion: asText(formatDate(fechaVal)),
        },
        {
          tarifadetalle_id: `obs-${index}`,
          tipo_desc: "Observación",
          tarifadetalle_descripcion: asText(observacion),
        },
      ],
    };
  });

  const excludedTipoFechaIds = (() => {
    const ids = new Set<number>();
    fechas.forEach((fecha) => {
      const idTipo = fecha.id_tipo_fecha;
      if (idTipo != null && idTipo !== "") ids.add(Number(idTipo));
    });
    return ids;
  })();

  const renderAccionFila = (item: Record<string, unknown>) => (
    <div className="flex gap-1">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
        onClick={() => handleOpenEdit(item._fecha as Record<string, unknown>)}
        aria-label="Editar fecha"
        title="Editar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Icono editar</title>
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
        onClick={() => handleDelete(item._fecha as Record<string, unknown>)}
        aria-label="Eliminar fecha"
        title="Eliminar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Icono eliminar</title>
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>
    </div>
  );

  if (!embarqueId) {
    return (
      <div className="p-4">
        <BannerInformativo
          severidad="warning"
          titulo="Faltan datos del embarque"
          mensaje="No hay datos del embarque disponibles."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-1/2">
      <BannerInformativo
        ocultar={isLoadingFechas || fechas.length > 0}
        severidad="info"
        titulo="Sin fechas registradas"
        mensaje="Puede agregar fechas de movimiento cuando aplique."
      />

      {isLoadingFechas ? (
        <div className="flex justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <TablaDue
          titulo="Fechas"
          subtituloParte=""
          subtituloTexto=""
          entidadNombre=""
          items={fechasItems}
          mostrarCodTipoPago={false}
          mostrarValor={false}
          usarEtiquetasDetalleComoCabecera
          renderAccionFila={renderAccionFila}
          columnaAccionAncho="1%"
          onRefresh={refetchFechas}
          refreshDisabled={isLoadingFechas}
          accionesHeader={
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground"
              onClick={handleOpenAdd}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Icono agregar</title>
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Agregar
            </button>
          }
        />
      )}

      <FechaDialog
        open={dialogOpen}
        initialData={editingFecha}
        onClose={handleCloseDialog}
        onSave={handleSave}
        tiposFecha={tiposFecha as Array<{ value: string | number; label: string }>}
        isLoadingTipos={isLoadingTipos}
        excludedTipoFechaIds={excludedTipoFechaIds}
      />
    </div>
  );
}

interface FechaDialogProps {
  readonly open: boolean;
  readonly initialData: Record<string, unknown> | null;
  readonly onClose: () => void;
  readonly onSave: (data: Record<string, unknown>) => Promise<void>;
  readonly tiposFecha: Array<{ value: string | number; label: string }>;
  readonly isLoadingTipos: boolean;
  readonly excludedTipoFechaIds: Set<number>;
}

function FechaDialog({
  open,
  initialData,
  onClose,
  onSave,
  tiposFecha,
  isLoadingTipos,
  excludedTipoFechaIds,
}: FechaDialogProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData ?? FORM_EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFormData(initialData ?? FORM_EMPTY);
  }, [open, initialData]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedValue = Number(formData.id_tipo_fecha);
  const filtered = (tiposFecha ?? []).filter((t) => {
    const numericValue = Number(t.value);
    const isExcludedTipo = EXCLUDED_TIPOS_FECHA.has(numericValue);
    const isAlreadyUsed = excludedTipoFechaIds.has(numericValue);
    return !isExcludedTipo && (!isAlreadyUsed || numericValue === selectedValue);
  });
  const selectedOption = (tiposFecha ?? []).find((t) => Number(t.value) === selectedValue);
  const tipoFechaOptions =
    selectedOption && EXCLUDED_TIPOS_FECHA.has(selectedValue)
      ? [...filtered, selectedOption]
      : filtered;

  const [tipoFechaOpen, setTipoFechaOpen] = useState(false);

  const handleSave = async () => {
    if (!formData.id_tipo_fecha || !formData.fecha) return;
    setSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      logger.error("Error al guardar fecha:", err);
    } finally {
      setSaving(false);
    }
  };

  const isValid = formData.id_tipo_fecha && formData.fecha;

  const selectedLabel =
    tipoFechaOptions.find((o) => String(o.value) === String(formData.id_tipo_fecha))?.label ?? "";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          {formData.idFechaRegEmbarque ? "Editar Fecha" : "Agregar Fecha"}
        </h2>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Tipo de Fecha *</Label>
            <Popover open={tipoFechaOpen} onOpenChange={setTipoFechaOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tipoFechaOpen}
                  disabled={isLoadingTipos}
                  className="w-full justify-between font-normal"
                >
                  {selectedLabel || "Seleccionar tipo"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className={cn(popoverListClassName, "p-0")}>
                <Command>
                  <CommandInput placeholder="Buscar tipo de fecha..." />
                  <CommandList>
                    <CommandEmpty>No se encontró el tipo</CommandEmpty>
                    <CommandGroup>
                      {tipoFechaOptions.map((t) => (
                        <CommandItem
                          key={t.value}
                          value={t.label}
                          onSelect={() => {
                            handleChange("id_tipo_fecha", String(t.value));
                            setTipoFechaOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              String(formData.id_tipo_fecha) === String(t.value)
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {t.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Fecha *</Label>
            <Input
              type="date"
              value={asText(formData.fecha)}
              onChange={(e) => handleChange("fecha", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Observación</Label>
            <Textarea
              value={asText(formData.observacion)}
              onChange={(e) => handleChange("observacion", e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
