"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  centrosCosto,
  configuracionActividades,
  empresas,
  periodicidad,
  tipos,
} from "@/features/catalogos";
import type { Objetivo } from "@/features/objetivos/api/objetivos";
import { objetivos } from "@/features/objetivos/api/objetivos";
import {
  construirObjetivoSchema,
  ESTADOS_OBJETIVO,
} from "@/features/objetivos/lib/objetivo-reglas";
import {
  opcionesCentroCosto,
  opcionesTipoActividad,
} from "@/features/objetivos/lib/objetivo-vista";
import { rutaDetalle } from "@/features/objetivos/lib/objetivos-rutas";
import { leerIdDeMutacion } from "@/shared/api/respuesta-mutacion";
import { FormBuilder } from "@/shared/components/form/base-form";
import type { FormFieldConfig } from "@/shared/components/form/types";
import { aInputDateTimeLocal, deInputDateTimeLocal } from "@/shared/lib/date";
import { encodeId } from "@/shared/lib/sqids";

const TIPO_TABLA_ASIGNACION_ENTIDAD = "ASIGNACION_ENTIDAD";

export function ObjetivoForm({
  rutaBase,
  objetivo,
  soloLectura,
}: Readonly<{ rutaBase: string; objetivo: Objetivo | null; soloLectura: boolean }>) {
  const router = useRouter();
  const esCreacion = objetivo === null;

  const { data: empresasData = [] } = empresas.useLista();
  const { data: centros = [] } = centrosCosto.useLista();
  const { data: actividades = [] } = configuracionActividades.useLista();
  const { data: tiposAsignacion = [] } = tipos.useLista({
    tipo_tabla: TIPO_TABLA_ASIGNACION_ENTIDAD,
  });
  const { data: periodicidades = [] } = periodicidad.useLista();

  const insertar = objetivos.useInsertar();
  const actualizar = objetivos.useActualizar({ meta: { successMessage: "Objetivo guardado" } });

  const [codEmpElegido, setCodEmpElegido] = useState(objetivo ? String(objetivo.codEmp) : "");
  const [codCcElegido, setCodCcElegido] = useState(objetivo ? String(objetivo.codCc) : "");

  const schema = useMemo(() => construirObjetivoSchema(periodicidades), [periodicidades]);

  const empresasOptions = useMemo(
    () => empresasData.map((e) => ({ value: String(e.cod_empresa), label: e.nombre_emp })),
    [empresasData],
  );
  const centrosCostoOptions = useMemo(
    () => opcionesCentroCosto(centros, codEmpElegido || undefined),
    [centros, codEmpElegido],
  );
  const tipoActividadOptions = useMemo(
    () => opcionesTipoActividad(actividades, codEmpElegido || undefined, codCcElegido || undefined),
    [actividades, codEmpElegido, codCcElegido],
  );
  const periodicidadOptions = useMemo(
    () => periodicidades.map((p) => ({ value: String(p.cod_periodicidad), label: p.descripcion })),
    [periodicidades],
  );
  const tipoAsignacionOptions = useMemo(
    () => tiposAsignacion.map((t) => ({ value: String(t.codTipo), label: t.nomTipo })),
    [tiposAsignacion],
  );

  const fields: FormFieldConfig[] = [
    {
      name: "fecha_inicial",
      label: "Fecha Inicial",
      type: "datetime",
      required: true,
      readOnly: soloLectura,
    },
    {
      name: "fecha_final",
      label: "Fecha Final",
      type: "datetime",
      required: true,
      readOnly: soloLectura,
    },
    {
      name: "cod_emp",
      label: "Empresa",
      type: "select",
      required: true,
      options: empresasOptions,
      disabled: soloLectura,
      resetOnChange: ["cod_cc", "cod_tipo_actividad"],
      onChange: setCodEmpElegido,
    },
    {
      name: "cod_cc",
      label: "Centro de Costo",
      type: "select",
      required: true,
      options: centrosCostoOptions,
      disabled: soloLectura || !codEmpElegido,
      resetOnChange: ["cod_tipo_actividad"],
      onChange: setCodCcElegido,
    },
    {
      name: "descripcion",
      label: "Descripción",
      type: "text",
      required: true,
      readOnly: soloLectura,
    },
    {
      name: "cod_tipo_actividad",
      label: "Tipo de Actividad",
      type: "select",
      required: true,
      options: tipoActividadOptions,
      disabled: soloLectura || !codCcElegido,
    },
    {
      name: "cantidad",
      label: "Cantidad",
      type: "number",
      required: true,
      readOnly: soloLectura,
    },
    {
      name: "cod_periodicidad",
      label: "Periodicidad",
      type: "select",
      required: true,
      options: periodicidadOptions,
      disabled: soloLectura,
    },
    {
      name: "evaluar_creador",
      label: "¿Aplicar a creador de actividad?",
      type: "switch",
      disabled: soloLectura,
    },
    {
      name: "cod_tipo_asignacion",
      label: "Tipo de Asignación",
      type: "select",
      required: true,
      options: tipoAsignacionOptions,
      disabled: soloLectura,
    },
  ];

  if (!esCreacion) {
    fields.push({
      name: "cod_estado",
      label: "Estado",
      type: "select",
      required: true,
      options: [...ESTADOS_OBJETIVO],
      disabled: soloLectura,
    });
  }

  return (
    <FormBuilder
      schema={schema}
      fields={fields}
      hideFooter={soloLectura}
      defaultValues={{
        fecha_inicial: aInputDateTimeLocal(objetivo?.fechaInicial ?? new Date()),
        fecha_final: aInputDateTimeLocal(objetivo?.fechaFinal ?? new Date()),
        cod_emp: objetivo ? String(objetivo.codEmp) : "",
        cod_cc: objetivo ? String(objetivo.codCc) : "",
        descripcion: objetivo?.descripcion ?? "",
        cod_tipo_actividad: objetivo ? String(objetivo.codTipoActividad) : "",
        cantidad: objetivo ? String(objetivo.cantidad) : "",
        cod_periodicidad: objetivo ? String(objetivo.codPeriodicidad) : "",
        evaluar_creador: Boolean(objetivo?.evaluarCreador),
        cod_tipo_asignacion: objetivo ? String(objetivo.codTipoAsignacion) : "",
        cod_estado: objetivo ? String(objetivo.codEstado) : "1",
      }}
      labels={{ submit: objetivo ? "Guardar" : "Agregar" }}
      onSubmit={async (values) => {
        const payload = {
          descripcion: values.descripcion,
          cantidad: Number(values.cantidad),
          cod_tipo_actividad: Number(values.cod_tipo_actividad),
          cod_emp: Number(values.cod_emp),
          cod_cc: Number(values.cod_cc),
          cod_tipo_asignacion: Number(values.cod_tipo_asignacion),
          cod_periodicidad: Number(values.cod_periodicidad),
          cod_estado: Number(values.cod_estado),
          fecha_inicial: deInputDateTimeLocal(values.fecha_inicial as string),
          fecha_final: deInputDateTimeLocal(values.fecha_final as string),
          evaluar_creador: Boolean(values.evaluar_creador),
        };

        if (objetivo) {
          await actualizar.mutateAsync({
            ...payload,
            cod_objetivo: Number(objetivo.codObjetivo),
            cod_usuario_creador: objetivo.codUsuarioCreador,
          });
          return;
        }

        const respuesta = await insertar.mutateAsync({ ...payload, cod_objetivo: 0 });
        const nuevoId = leerIdDeMutacion(respuesta, "cod_objetivo");
        if (nuevoId === null) {
          throw new Error("El objetivo se creó, pero el backend no devolvió su código");
        }
        router.replace(rutaDetalle(rutaBase, encodeId(nuevoId)));
      }}
    />
  );
}
