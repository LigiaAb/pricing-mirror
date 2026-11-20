"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AlertTriangle, UserLock, UserRoundPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  centrosCosto,
  configuracionActividades,
  empleadosUsuarios,
  empresas,
  tipos,
} from "@/features/catalogos";
import { TIPO_ENTIDAD } from "@/features/embarques/lib/constantes";
import {
  NuevoContactoEntidad,
  useBusquedaEntidadCriterio,
  useFetchEntidadContacto,
} from "@/features/entidades";
import type { EntidadCriterioResultado } from "@/features/entidades/api/use-busqueda-entidad-criterio";
import { NuevaEntidad } from "@/features/entidades/components/nueva-entidad";
import { useContextoOperativoStore, usePermisosCategoria } from "@/features/shell";
import { leerIdDeMutacion } from "@/shared/api/respuesta-mutacion";
import { AsyncComboboxInput } from "@/shared/components/form/fields/async-combobox-input";
import type { FieldOption } from "@/shared/components/form/types";
import { Alert } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Combobox } from "@/shared/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Loader } from "@/shared/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
// import { deInputDateTimeLocal } from "@/shared/lib/date";
import { encodeId } from "@/shared/lib/sqids";
import { useAuthStore } from "@/shared/stores/auth-store";
import { actividades } from "../../api/actividades";
import { iconoActividad } from "../../lib/actividad-iconos";
import { estadoInicialActividad, fechaActividadValida } from "../../lib/actividad-reglas";

const actividadFormSchema = z.object({
  cod_emp: z.string().min(1, "Seleccione una empresa"),
  cod_cc: z.string().min(1, "Seleccione un centro de costo"),
  cod_asesor: z.string().min(1, "Seleccione un asesor"),
  cod_tipo: z.string().min(1, "Seleccione un tipo"),
  cod_objetivo_actividad: z.string().min(1, "Seleccione un objetivo"),
  fecha_programada: z.string().min(1, "Ingrese la fecha programada"),
  descripcion: z.string().trim().min(1, "Ingrese una descripción"),
  cod_cliente: z.string(),
  cod_contacto: z.string(),
});

type ActividadFormValues = z.infer<typeof actividadFormSchema>;

function CampoError({ mensaje }: Readonly<{ mensaje?: string | undefined }>) {
  return mensaje ? <p className="text-xs text-destructive">{mensaje}</p> : null;
}

const defaultDateTime = format(new Date(), "yyyy-MM-dd'T'00:00");

