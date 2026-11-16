"use client";

import { useState } from "react";
import {
  buscarEntidadesPorNombre,
  MIN_CARACTERES_BUSQUEDA_ENTIDAD,
  TIPO_ENTIDAD,
} from "@/features/entidades";
import { FormBuilder } from "@/shared/components/form/base-form";
import type { FormFieldConfig } from "@/shared/components/form/types";
import { type AsignacionCts, asignacionesCts } from "../../api/asignaciones-cts";
import { useOpcionesAsignacionCts } from "../../hooks/use-opciones-asignacion-cts";
import {
  type AsignacionCtsFormValues,
  asignacionCtsFormSchema,
  payloadAsignacionCts,
  valoresAsignacionCts,
} from "../../lib/asignacion-cts/form-schema";

async function buscarClientes(termino: string) {
  return (
    await buscarEntidadesPorNombre(termino, [TIPO_ENTIDAD.CLIENTE, TIPO_ENTIDAD.PRE_CLIENTE])
  ).map((cliente) => ({ value: String(cliente.entidadId), label: cliente.nombre }));
}

export function AsignacionCtsForm({
  asignacion,
  soloLectura,
  onClose,
}: {
  asignacion?: AsignacionCts | undefined;
  soloLectura: boolean;
  onClose: () => void;
}) {
  const defaults = valoresAsignacionCts(asignacion);
  const [empresa, setEmpresa] = useState(defaults.cod_empresa);
  const [centro, setCentro] = useState(defaults.cod_cc);
  const [especial, setEspecial] = useState(defaults.especial);
  const opciones = useOpcionesAsignacionCts(empresa, centro);
  const insertar = asignacionesCts.useInsertar({
    meta: { successMessage: "Asignación CTS creada" },
  });
  const actualizar = asignacionesCts.useActualizar({
    meta: { successMessage: "Asignación CTS guardada" },
  });
  const empleados = [...opciones.empleados];
  if (
    asignacion?.cod_usuario != null &&
    empresa === defaults.cod_empresa &&
    centro === defaults.cod_cc &&
    !empleados.some((opcion) => opcion.value === defaults.cod_usuario)
  ) {
    empleados.push({
      value: String(asignacion.cod_usuario),
      label: asignacion.nombre_completo || String(asignacion.cod_usuario),
    });
  }
  const campos: FormFieldConfig<AsignacionCtsFormValues>[] = [
    {
      name: "cod_empresa",
      label: "Empresa",
      type: "select",
      options: opciones.empresas,
      required: true,
      resetOnChange: ["cod_cc", "cod_usuario"],
      onChange: (valor) => {
        setEmpresa(valor);
        setCentro("");
      },
    },
    {
      name: "cod_cc",
      label: "Centro de costo",
      type: "select",
      options: opciones.centros,
      required: true,
      disabled: !empresa,
      resetOnChange: ["cod_usuario"],
      onChange: setCentro,
    },
    {
      name: "cod_usuario",
      label: "Empleado",
      type: "select",
      options: empleados,
      disabled: !centro || especial,
      required: !especial,
    },
    {
      name: "entidad_id",
      label: "Cliente",
      type: "async",
      required: true,
      buscar: buscarClientes,
      buscarQueryKey: "asignacion-cts-clientes",
      minSearchLength: MIN_CARACTERES_BUSQUEDA_ENTIDAD,
      initialOptions: asignacion
        ? [{ value: String(asignacion.entidad_id), label: asignacion.nombre_cliente }]
        : [],
      placeholder: "Buscar cliente o pre-cliente...",
    },
    {
      name: "cod_tipo_embarque",
      label: "Transporte",
      type: "select",
      options: opciones.tipos,
      required: true,
    },
    { name: "fecha_inicio", label: "Fecha inicio", type: "datetime", required: true },
    { name: "fecha_fin", label: "Fecha final", type: "datetime", required: true },
    {
      name: "cod_estado",
      label: "Estado",
      type: "select",
      options: opciones.estados,
      required: true,
    },
    {
      name: "especial",
      label: "¿Es una asignación vacía?",
      type: "switch",
      onChange: (valor) => setEspecial(Boolean(valor)),
      resetOnChange: ["cod_usuario"],
    },
  ];
  return (
    <div className="space-y-4">
      {asignacion?.fecha_creacion && (
        <p className="text-sm text-muted-foreground">
          Fecha creación: {new Date(asignacion.fecha_creacion).toLocaleString("es-GT")}
        </p>
      )}
      {especial && (
        <p role="status" className="rounded-md border bg-muted p-3 text-sm">
          En una asignación vacía, el CTS será asignado al pricing que aprueba la cotización, quien
          podrá asignarlo después a un operador.
        </p>
      )}
      <FormBuilder<AsignacionCtsFormValues>
        schema={asignacionCtsFormSchema}
        defaultValues={defaults}
        fields={campos.map((campo) => ({ ...campo, disabled: soloLectura || campo.disabled }))}
        hideFooter={soloLectura}
        onCancel={onClose}
        onSubmit={async (valores) => {
          if (soloLectura) return;
          const payload = payloadAsignacionCts(valores);
          if (asignacion)
            await actualizar.mutateAsync({
              ...payload,
              cod_asignacion_cts: asignacion.cod_asignacion_cts,
            });
          else await insertar.mutateAsync(payload);
          onClose();
        }}
      />
    </div>
  );
}
