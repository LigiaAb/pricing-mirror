"use client";

import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import * as React from "react";

import { NuevoContactoEntidad } from "@/features/entidades";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import type { FieldOption } from "@/shared/components/form/types";
import { Button } from "@/shared/components/ui/button";
import { Combobox, type ComboboxOption } from "@/shared/components/ui/combobox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupInput } from "@/shared/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  popoverListClassName,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import type { CotizacionCabeceraPayload } from "../api/cotizacion-cabecera";
import {
  type CatalogosFormularioCotizacion,
  type OpcionFormularioCotizacion,
  type TipoFormularioCotizacion,
  useFormularioCotizacion,
} from "../hooks/use-formulario-cotizacion";

import { useCatalogosCotizacionOpcional } from "../hooks/use-catalogos-cotizacion";
import { etiquetaCampo } from "../lib/cabecera";
import type { Id } from "../lib/tipos";
import { Grupo } from "./utils";

type ClienteContexto = {
  entidad_id: Id;
  cod_emp: Id;
  cod_cc: Id;
};

type SelectOption = {
  value?: string | number | null;
  label?: string | number | null;
};

type Props = {
  tipoFormulario?: TipoFormularioCotizacion;

  defaultValues?: CotizacionCabeceraPayload;
  catalogos?: CatalogosFormularioCotizacion;

  resetKey?: string | number;

  inputsToHide?: readonly string[];
  groupsToHide?: readonly string[];
  inputsReadOnly?: readonly string[];
  inputsNoObligatorios?: readonly string[];

  currentEmpresaId?: Id | null;
  currentCentroCostoId?: Id | null;
  currentPaisId?: Id | null;

  codUsuario?: Id | null;
  codEstadoActivo: Id;

  isSubmitting?: boolean;

  onSubmit?: (
    payload: CotizacionCabeceraPayload,
    valoresFormulario: CotizacionCabeceraPayload,
  ) => void | Promise<void>;

  onClear?: () => void | Promise<void>;

  onValidezChange?: (esValido: boolean) => void;

  onClienteContextoChange?: (contexto: ClienteContexto | null) => void;

  /**
   * El legado permite crear un PRE-CLIENTE desde el formulario.
   *
   * Todavía no existe un componente Next confirmado para esa operación,
   * por eso el formulario expone el punto de integración sin inventarlo.
   */
  onCrearPreCliente?: () => void;

  onCamposFaltantesChange?: (camposFaltantes: string[]) => void;
};

type RemoteOption = {
  value: string;
  label: string;
  original: OpcionFormularioCotizacion;
};

function formatDateForInput(value: unknown) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0] ?? "";
}

function obtenerOpcion(value: unknown): OpcionFormularioCotizacion | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (!("value" in value) || !("label" in value)) {
    return null;
  }

  return value as OpcionFormularioCotizacion;
}

function AsyncSelectCatalogo({
  id,
  label,
  value,
  options,
  readOnly,
  requerido,
  visible,
  onChange,
  className,
}: {
  id: string;
  label: string;
  value: OpcionFormularioCotizacion | null;
  options: OpcionFormularioCotizacion[];
  readOnly: boolean;
  requerido: boolean;
  visible: boolean;
  onChange: (value: OpcionFormularioCotizacion | null) => void;
  className?: string;
}) {
  return (
    <Field className={cn("flex flex-col", className, !visible && "hidden")}>
      <FieldLabel htmlFor={id}>
        {label}
        {requerido ? " *" : ""}
      </FieldLabel>

      <AsyncComboboxInput<OpcionFormularioCotizacion>
        id={id}
        label={label}
        contentClassName="z-[9999]"
        initialOptions={options}
        value={value}
        onChange={onChange}
        fetchOptions={() => Promise.resolve(options)}
        getOptionValue={(option) => option.value}
        getOptionLabel={(option) => String(option.label ?? "")}
        placeholder="Seleccione..."
        searchPlaceholder="Buscar..."
        minSearchLength={1}
        fetchOnEmpty={false}
        clearable
        readOnly={readOnly}
      />
    </Field>
  );
}

