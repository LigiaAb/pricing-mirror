"use client";

import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import React from "react";

import { useFetchEntidades } from "@/features/entidades";
import { DynamicIcon } from "@/shared/components/dynamic-icon";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Combobox, type ComboboxOption } from "@/shared/components/ui/combobox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import { Field, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { InputGroup, InputGroupInput } from "@/shared/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  popoverListClassName,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import type { FilaServicioMetodo, OptionEntidad } from "../api/types-api";
import { useCatalogosTarifas } from "../hooks/use-catalogos-tarifas";
import { useFormulario } from "../hooks/use-formulario-tarifas";
import { formatDateForInput } from "../lib/tarifa-helpers";

const TIPO_ENTIDAD_PROVEEDOR = "PROVEEDOR"; // "CARRIER";

const camposScale = [
  "empresa",
  "centroCosto",
  "fechaModificacion",
  "estado",
  "tipoServicio",
  "categoriaTransporte",
  "tipoCarga",
  "clasificacionCarga",
  "incoterm",
  "tipoPago",
  "tipoAplicacion",
  "servicioInterno",
  "metodoCalculo",
  "aplicaOrigenesDestinos",
  "aplicaCommodities",
  "aplicaTodosCientes",
  "tipoTarifa",
];

export type TarifaSubmitPayload = {
  values: Partial<FilaServicioMetodo>;
  servicio: Record<string, unknown>;
  metodo: Record<string, unknown>;
  anular?: boolean;
};

type Props = {
  tipoFormulario?: "ingreso" | "edicion" | "lectura" | "filtro";

  defaultValues?: Partial<FilaServicioMetodo>;

  inputsReadOnly?: string[];
  inputsToHide?: string[];
  groupsToHide?: string[];
  obligatorios?: string[];

  /*
   * Se mantiene para el formulario de filtros.
   */
  onSubmit?: (content: Partial<FilaServicioMetodo>) => void;

  /*
   * Este es el submit de ingreso/edición.
   */
  onGuardar?: (payload: TarifaSubmitPayload) => void | Promise<void>;

  onCopy?: (content: Partial<FilaServicioMetodo>) => void;

  guardando?: boolean;

  onClear?: () => void;
};

type SelectOption = {
  value?: string | number | null;
  label?: string | number | null;
};

type RemoteProveedorOption = {
  value: string;
  label: string;
  original: OptionEntidad;
};

function entidadAProveedor(entidadOrigen: object): OptionEntidad | null {
  const entidad = entidadOrigen as Record<string, unknown>;
  const entidadId = entidad.entidad_id;

  if (typeof entidadId !== "string" && typeof entidadId !== "number") {
    return null;
  }

  const nombre = String(entidad.label ?? "");
  const codigo = String(entidad.value ?? "");

  return {
    ...entidad,
    value: entidadId,
    label: [codigo, nombre].filter(Boolean).join(" - ") || String(entidadId),
  } as OptionEntidad;
}