export function ActividadForm() {
  const router = useRouter();
  const permisos = usePermisosCategoria("Información");
  const centroCostoActual = useContextoOperativoStore((state) => state.currentCentroCosto);
  const empresaActual = useContextoOperativoStore((state) => state.currentEmpresa);
  const usuario = useAuthStore((state) => state.user);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [codTipoCliente, setCodTipoCliente] = useState<number>(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteModalAbierto, setClienteModalAbierto] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<EntidadCriterioResultado | null>(
    null,
  );
  const form = useForm<ActividadFormValues>({
    resolver: zodResolver(actividadFormSchema),
    defaultValues: {
      cod_emp: empresaActual ? String(empresaActual.cod_empresa) : "",
      cod_cc: centroCostoActual ? String(centroCostoActual.cod_cc) : "",
      cod_asesor: usuario?.cod_usuario ? String(usuario.cod_usuario) : "",
      cod_tipo: "",
      cod_objetivo_actividad: "",
      fecha_programada: defaultDateTime,
      descripcion: "",
      cod_cliente: "",
      cod_contacto: "",
    },
  });
  const codEmp = form.watch("cod_emp");
  const codCc = form.watch("cod_cc");
  const codTipo = form.watch("cod_tipo");
  const codCliente = form.watch("cod_cliente");
  const { isFetching: empresasDataIsFetching, data: empresasData = [] } = empresas.useLista();
  const { isFetching: centrosDataIsFetching, data: centrosData = [] } = centrosCosto.useLista();
  const { isFetching: empleadosRawIsFetching, data: empleadosRaw = [] } =
    empleadosUsuarios.useLista({
      ...(codEmp ? { cod_emp: Number(codEmp) } : {}),
      ...(codCc ? { cod_cc: Number(codCc) } : {}),
    });
  const empleadosData = useMemo(() => {
    const seen = new Set<string | number>();
    return empleadosRaw.filter((e) => {
      if (seen.has(e.codUsuario)) return false;
      seen.add(e.codUsuario);
      return true;
    });
  }, [empleadosRaw]);
  const { isFetching: configuracionesIsFetching, data: configuraciones = [] } =
    configuracionActividades.useLista({
      ...(codCc ? { cod_cc: Number(codCc) } : {}),
      cod_estado: 1,
    });
  const { data: objetivosData = [] } = tipos.useLista({ tipo_tabla: "OBJETIVO_ACTIVIDAD" });
  const clientes = useBusquedaEntidadCriterio(
    {
      ref_busqueda: busquedaCliente,
      list_descripcion_tipo: ["CLIENTE", "PRE-CLIENTE"],
      tipo_busqueda: "NOMBRE",
    },
    { enabled: false },
  );

  const busquedaClienteRef = useRef(0);
  const clientesRef = useRef(clientes);
  clientesRef.current = clientes;

  const contactos = useFetchEntidadContacto(
    {
      cod_tipo: codTipoCliente,
      ...(codCliente ? { entidad_id: Number(codCliente) } : {}),
      ...(codCc ? { cod_cc: Number(codCc) } : {}),
    },
    { enabled: Boolean(codTipoCliente && codCliente && codCc) },
  );
  const insertar = actividades.useInsertar({ meta: { successMessage: "Actividad creada" } });
  const centrosFiltrados = centrosData.filter((centro) => String(centro.codEmpresaCc) === codEmp);
  const tiposDisponibles = useMemo(
    () => [
      ...new Map(
        configuraciones
          .filter((configuracion) => !configuracion.solo_resultado)
          .filter((configuracion) => configuracion.cod_cc === Number(codCc))
          .map((configuracion) => [configuracion.cod_tipo_actividad, configuracion]),
      ).values(),
    ],
    [configuraciones, codCc],
  );
  const tipoElegido = tiposDisponibles.find((tipo) => String(tipo.cod_tipo_actividad) === codTipo);
  const IconoTipoElegido = tipoElegido
    ? iconoActividad(tipoElegido.nom_tipo_actividad, tipoElegido.icono)
    : null;

  const loadingCatalogs =
    empresasDataIsFetching ||
    centrosDataIsFetching ||
    empleadosRawIsFetching ||
    configuracionesIsFetching;

  const cambiarEmpresa = (valor: string) => {
    form.setValue("cod_emp", valor);
    form.setValue("cod_cc", "");
    form.setValue("cod_asesor", "");
    form.setValue("cod_tipo", "");
    form.setValue("cod_contacto", "");
  };
  const cambiarCentroCosto = (valor: string) => {
    form.setValue("cod_cc", valor);
    form.setValue("cod_asesor", "");
    form.setValue("cod_tipo", "");
    form.setValue("cod_contacto", "");
  };
  const submit = async (valores: ActividadFormValues) => {
    if (
      !tipoElegido ||
      !fechaActividadValida(valores.fecha_programada, tipoElegido.dias_creacion)
    ) {
      form.setError("fecha_programada", {
        message: "La fecha excede el límite permitido para este tipo",
      });
      return;
    }
    if (tipoElegido.requiere_cliente && (!valores.cod_cliente || !valores.cod_contacto)) {
      if (!valores.cod_cliente) form.setError("cod_cliente", { message: "Seleccione un cliente" });
      if (!valores.cod_contacto)
        form.setError("cod_contacto", { message: "Seleccione un contacto" });
      return;
    }
    const cliente = clientes.data?.entidades.find(
      (item) => String(item.entidad_id) === valores.cod_cliente,
    );
    const fecha = valores.fecha_programada
      ? `${valores.fecha_programada}:00`
      : new Date(valores.fecha_programada);
    if (!fecha) return;
    const respuesta = await insertar.mutateAsync({
      fecha_programada: fecha,
      asunto: [
        tipoElegido.nom_tipo_actividad,
        valores.fecha_programada.slice(0, 10),
        cliente?.entidad_nombre,
      ]
        .filter(Boolean)
        .join(" - "),
      descripcion: valores.descripcion,
      cod_tipo: Number(valores.cod_tipo),
      cod_cliente: valores.cod_cliente ? Number(valores.cod_cliente) : null,
      cod_emp: Number(valores.cod_emp),
      cod_cc: Number(valores.cod_cc),
      cod_asesor: Number(valores.cod_asesor),
      contactos: valores.cod_contacto ? [Number(valores.cod_contacto)] : [],
      cod_estado: estadoInicialActividad(valores.cod_tipo),
      cod_objetivo_actividad: Number(valores.cod_objetivo_actividad),
    });
    const id = leerIdDeMutacion(respuesta, "cod_actividad");
    if (id === null)
      throw new Error("La actividad fue creada pero el backend no devolvió su código");
    router.replace(`/crm/calendario/actividad/${encodeId(id)}`);
  };

  const fetchClientes = useCallback(async (valor: string) => {
    // Debounce: identificamos esta ejecución
    const busquedaActual = ++busquedaClienteRef.current;

    if (!valor) return [];

    if (valor.length < 3) return [];

    // Esperamos a que el usuario termine de escribir
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 400);
    });

    // Si hubo otra búsqueda durante la espera, descartamos esta
    if (busquedaActual !== busquedaClienteRef.current) {
      return [];
    }

    flushSync(() => {
      setBusquedaCliente(valor);
    });

    // 1. Esperamos directamente a que TanStack Query termine la solicitud
    const resultado = await clientesRef.current.refetch();

    // Si hubo otra búsqueda mientras esperaba la API, descartamos esta respuesta
    if (busquedaActual !== busquedaClienteRef.current) {
      return [];
    }

    // 2. Usamos los datos devueltos por esa solicitud,
    //    en lugar de clientes.data, que puede pertenecer al render anterior
    return (resultado.data?.entidades ?? []).reduce((acc, item) => {
      if (!acc.some((a) => String(a.entidad_id).trim() === String(item.entidad_id).trim())) {
        acc.push(item);
      }

      return acc;
    }, [] as EntidadCriterioResultado[]);
  }, []);

  if (loadingCatalogs) return <Loader />;

  if (!permisos.puedeAgregar)
    return (
      <Alert
        variant="destructive"
        className="space-y-5 flex flex-col justify-center items-center w-full"
      >
        <p className="flex items-center gap-2">
          <UserLock />
          <AlertTriangle />
          Usted no tiene permiso para agregar actividades
        </p>
      </Alert>
    );

  return (
    <div className="space-y-5 max-w-full w-7xl mx-auto">
      <form
        className="space-y-5 flex flex-col justify-center items-center w-full"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="space-y-5 max-w-full w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            <Field className="space-y-1 text-sm">
              <Label htmlFor="actividad-empresa">Empresa</Label>
              <Combobox
                clearable
                id="actividad-empresa"
                onChange={cambiarEmpresa}
                value={codEmp}
                options={
                  empresasData.map((empresa) => ({
                    value: String(empresa.cod_empresa),
                    label: empresa.nombre_emp,
                  })) as FieldOption[]
                }
              />
            </Field>
            <Field className="space-y-1 text-sm">
              <Label htmlFor="actividad-cc">Centro de costo</Label>
              <Combobox
                clearable
                id="actividad-cc"
                onChange={cambiarCentroCosto}
                value={codCc}
                options={
                  centrosFiltrados.map((centro) => ({
                    value: String(centro.codCc),
                    label: centro.nombreCc,
                  })) as FieldOption[]
                }
              />
            </Field>
            <Field className="space-y-1 text-sm">
              <Label htmlFor="actividad-asesor">Asesor responsable</Label>
              <Combobox
                clearable
                id="actividad-asesor"
                onChange={(valor) => form.setValue("cod_asesor", valor, { shouldValidate: true })}
                value={form.watch("cod_asesor")}
                options={
                  empleadosData.map((empleado) => ({
                    value: String(empleado.codUsuario),
                    label:
                      empleado.nombreCompleto || empleado.usuario || String(empleado.codUsuario),
                  })) as FieldOption[]
                }
              />
              <CampoError mensaje={form.formState.errors.cod_asesor?.message} />
            </Field>
            <Field className="space-y-1 text-sm">
              <Label htmlFor="actividad-tipo">Tipo de actividad</Label>
              <div className="flex flex-row items-center space-x-2">
                {IconoTipoElegido && (
                  <IconoTipoElegido aria-hidden="true" className="size-4 shrink-0" />
                )}
                <Combobox
                  clearable
                  id="actividad-tipo"
                  onChange={(val) => form.setValue("cod_tipo", val, { shouldValidate: true })}
                  value={form.watch("cod_tipo")}
                  options={
                    tiposDisponibles.map((tipo) => ({
                      value: String(tipo.cod_tipo_actividad),
                      label: tipo.nom_tipo_actividad,
                    })) as FieldOption[]
                  }
                />
              </div>
              <CampoError mensaje={form.formState.errors.cod_tipo?.message} />
            </Field>
            <Field className="space-y-1 text-sm">
              <Label htmlFor="actividad-objetivo">Objetivo</Label>
              <Select
                onValueChange={(valor) =>
                  form.setValue("cod_objetivo_actividad", valor, { shouldValidate: true })
                }
                value={form.watch("cod_objetivo_actividad")}
              >
                <SelectTrigger id="actividad-objetivo">
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {objetivosData.map((objetivo) => (
                    <SelectItem key={objetivo.codTipo} value={String(objetivo.codTipo)}>
                      {objetivo.nomTipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CampoError mensaje={form.formState.errors.cod_objetivo_actividad?.message} />
            </Field>
            <Field className="space-y-1">
              <Label htmlFor="actividad-fecha">Fecha programada</Label>
              <Input
                id="actividad-fecha"
                type="datetime-local"
                {...form.register("fecha_programada")}
                value={form.watch("fecha_programada")}
              />
              <CampoError mensaje={form.formState.errors.fecha_programada?.message} />
            </Field>
          </div>
          <div className="space-y-1">
            <Field className="space-y-1">
              <Label htmlFor="actividad-descripcion">Descripción</Label>
              <Textarea id="actividad-descripcion" {...form.register("descripcion")} />
              <CampoError mensaje={form.formState.errors.descripcion?.message} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field className="space-y-1">
              <FieldLabel htmlFor="actividad-buscar-cliente">Cliente</FieldLabel>
              <div className="flex flex-row items-center space-x-2">
                <AsyncComboboxInput<EntidadCriterioResultado>
                  id="actividad-buscar-cliente"
                  onChange={(value) => {
                    setCodTipoCliente(Number(value?.cod_tipo ?? 0));
                    form.setValue("cod_cliente", value?.entidad_id.toString() ?? "", {
                      shouldValidate: true,
                    });
                    form.setValue("cod_contacto", "");
                    setClienteSeleccionado(value);

                    if (value) contactos.refetch();
                  }}
                  value={clienteSeleccionado}
                  initialOptions={clientes.data?.entidades ?? []}
                  fetchOptions={fetchClientes}
                  minSearchLength={3}
                  fetchOnEmpty={false}
                  getOptionValue={(op: EntidadCriterioResultado) => op.entidad_id}
                  getOptionLabel={(op: EntidadCriterioResultado) =>
                    `${op.codigo_entidad ?? ""} - ${op.entidad_nombre ?? ""}`
                  }
                />
                {!form.watch("cod_cliente") && (
                  <Button variant="ghost" size="sm" onClick={() => setClienteModalAbierto(true)}>
                    <UserRoundPlusIcon className="h-4 w-4" />
                  </Button>
                )}
                <CampoError mensaje={form.formState.errors.cod_cliente?.message} />
              </div>
            </Field>

            <Field className="space-y-1 text-sm">
              <FieldLabel htmlFor="actividad-contacto">Contacto</FieldLabel>
              <div className="flex flex-row items-center space-x-2">
                <Combobox
                  clearable
                  disabled={!form.watch("cod_cliente")}
                  id="actividad-contacto"
                  onChange={(valor) =>
                    form.setValue("cod_contacto", valor, { shouldValidate: true })
                  }
                  value={form.watch("cod_contacto")}
                  options={
                    (contactos.data?.data ?? []).map((contacto) => ({
                      label: contacto.entidadcontacto_nombre,
                      value: String(contacto.entidadcontacto_id),
                    })) as FieldOption[]
                  }
                />
                {clienteSeleccionado && (
                  <Button variant="ghost" size="sm" onClick={() => setModalAbierto(true)}>
                    <UserRoundPlusIcon className="h-4 w-4" />
                  </Button>
                )}
                <CampoError mensaje={form.formState.errors.cod_contacto?.message} />
              </div>
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => router.back()} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={insertar.isPending} type="submit">
              {insertar.isPending ? "Creando..." : "Crear actividad"}
            </Button>
          </div>
        </div>
      </form>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear contacto</DialogTitle>
          </DialogHeader>
          {modalAbierto && clienteSeleccionado && (
            <NuevoContactoEntidad
              entidadId={form.watch("cod_cliente")}
              onSubmit={async () => {
                contactos.refetch();
                setModalAbierto(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={clienteModalAbierto} onOpenChange={setClienteModalAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear pre cliente</DialogTitle>
          </DialogHeader>
          <NuevaEntidad tipo={TIPO_ENTIDAD.preCliente} tipoEntidad={"PRE-CLIENTE"} mode="create" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