function RemoteEntitySelect({
  id,
  label,
  value,
  options,
  search,
  onSearchChange,
  onChange,
  readOnly,
  requerido,
  visible,
  extraAction,
}: {
  id: string;
  label: string;
  value: OpcionFormularioCotizacion | null;
  options: OpcionFormularioCotizacion[];
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (value: OpcionFormularioCotizacion | null) => void;
  loading: boolean;
  readOnly: boolean;
  requerido: boolean;
  visible: boolean;
  extraAction?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const remoteOptions = React.useMemo<RemoteOption[]>(
    () =>
      options
        .map((option) => ({
          value: String(option.value),
          label: String(option.label ?? ""),
          original: option,
        }))
        .reduce((acc, option) => {
          if (!acc.some((o) => o.value === option.value)) {
            acc.push(option);
          }

          return acc;
        }, [] as RemoteOption[]),
    [options],
  );

  return (
    <Field className={cn("flex flex-col", !visible && "hidden")}>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>
          {label}
          {requerido ? " *" : ""}
        </FieldLabel>

        {extraAction}
      </div>

      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!readOnly) {
            setOpen(next);
          }
        }}
      >
        <div className="relative w-full">
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={readOnly}
              className={cn(
                "h-9 w-full justify-between font-normal",
                value == null && "text-muted-foreground",
              )}
            >
              <span className="min-w-0 flex-1 truncate text-left">
                {value?.label ?? "Seleccione..."}
              </span>

              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          {value && (
            <button
              type="button"
              aria-label="Limpiar selección"
              tabIndex={-1}
              onClick={() => onChange(null)}
              className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-sm hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <PopoverContent
          className={cn(popoverListClassName, "p-0 z-[9999]")}
          align="start"
          sideOffset={4}
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={onSearchChange}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              className="h-9"
            />

            <CommandList>
              <CommandEmpty>{search ? "Sin resultados" : "Seleccione..."}</CommandEmpty>

              <CommandGroup>
                {remoteOptions.map((option) => {
                  const value = option.original;
                  const optionValue = String(option.value);
                  const selected = value !== null && value.value === optionValue;
                  const description = value?.description as string | undefined;

                  return (
                    <CommandItem
                      key={optionValue}
                      value={optionValue}
                      onSelect={() => {
                        onChange(value);
                        setOpen(false);
                      }}
                      className="items-start"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="wrap-anywhere">{option.label}</p>

                        {description && (
                          <p className="wrap-anywhere text-xs text-muted-foreground">
                            {description ?? ""}
                          </p>
                        )}
                      </div>

                      <Check
                        className={cn(
                          "ml-auto mt-0.5 size-4 shrink-0 text-primary",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
}
const EMPTY_FIELDS: readonly string[] = [];
const DEFAULT_READ_ONLY_FIELDS: readonly string[] = ["fecha"];
const EMPTY_CATALOGOS: CatalogosFormularioCotizacion = {};

export function CotizacionForm({
  tipoFormulario = "lectura",
  defaultValues,
  catalogos: catalogosProp,
  resetKey = 0,

  inputsToHide = EMPTY_FIELDS,
  groupsToHide = EMPTY_FIELDS,
  inputsReadOnly = DEFAULT_READ_ONLY_FIELDS,
  inputsNoObligatorios = EMPTY_FIELDS,

  currentEmpresaId,
  currentCentroCostoId,
  currentPaisId,

  codUsuario,
  codEstadoActivo,

  isSubmitting = false,

  onSubmit,
  onValidezChange,
  onClienteContextoChange,
  onCrearPreCliente,
  onCamposFaltantesChange,
  onClear,
}: Props) {
  /*
   * Si la pantalla pasa `catalogos` por prop (Autorización Spot, Plantillas),
   * se usan esos. Dentro de Gestión de Cotizaciones vienen del provider.
   */
  const catalogosContexto = useCatalogosCotizacionOpcional();
  const catalogos = catalogosProp ?? catalogosContexto?.formulario ?? EMPTY_CATALOGOS;

  const controller = useFormularioCotizacion({
    tipoFormulario,
    ...(defaultValues === undefined ? {} : { defaultValues }),
    catalogos,
    resetKey,
    inputsToHide,
    groupsToHide,
    inputsReadOnly,
    inputsNoObligatorios,
    currentEmpresaId: currentEmpresaId ?? null,
    currentCentroCostoId: currentCentroCostoId ?? null,
    currentPaisId: currentPaisId ?? null,
    codUsuario: codUsuario ?? null,
    codEstadoActivo,
    ...(onValidezChange === undefined ? {} : { onValidezChange }),
    ...(onClienteContextoChange === undefined ? {} : { onClienteContextoChange }),
  });

  const {
    values,
    valoresSoloCodigos,
    onInput,

    clientesEncontrados,
    fetchClientes,
    clienteSeleccionado,

    busquedaEstacion,
    setBusquedaEstacion,
    estacionesEncontradas,
    isLoadingEstaciones,

    contactos,
    refetchContactos,

    obtenerCatalogoById,

    verificarSiEsLectura,
    verificarSiEsVisible,
    verificarSiGrupoEsVisible,
    verificarSiEsRequerido,
  } = controller;

  const [contactoDialogOpen, setContactoDialogOpen] = React.useState(false);

  const tipoTransporte = obtenerOpcion(values.tipoTransporte);

  const formId = React.useId();

  const generarId = React.useCallback(
    (id: string) => `${tipoFormulario}-${formId}-${id}`,
    [tipoFormulario, formId],
  );

  function renderSelect_<T extends SelectOption>({
    id,
    label,
    options,
    className,
  }: {
    id: string;
    label: string;
    options?: T[];
    className?: string;
  }) {
    const idGenerado = generarId(id);
    const opcionesDisponibles = Array.from(obtenerCatalogoById(id, values)) as T[];
    const opciones = opcionesDisponibles ?? options ?? [];
    const esObligatorio = verificarSiEsRequerido(id);
    const esLectura = verificarSiEsLectura(id);
    const visible = verificarSiEsVisible(id);
    const value = (values[id] as T | null | undefined) ?? null;
    const valorSeleccionado = value?.value == null ? "__NULL_OPTION__" : String(value.value);
    const opcionesCombobox: ComboboxOption[] = opciones.map((option) => ({
      value: option.value == null ? "__NULL_OPTION__" : String(option.value),
      label: String(option.label ?? ""),
    }));

    return (
      <Field className={cn("flex flex-col", className, !visible && "hidden")}>
        <FieldLabel htmlFor={idGenerado}>
          {label}
          {esObligatorio ? " *" : ""}
        </FieldLabel>

        <div className="relative">
          <Combobox
            value={value == null ? "" : valorSeleccionado}
            onChange={(nextValue) => {
              const nextOption =
                opciones.find(
                  (option) =>
                    (option.value == null ? "__NULL_OPTION__" : String(option.value)) === nextValue,
                ) ?? null;

              onInput({ id, val: nextOption });
            }}
            options={opcionesCombobox}
            ariaLabel={label}
            placeholder="Seleccione..."
            searchPlaceholder="Buscar..."
            disabled={esLectura}
            className={value != null && !esLectura ? "pr-16" : ""}
            popoverClassName="z-[9999]"
          />

          {value != null && !esLectura ? (
            <button
              type="button"
              aria-label={`Limpiar ${label}`}
              title="Limpiar"
              className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-destructive"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onInput({ id, val: null });
              }}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </Field>
    );
  }

  /** Select de un campo de la cabecera. La etiqueta y el catálogo salen de lib/cabecera.ts. */
  const renderSelect = (id: string, className = "") =>
    renderSelect_({ id, label: etiquetaCampo(id), className });

  /** Input de texto de un campo de la cabecera. La etiqueta sale de lib/cabecera.ts. */
  const renderText = React.useCallback(
    (id: string, className?: string) => (
      <Field className={cn(className, !verificarSiEsVisible(id) && "hidden")}>
        <FieldLabel htmlFor={generarId(id)}>
          {etiquetaCampo(id)}
          {verificarSiEsRequerido(id) ? " *" : ""}
        </FieldLabel>

        <InputGroup>
          <InputGroupInput
            id={generarId(id)}
            type="text"
            value={
              typeof values[id] === "string" || typeof values[id] === "number" ? values[id] : ""
            }
            disabled={verificarSiEsLectura(id)}
            readOnly={verificarSiEsLectura(id)}
            onChange={(event) =>
              onInput({
                id,
                val: event.target.value,
              })
            }
          />
        </InputGroup>
      </Field>
    ),
    [
      generarId,
      onInput,
      values,
      verificarSiEsLectura,
      verificarSiEsRequerido,
      verificarSiEsVisible,
    ],
  );

  const fechaId = generarId("fecha");

  const clienteId = Number(clienteSeleccionado?.value);
  const clienteIdValido = Number.isSafeInteger(clienteId) && clienteId > 0;

  const textoBoton =
    tipoFormulario === "filtro"
      ? "Filtrar"
      : tipoFormulario === "edicion"
        ? "Actualizar"
        : "Guardar";

  const puedeEnviar = tipoFormulario !== "lectura" && typeof onSubmit === "function";

  const camposFaltantesAnterioresRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    if (!onCamposFaltantesChange) return;

    const actuales = controller.camposFaltantes;
    const anteriores = camposFaltantesAnterioresRef.current;

    const sonIguales =
      actuales.length === anteriores.length &&
      actuales.every((campo, index) => campo === anteriores[index]);

    if (sonIguales) return;

    camposFaltantesAnterioresRef.current = actuales;
    onCamposFaltantesChange(actuales);
  }, [controller.camposFaltantes, onCamposFaltantesChange]);

  return (
    <>
      <div className="space-y-4">
        <div
          className={cn(
            "grid gap-3",
            tipoFormulario === "filtro" ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2",
          )}
        >
          <Grupo id="datos" titulo="Datos" visible={verificarSiGrupoEsVisible("datos")}>
            <Field className={cn(!verificarSiEsVisible("fecha") && "hidden")}>
              <FieldLabel htmlFor={fechaId}>
                {etiquetaCampo("fecha")}
                {verificarSiEsRequerido("fecha") ? " *" : ""}
              </FieldLabel>

              <InputGroup>
                <InputGroupInput
                  id={fechaId}
                  type="date"
                  value={formatDateForInput(values.fecha)}
                  disabled={verificarSiEsLectura("fecha")}
                  readOnly={verificarSiEsLectura("fecha")}
                  onChange={(event) =>
                    onInput({
                      id: "fecha",
                      val: event.target.valueAsDate,
                    })
                  }
                />
              </InputGroup>
            </Field>

            {renderSelect("empresa")}

            {renderSelect("centroCosto")}

            {renderText("descripcion", "md:col-span-2")}

            <Field className={cn("flex flex-col", !verificarSiEsVisible("cliente") && "hidden")}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor={generarId("cliente")}>
                  {etiquetaCampo("cliente")}
                  {verificarSiEsRequerido("cliente") ? " *" : ""}
                </FieldLabel>
                {onCrearPreCliente && !verificarSiEsLectura("cliente") ? (
                  <Button type="button" size="sm" variant="ghost" onClick={onCrearPreCliente}>
                    <Plus className="size-4" aria-hidden="true" />
                    Precliente
                  </Button>
                ) : null}
              </div>
              <AsyncComboboxInput<OpcionFormularioCotizacion>
                id={generarId("cliente")}
                label={etiquetaCampo("cliente")}
                contentClassName="z-[9999]"
                value={obtenerOpcion(values.cliente)}
                onChange={(value) => onInput({ id: "cliente", val: value })}
                initialOptions={clientesEncontrados}
                fetchOptions={fetchClientes}
                minSearchLength={3}
                fetchOnEmpty={false}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => String(option.label ?? "")}
                placeholder="Seleccione..."
                searchPlaceholder="Buscar cliente..."
                clearable
                readOnly={verificarSiEsLectura("cliente")}
              />
            </Field>

            <AsyncSelectCatalogo
              id={generarId("contacto")}
              label={etiquetaCampo("contacto")}
              value={obtenerOpcion(values.contacto)}
              options={contactos}
              readOnly={verificarSiEsLectura("contacto")}
              requerido={verificarSiEsRequerido("contacto")}
              visible={verificarSiEsVisible("contacto")}
              onChange={(value) => onInput({ id: "contacto", val: value })}
              className="relative"
            />

            {clienteIdValido &&
            !verificarSiEsLectura("contacto") &&
            verificarSiEsVisible("contacto") ? (
              <div className="col-span-full flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setContactoDialogOpen(true)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Crear contacto
                </Button>
              </div>
            ) : null}

            {renderSelect("carrier")}
          </Grupo>

          <Grupo
            id="transporte"
            titulo="Transporte"
            visible={verificarSiGrupoEsVisible("transporte")}
          >
            {renderSelect("tipoTransporte")}
            {renderSelect("tipoServicio")}
          </Grupo>

          <Grupo id="carga" titulo="Carga" visible={verificarSiGrupoEsVisible("carga")}>
            {renderSelect("tipoCarga")}

            {renderSelect("clasificacionCarga")}
          </Grupo>

          <Grupo
            id="terminosComercio"
            titulo="Términos de comercio"
            visible={verificarSiGrupoEsVisible("terminosComercio")}
          >
            {renderSelect("incoterm")}

            {renderSelect("tipoPago")}

            <RemoteEntitySelect
              id={generarId("estacion")}
              label={etiquetaCampo("estacion")}
              value={obtenerOpcion(values.estacion)}
              options={estacionesEncontradas}
              search={busquedaEstacion}
              onSearchChange={setBusquedaEstacion}
              onChange={(value) => onInput({ id: "estacion", val: value })}
              loading={isLoadingEstaciones}
              readOnly={verificarSiEsLectura("estacion")}
              requerido={verificarSiEsRequerido("estacion")}
              visible={verificarSiEsVisible("estacion")}
            />

            {renderText("contacto_estacion")}
          </Grupo>

          <Grupo id="origen" titulo="Origen" visible={verificarSiGrupoEsVisible("origen")}>
            {renderSelect("paisOrigen")}

            {tipoTransporte?.nomTipo !== "TERRESTRE" &&
              renderSelect("tipoPuntoEnlaceOrigen")}

            {tipoTransporte?.nomTipo !== "TERRESTRE" &&
              renderSelect("puntoEnlaceOrigen", "md:col-span-2")}

            {tipoTransporte?.nomTipo === "TERRESTRE" &&
              renderSelect("ciudadOrigen")}

            {tipoTransporte?.nomTipo === "TERRESTRE" &&
              renderText("direccion_origen", "md:col-span-2")}
          </Grupo>

          <Grupo id="destino" titulo="Destino" visible={verificarSiGrupoEsVisible("destino")}>
            {renderSelect("paisDestino")}

            {tipoTransporte?.nomTipo !== "TERRESTRE" &&
              renderSelect("tipoPuntoEnlaceDestino")}

            {tipoTransporte?.nomTipo !== "TERRESTRE" &&
              renderSelect("puntoEnlaceDestino", "md:col-span-2")}

            {tipoTransporte?.nomTipo === "TERRESTRE" &&
              renderSelect("ciudadDestino")}

            {tipoTransporte?.nomTipo === "TERRESTRE" &&
              renderText("direccion_destino", "md:col-span-2")}
          </Grupo>
        </div>

        <div className="flex justify-end">
          {puedeEnviar ? (
            <Button
              type="button"
              className={cn(tipoFormulario === "filtro" && "w-1/2")}
              disabled={isSubmitting}
              onClick={() => {
                void onSubmit?.(valoresSoloCodigos, values);
              }}
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}

              {textoBoton}
            </Button>
          ) : null}
          {puedeEnviar && tipoFormulario === "filtro" ? (
            <Button
              type="button"
              variant="destructive"
              className={cn(tipoFormulario === "filtro" && "w-1/2")}
              onClick={() => {
                void onClear?.();
              }}
            >
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={contactoDialogOpen} onOpenChange={setContactoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear contacto</DialogTitle>
          </DialogHeader>

          {contactoDialogOpen && clienteIdValido ? (
            <NuevoContactoEntidad
              entidadId={clienteId}
              onSubmit={async () => {
                await refetchContactos();
                setContactoDialogOpen(false);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