function ProveedorRemoteSelect({
  id,
  value,
  options,
  search,
  onSearchChange,
  onChange,
  loading,
  readOnly,
  requerido,
  visible,
}: {
  id: string;
  value: OptionEntidad | null;
  options: OptionEntidad[];
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (value: OptionEntidad | null) => void;
  loading: boolean;
  readOnly: boolean;
  requerido: boolean;
  visible: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const remoteOptions = React.useMemo<RemoteProveedorOption[]>(() => {
    const termino = search.trim().toLocaleLowerCase();

    return options
      .filter((option) => option.value != null)
      .filter((option) =>
        termino
          ? String(option.label ?? "")
              .toLocaleLowerCase()
              .includes(termino)
          : true,
      )
      .slice(0, 100)
      .map((option) => ({
        value: String(option.value),
        label: String(option.label ?? ""),
        original: option,
      }));
  }, [options, search]);

  const selectedValue = value?.value == null ? null : String(value.value);

  return (
    <Field className={cn("flex flex-col", !visible && "hidden")}>
      <FieldLabel htmlFor={id}>
        Proveedor
        {requerido ? " *" : ""}
      </FieldLabel>

      <div className="relative">
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            if (!readOnly) setOpen(nextOpen);
          }}
        >
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
                value != null && !readOnly && "pr-16",
              )}
            >
              <span className="min-w-0 flex-1 truncate text-left">
                {value?.label ?? "Seleccione..."}
              </span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden="true" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className={cn(popoverListClassName, "z-[9999] p-0")}
            align="start"
            sideOffset={4}
          >
            <div className="border-b p-2">
              <div className="relative">
                <Input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Buscar proveedor..."
                  autoFocus
                />
                {loading ? (
                  <Loader2
                    className="absolute right-2 top-2.5 size-4 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </div>

            <Command shouldFilter={false}>
              <CommandList>
                <CommandEmpty>
                  {search.trim().length < 2
                    ? "Escriba al menos 2 caracteres."
                    : "No se encontraron proveedores."}
                </CommandEmpty>
                <CommandGroup>
                  {remoteOptions.map((option) => {
                    const selected = option.value === selectedValue;

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          onChange(option.original);
                          onSearchChange("");
                          setOpen(false);
                        }}
                      >
                        <span className="min-w-0 flex-1 wrap-anywhere">{option.label}</span>
                        <Check
                          className={cn(
                            "ml-auto size-4 text-primary",
                            selected ? "opacity-100" : "opacity-0",
                          )}
                          aria-hidden="true"
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {value != null && !readOnly ? (
          <button
            type="button"
            aria-label="Limpiar proveedor"
            title="Limpiar"
            className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-destructive"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onChange(null);
              onSearchChange("");
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </Field>
  );
}

export const FormularioTarifa = ({
  tipoFormulario = "ingreso",
  defaultValues,
  inputsReadOnly = [],
  inputsToHide = [],
  groupsToHide = [],
  obligatorios = [],
  onSubmit = () => {},
  onGuardar = () => {},
  onCopy = () => {},
  guardando = false,
  onClear,
}: Props) => {
  const { catalogos, isLoading: catalogosLoading } = useCatalogosTarifas({});

  const [busquedaProveedor, setBusquedaProveedor] = React.useState("");
  const [proveedoresAcumulados, setProveedoresAcumulados] = React.useState<OptionEntidad[]>([]);

  const proveedorDefaultId = defaultValues?.entidad_id ?? null;

  const proveedorPersistidoQuery = useFetchEntidades(
    {
      entidad_id: proveedorDefaultId == null ? 0 : Number(proveedorDefaultId),
      tipo_entidad: TIPO_ENTIDAD_PROVEEDOR,
    },
    {
      enabled: proveedorDefaultId != null,
    },
  );

  React.useEffect(() => {
    const persistidos = (proveedorPersistidoQuery.data ?? [])
      .map(entidadAProveedor)
      .filter((item): item is OptionEntidad => item != null);
    const precargados = catalogos.proveedores ?? [];
    const nuevos = [...precargados, ...persistidos];

    if (nuevos.length === 0) return;

    setProveedoresAcumulados((prev) => {
      const indice = new Map<string, OptionEntidad>();

      prev.forEach((item) => {
        if (item.value != null) indice.set(String(item.value), item);
      });

      let huboCambios = false;

      nuevos.forEach((item) => {
        if (item.value == null) return;

        const key = String(item.value);

        if (!indice.has(key)) {
          indice.set(key, item);
          huboCambios = true;
        }
      });

      return huboCambios ? [...indice.values()] : prev;
    });
  }, [catalogos.proveedores, proveedorPersistidoQuery.data]);

  const proveedores = proveedoresAcumulados;

  const catalogosFormulario = React.useMemo(
    () => ({
      ...catalogos,
      proveedores,
    }),
    [catalogos, proveedores],
  );

  const vencido = React.useMemo(() => {
    const fechaFin = defaultValues?.fechaFin as Date | string | null | undefined;

    if (!fechaFin) return false;

    const fechaFinDate = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);

    return fechaFinDate < new Date();
  }, [defaultValues?.fechaFin]);

  const {
    values,
    valoresSoloCodigos,
    onInput,
    verificarSiEsLectura,
    verificarSiEsVisible,
    verificarSiGrupoEsVisible,
    verificarSiEsObligatorio,
    obtenerCatalogoById,
  } = useFormulario({
    tipoFormulario: vencido ? "lectura" : tipoFormulario,

    ...(defaultValues === undefined ? {} : { defaultValues }),

    ...(catalogosFormulario === undefined
      ? {}
      : {
          catalogosProcesados: catalogosFormulario,
        }),

    inputsReadOnly,
    inputsToHide,
    inputsReadOnlyScale: camposScale,
    groupsToHide,
    obligatorios,
    isLoading: catalogosLoading,
    validarSiTieneMetodoDeCalculo: true,
  });

  const groupclassess = React.useMemo(
    () => cn("grid grid-cols-2 gap-2 border px-5 pb-5 rounded-lg overflow-auto"),
    [],
  );

  const formId = React.useId();

  const generarId = React.useCallback(
    (id: string) => `${tipoFormulario}-${formId}-${id}`,
    [tipoFormulario, formId],
  );

  // Función de render (no componente): definida dentro de FormularioTarifa,
  // como componente React la remontaría en cada render y perdería el foco.
  function renderSelectCatalogo<T extends SelectOption>({
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
    const esObligatorio = verificarSiEsObligatorio(id);
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
            placeholder="Seleccione..."
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

  const renderizarDate = ({
    id,
    label,
    className,
  }: {
    id: string;
    label: string;
    className?: string;
  }) => {
    const idGenerado = generarId(id);

    return (
      <Field className={cn(className, !verificarSiEsVisible(id) && "hidden")}>
        <FieldLabel htmlFor={idGenerado}>
          {label}

          {verificarSiEsObligatorio(id) && " *"}
        </FieldLabel>

        <InputGroup>
          <InputGroupInput
            readOnly={verificarSiEsLectura(id)}
            disabled={verificarSiEsLectura(id)}
            onChange={(event) =>
              onInput({
                id,
                val: event.target?.valueAsDate,
              })
            }
            id={idGenerado}
            type="date"
            value={formatDateForInput(values[id] as Date | string | null | undefined)}
          />
        </InputGroup>
      </Field>
    );
  };

  const renderizarText = ({
    id,
    label,
    className,
  }: {
    id: string;
    label: string;
    className?: string;
  }) => {
    const idGenerado = generarId(id);

    return (
      <Field className={cn(className, !verificarSiEsVisible(id) && "hidden")}>
        <FieldLabel htmlFor={idGenerado}>
          {label}

          {verificarSiEsObligatorio(id) && " *"}
        </FieldLabel>

        <InputGroup>
          <InputGroupInput
            readOnly={verificarSiEsLectura(id)}
            disabled={verificarSiEsLectura(id)}
            onChange={(event) =>
              onInput({
                id,
                val: event.target.value,
              })
            }
            id={idGenerado}
            type="text"
            value={(values[id] as string | number | readonly string[] | undefined) ?? ""}
          />
        </InputGroup>
      </Field>
    );
  };

  const renderizarChebox = ({
    id,
    label,
    className,
  }: {
    id: string;
    label: string;
    className?: string;
  }) => {
    const idGenerado = generarId(id);

    return (
      <Field
        orientation="horizontal"
        className={cn(className, !verificarSiEsVisible(id) && "hidden")}
      >
        <Checkbox
          id={idGenerado}
          name={id}
          checked={Boolean(values[id])}
          disabled={verificarSiEsLectura(id)}
          onCheckedChange={(checked) =>
            onInput({
              id,
              val: checked === true,
            })
          }
        />

        <FieldLabel htmlFor={idGenerado}>
          {label}

          {verificarSiEsObligatorio(id) && " *"}
        </FieldLabel>
      </Field>
    );
  };

  const handleSubmit = React.useCallback(async () => {
    /*
     * El filtro sigue funcionando como antes:
     * devuelve únicamente el payload de servicio.
     */
    if (tipoFormulario === "filtro") {
      onSubmit(valoresSoloCodigos("servicio") as Partial<FilaServicioMetodo>);

      return;
    }

    if (tipoFormulario === "lectura" && !values.fechaFin) {
      return;
    }

    await onGuardar({
      values: values as Partial<FilaServicioMetodo>,

      servicio: valoresSoloCodigos("servicio"),

      metodo: valoresSoloCodigos("metodo"),
    });
  }, [tipoFormulario, onSubmit, onGuardar, valoresSoloCodigos, values]);

  // const handleLimpiar = React.useCallback(() => {
  //   // handleClearForm();
  // }, []);

  return (
    <div className="space-y-4 w-full">
      <div
        className={cn(
          tipoFormulario === "filtro" ? "grid-cols-1" : "md:grid-cols-2 grid-cols-1",
          "grid gap-1",
        )}
      >
        {/* <FieldGroup
          className={cn(groupclassess, !verificarSiGrupoEsVisible("auditoria") && "hidden")}
        >
          <p className="col-span-2 text-center">AUDITORÍA</p>

          {renderSelectCatalogo({
            id: "empresa",
            label: "Empresa",
            options: catalogos?.empresas ?? [],
          })}

          {renderSelectCatalogo({
            id: "centroCosto",
            label: "Centro de Costo",
            options: catalogos?.centrosCosto ?? [],
          })}

          {renderizarDate({
            id: "fechaModificacion",
            label: "Fecha de Modificación",
          })}

          {renderizarText({
            id: "usuario",
            label: "Usuario",
          })}
        </FieldGroup> */}

        <FieldGroup
          className={cn(groupclassess, !verificarSiGrupoEsVisible("transporte") && "hidden")}
        >
          <p className="col-span-2 text-center">TRANSPORTE</p>

          {renderSelectCatalogo({
            id: "tipoTransporte",
            label: "Tipo de Transporte",
            options: catalogos?.tiposTransporte ?? [],
          })}

          {renderSelectCatalogo({
            id: "tipoServicio",
            label: "Tipo de Servicio",
            options: catalogos?.tiposServicio ?? [],
          })}

          {renderSelectCatalogo({
            id: "tipoClasificacion",
            label: "Clasificacion",
            options: catalogos?.tiposClasificacionServicio ?? [],
          })}

          {renderSelectCatalogo({
            id: "categoriaTransporte",
            label: "Categoria de Transporte",
            options: catalogos?.categoriasTransporte ?? [],
          })}

          {renderizarChebox({
            id: "obligatorio",
            label: "SELECCION AUTOMATICA EN COTIZACION",
          })}
        </FieldGroup>

        <FieldGroup
          className={cn(groupclassess, !verificarSiGrupoEsVisible("servicio") && "hidden")}
        >
          <p className="col-span-2 text-center">SERVICIO</p>

          {renderSelectCatalogo({ id: "rubro", label: "Rubro", options: catalogos?.rubros ?? [] })}

          <ProveedorRemoteSelect
            id={generarId("proveedor")}
            value={(values.proveedor as OptionEntidad | null | undefined) ?? null}
            options={proveedores}
            search={busquedaProveedor}
            onSearchChange={setBusquedaProveedor}
            onChange={(value) => onInput({ id: "proveedor", val: value })}
            loading={catalogosLoading || proveedorPersistidoQuery.isFetching}
            readOnly={verificarSiEsLectura("proveedor")}
            requerido={verificarSiEsObligatorio("proveedor")}
            visible={verificarSiEsVisible("proveedor")}
          />

          {renderizarText({
            id: "nombre",
            label: "Servicio",
          })}

          {renderizarText({
            id: "siglas",
            label: "Siglas",
          })}
        </FieldGroup>

        <FieldGroup className={cn(groupclassess, !verificarSiGrupoEsVisible("carga") && "hidden")}>
          <p className="col-span-2 text-center">CARGA</p>

          {renderSelectCatalogo({
            id: "tipoCarga",
            label: "Tipo de Carga",
            options: catalogos?.tiposCarga ?? [],
          })}

          {renderSelectCatalogo({
            id: "clasificacionCarga",
            label: "Clasificacion de carga",
            options: catalogos?.clasificacionesCarga ?? [],
          })}

          {renderSelectCatalogo({
            id: "incoterm",
            label: "Incoterms",
            options: catalogos?.incoterms ?? [],
          })}

          {renderSelectCatalogo({
            id: "tipoPago",
            label: "Tipo de Pago",
            options: catalogos?.tiposPago ?? [],
          })}
        </FieldGroup>

        <FieldGroup
          className={cn(groupclassess, !verificarSiGrupoEsVisible("calculo") && "hidden")}
        >
          <p className="col-span-2 text-center">CÁLCULO</p>

          {renderSelectCatalogo({
            id: "tipoAplicacion",
            label: "Clasificacion de aplicacion",
            options: catalogos?.tiposAplicacion ?? [],
          })}

          {renderSelectCatalogo({
            id: "tipoCalculo",
            label: "Tipo de Cálculo",
            options: catalogos?.tiposCalculo ?? [],
          })}

          {renderSelectCatalogo({
            id: "metodoCalculo",
            label: "Metodo de Cálculo",
            options: catalogos?.metodosCalculo ?? [],
          })}
        </FieldGroup>

        <FieldGroup
          className={cn(groupclassess, !verificarSiGrupoEsVisible("alcance") && "hidden")}
        >
          <p className="col-span-2 text-center">ALCANCE</p>

          {renderizarChebox({
            id: "aplicaOrigenesDestinos",
            label: "APLICA A TODOS LOS ORÍGENES Y DESTINOS",
          })}

          {renderizarChebox({
            id: "aplicaCommodities",
            label: "APLICA A TODOS LOS COMMODITIES",
          })}

          {renderSelectCatalogo({
            id: "tipoTarifa",
            label: "Tipo de tarifa",
            options: catalogos?.tiposTarifa ?? [],
          })}
        </FieldGroup>

        <FieldGroup
          className={cn(groupclassess, !verificarSiGrupoEsVisible("vigencia") && "hidden")}
        >
          <p className="col-span-2 text-center">VIGENCIA</p>

          {renderizarDate({
            id: "fechaInicio",
            label: "Fecha de Inicio",
          })}

          {renderizarDate({
            id: "fechaFin",
            label: "Fecha de Vencimiento",
          })}
        </FieldGroup>
      </div>
      {["lectura", "edicion"].includes(tipoFormulario) &&
        !defaultValues?.fecha_final &&
        !!values?.fechaFin && (
          <div className="flex flex-row space-x-3 justify-end">
            <Button
              type="button"
              disabled={guardando}
              onClick={() => {
                void handleSubmit();
              }}
            >
              <DynamicIcon name="save" />
              Actualizar
            </Button>
          </div>
        )}
      {(tipoFormulario !== "lectura" || defaultValues?.fecha_final) && (
        <div className="flex flex-row space-x-3 justify-end">
          {tipoFormulario !== "lectura" && (
            <Button
              type="button"
              disabled={guardando}
              className={cn(tipoFormulario === "filtro" && "w-full")}
              onClick={() => {
                void handleSubmit();
              }}
            >
              {tipoFormulario === "filtro" ? (
                <DynamicIcon name="search" />
              ) : tipoFormulario === "edicion" ? (
                <DynamicIcon name="edit" />
              ) : (
                <DynamicIcon name="save" />
              )}

              {tipoFormulario === "filtro"
                ? "Filtrar"
                : tipoFormulario === "edicion"
                  ? "Actualizar"
                  : "Guardar"}
            </Button>
          )}
          {tipoFormulario === "filtro" && (
            <Button
              type="button"
              disabled={guardando}
              className={cn(tipoFormulario === "filtro" && "w-full")}
              onClick={() => {
                onClear?.();
              }}
            >
              <DynamicIcon name="trash" />
              Limpiar
            </Button>
          )}
          {(defaultValues?.fecha_final ?? null) && (
            <Button
              type="button"
              variant="secondary"
              disabled={guardando}
              onClick={() =>
                onCopy({
                  ...defaultValues,
                  ...values,
                } as Partial<FilaServicioMetodo>)
              }
            >
              <DynamicIcon name="copy" />
              Copiar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
