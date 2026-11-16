"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Combobox } from "@/shared/components/ui/combobox";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupInput } from "@/shared/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";

/* ==========================================================================
 * CAMPOS DE CAPTURA DE EMBARQUES V2 (MAQUETA)
 *
 * Mismos componentes que ya usa el proyecto, uno por tipo de dato:
 *
 *   texto / número → Field + InputGroupInput         (estándar de pricing)
 *   selección fija → Select                          (embarques: ruta-dialog, formulario-alternativo)
 *   catálogo       → Combobox con búsqueda           (embarques: ruta-dialog, nueva-entidad-captura)
 *   fecha          → Popover + Calendar              (embarques: paso-confirmar-destino)
 *   fecha y hora   → Popover + Calendar + hora
 *   texto largo    → Textarea                        (embarques: formulario-alternativo, fechas)
 *   archivos       → zona de arrastre                (embarques: public/file-dropzone)
 *
 * Sin lógica de guardado: cada campo guarda su valor solo en estado local.
 * `soloLectura` deshabilita el control (ej. Información fuera de edición).
 * ========================================================================== */

type BaseCampo = {
  id: string;
  label: string;
  requerido?: boolean | undefined;
  soloLectura?: boolean | undefined;
  className?: string | undefined;
};

export type OpcionCampo = { value: string; label: string };

/** Etiqueta con asterisco de requerido (mismo estilo que formulario-alternativo). */
function Etiqueta({ id, label, requerido }: Pick<BaseCampo, "id" | "label" | "requerido">) {
  return (
    <FieldLabel htmlFor={id}>
      {label}
      {requerido ? <span className="ml-0.5 text-destructive">*</span> : null}
    </FieldLabel>
  );
}

/** Texto corto o número. */
export function CampoTexto({
  id,
  label,
  requerido,
  soloLectura,
  className,
  valor = "",
  tipo = "text",
}: BaseCampo & { valor?: string | undefined; tipo?: "text" | "number" | undefined }) {
  return (
    <Field className={cn(className)}>
      <Etiqueta id={id} label={label} requerido={requerido} />
      <InputGroup>
        <InputGroupInput
          id={id}
          type={tipo}
          defaultValue={valor}
          placeholder={label}
          readOnly={soloLectura}
        />
      </InputGroup>
    </Field>
  );
}

/** Texto largo (observaciones, detalle). */
export function CampoArea({ id, label, requerido, soloLectura, className }: BaseCampo) {
  return (
    <Field className={cn(className)}>
      <Etiqueta id={id} label={label} requerido={requerido} />
      <Textarea id={id} rows={2} placeholder={label} readOnly={soloLectura} className="resize-none" />
    </Field>
  );
}

/** Lista corta y fija de opciones. */
export function CampoSeleccion({
  id,
  label,
  requerido,
  soloLectura,
  className,
  opciones,
}: BaseCampo & { opciones: readonly string[] }) {
  const [valor, setValor] = useState("");
  return (
    <Field className={cn(className)}>
      <Etiqueta id={id} label={label} requerido={requerido} />
      <Select value={valor} onValueChange={setValor} disabled={soloLectura}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Seleccionar..." />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((opcion) => (
            <SelectItem key={opcion} value={opcion}>
              {opcion}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/**
 * Catálogo con búsqueda (proveedores, líneas aéreas, agentes, monedas...).
 * Sin catálogo conectado: solo muestra el valor actual, si lo hay.
 */
export function CampoCatalogo({
  id,
  label,
  requerido,
  soloLectura,
  className,
  valor = "",
  opciones,
}: BaseCampo & { valor?: string | undefined; opciones?: readonly OpcionCampo[] | undefined }) {
  const [seleccion, setSeleccion] = useState(valor);
  const lista = opciones ?? (valor ? [{ value: valor, label: valor }] : []);
  return (
    <Field className={cn(className)}>
      <Etiqueta id={id} label={label} requerido={requerido} />
      <Combobox
        clearable
        id={id}
        value={seleccion}
        onChange={(v: string) => setSeleccion(v)}
        options={lista}
        placeholder="Seleccionar..."
        searchPlaceholder={`Buscar ${label.toLowerCase()}...`}
        emptyMessage="Catálogo pendiente de conectar"
        disabled={soloLectura}
      />
    </Field>
  );
}

/** Fecha (y hora, con `conHora`) con el calendario del proyecto. */
export function CampoFecha({
  id,
  label,
  requerido,
  soloLectura,
  className,
  valor,
  conHora = false,
}: BaseCampo & { valor?: Date | undefined; conHora?: boolean | undefined }) {
  const [fecha, setFecha] = useState<Date | undefined>(valor);
  const [abierto, setAbierto] = useState(false);
  return (
    <Field className={cn(className)}>
      <Etiqueta id={id} label={label} requerido={requerido} />
      <div className="flex gap-2">
        <Popover open={abierto} onOpenChange={setAbierto}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={soloLectura}
              className={cn(
                "min-w-0 flex-1 justify-start text-left font-normal",
                !fecha && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 size-4" aria-hidden="true" />
              <span className="truncate">
                {fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar fecha"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={fecha}
              onSelect={(nueva: Date | undefined) => {
                setFecha(nueva);
                setAbierto(false);
              }}
            />
          </PopoverContent>
        </Popover>
        {conHora ? (
          <InputGroup className="w-28 shrink-0">
            <InputGroupInput
              type="time"
              aria-label={`${label} (hora)`}
              readOnly={soloLectura}
            />
          </InputGroup>
        ) : null}
      </div>
    </Field>
  );
}

/** Archivos: arrastrar o seleccionar (mismo patrón que `public/file-dropzone`). */
export function CampoArchivos({
  id,
  label,
  requerido,
  soloLectura,
  className,
  acepta,
}: BaseCampo & {
  /** Tipos aceptados (`accept` del input), ej. `"image/*"`. Sin valor: cualquiera. */
  acepta?: string | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [archivos, setArchivos] = useState<string[]>([]);

  const agregar = (lista: FileList | null | undefined) => {
    if (!lista?.length) return;
    setArchivos((previos) => [...previos, ...Array.from(lista, (archivo) => archivo.name)]);
  };

  return (
    <Field className={cn(className)}>
      <Etiqueta id={id} label={label} requerido={requerido} />
      <button
        id={id}
        type="button"
        disabled={soloLectura}
        className={cn(
          "flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-2 text-center transition-colors",
          arrastrando ? "border-primary bg-primary/5" : "border-input bg-muted/30",
          soloLectura ? "cursor-default opacity-60" : "cursor-pointer hover:border-primary",
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!soloLectura) setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          if (!soloLectura) agregar(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          {...(acepta ? { accept: acepta } : {})}
          className="hidden"
          onChange={(e) => {
            agregar(e.target.files);
            e.target.value = "";
          }}
        />
        <UploadCloud className="size-5 text-muted-foreground opacity-80" aria-hidden="true" />
        <span className="text-xs font-medium">
          {arrastrando ? "Suelta los archivos aquí..." : "Arrastra los archivos aquí o haz clic para seleccionar"}
        </span>
        {archivos.length > 0 ? (
          <span className="text-xs text-muted-foreground">{archivos.join(" · ")}</span>
        ) : null}
      </button>
    </Field>
  );
}
