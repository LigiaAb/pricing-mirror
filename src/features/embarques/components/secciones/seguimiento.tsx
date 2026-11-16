"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { actividades } from "@/features/actividades";
import {
  NuevoContactoEntidad,
  useFetchEntidadContacto,
  useFetchEntidades,
} from "@/features/entidades";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { DialogComponent } from "@/shared/components/dialog-component";
import { deInputDateTimeLocal } from "@/shared/lib/date";
import { asText, safeString } from "@/shared/lib/text";
import { useAuthStore } from "@/shared/stores/auth-store";
import { FormularioAlternativo } from "../formularios/formulario-alternativo";
import { FormularioConGuardar } from "../formularios/formulario-con-guardar";
import { SeccionHeader } from "../public/seccion-header";
import { TablaActividadesCTS } from "../tablas/tabla-actividades-cts";

interface SeguimientoSectionProps {
  readonly mensaje?: string;
  readonly embarqueData?: Record<string, unknown> | null;
  readonly onValidityChange?: (valid: boolean) => void;
  readonly onLoadingChange?: ((loading: boolean) => void) | undefined;
  readonly codTipo?: number | string;
}

export function SeguimientoSection({
  mensaje,
  embarqueData = null,
  onValidityChange,
  onLoadingChange,
  codTipo = 332,
}: SeguimientoSectionProps) {
  const { mutateAsync: insertarActividad } = actividades.useInsertar({
    meta: { successMessage: "Seguimiento registrado correctamente" },
  });
  const { user } = useAuthStore();
  const codUsuario = (user as Record<string, unknown>)?.cod_usuario ?? null;

  const { data: actividadesLista = [], isLoading: isLoadingActividades } = actividades.useLista(
    { cod_asesor: codUsuario, cod_tipo: codTipo },
    { enabled: Boolean(codUsuario) },
  );

  const isLoadingSeccion = Boolean(codUsuario) && isLoadingActividades;
  useEffect(() => {
    onLoadingChange?.(isLoadingSeccion);
  }, [isLoadingSeccion, onLoadingChange]);

  const embarqueId = (embarqueData?.EMBARQUE_ID ??
    embarqueData?.embarque_id ??
    embarqueData?.id ??
    embarqueData?.embarqueId ??
    null) as number | null;

  const tieneSeguimientos = (() => {
    if (!actividadesLista.length || !embarqueId) return false;
    return actividadesLista.some((a) => {
      const asunto = asText(a.asunto);
      return (
        asunto.includes(`[${embarqueId}]`) ||
        asText(a.embarque_id ?? a.embarqueId) === String(embarqueId)
      );
    });
  })();

  const entidadIdCliente = (embarqueData?.ENTIDAD_ID_CLI ??
    embarqueData?.entidad_id_cli ??
    embarqueData?.entidadIdCli ??
    null) as number | null;

  const { data: clienteEntidades = [], isSuccess: clienteQueryDone } = useFetchEntidades(
    { tipo_entidad: "CLIENTE", entidad_id: entidadIdCliente },
    { enabled: Boolean(entidadIdCliente) },
  );
  const esPreCliente = clienteQueryDone && !clienteEntidades.length;
  const codTipoCliente = (clienteEntidades[0]?.cod_tipo ?? (esPreCliente ? 5 : 3)) as number;

  const empresaIdFromDetalles =
    embarqueData?.empresa_id ??
    embarqueData?.EMPRESA_ID ??
    embarqueData?.empresaId ??
    embarqueData?.cod_empresa ??
    null;
  const centroCostoIdFromDetalles =
    embarqueData?.cencos_id ??
    embarqueData?.CENCOS_ID ??
    embarqueData?.cencosId ??
    embarqueData?.cencod_id ??
    embarqueData?.CENCOD_ID ??
    embarqueData?.cencodId ??
    embarqueData?.centroId ??
    embarqueData?.centro_id ??
    embarqueData?.cod_cc ??
    embarqueData?.COD_CC ??
    null;

  const { data: contactosResp = {} } = useFetchEntidadContacto(
    { cod_tipo: codTipoCliente, entidad_id: entidadIdCliente as number },
    { enabled: Boolean(entidadIdCliente) },
  );

  const [contactosLocal, setContactosLocal] = useState<Array<Record<string, unknown>>>(
    ((contactosResp as Record<string, unknown>)?.data as Array<Record<string, unknown>>) ?? [],
  );
  useEffect(() => {
    setContactosLocal(
      ((contactosResp as Record<string, unknown>)?.data as Array<Record<string, unknown>>) ?? [],
    );
  }, [(contactosResp as Record<string, unknown>)?.data]);

  const contactoOptions = (contactosLocal || []).map((c) => ({
    value: asText(c.entidadcontacto_id),
    label: asText(c.entidadcontacto_nombre ?? c.entidad_nombre),
  }));

  const queryClient = useQueryClient();
  const formValuesRef = useRef({ fecha: "", descripcion: "", contacto: "" });
  const [formValues, setFormValues] = useState({ fecha: "", descripcion: "", contacto: "" });
  const [formValid, setFormValid] = useState(false);
  const [openContactoDialog, setOpenContactoDialog] = useState(false);
  const [contactoDialogMode, setContactoDialogMode] = useState("create");
  const [editContactoData, setEditContactoData] = useState<Record<string, unknown> | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const selectedContactoId = formValues.contacto;
  const selectedContactoObj =
    (contactosLocal || []).find(
      (c) => String(c.entidadcontacto_id) === String(selectedContactoId),
    ) ?? null;

  const contactoActions = (() => {
    if (!entidadIdCliente) return [];
    const actions: Array<Record<string, unknown>> = [
      {
        visible: true,
        enabled: true,
        nombre: "Nuevo",
        icono: "c-suma",
        onClick: () => {
          setEditContactoData(null);
          setContactoDialogMode("create");
          setOpenContactoDialog(true);
        },
      },
    ];
    if (selectedContactoObj) {
      actions.unshift({
        visible: true,
        enabled: true,
        nombre: "Editar",
        icono: "c-lapiz",
        onClick: () => {
          setEditContactoData(selectedContactoObj);
          setContactoDialogMode("edit");
          setOpenContactoDialog(true);
        },
      });
    }
    return actions;
  })();

  const fields = [
    {
      key: "descripcion",
      label: "Descripción",
      type: "textarea",
      colSpan: 12,
      required: true,
    },
    {
      key: "contacto",
      label: "Contacto",
      type: "select",
      colSpan: 12,
      options: contactoOptions,
      required: true,
      actions: contactoActions,
    },
    { key: "fecha", label: "Fecha", type: "date", colSpan: 12, required: true },
  ];

  const validate = (vals: Record<string, unknown>) =>
    Boolean(vals.fecha && asText(vals.fecha).trim()) &&
    Boolean(vals.descripcion && asText(vals.descripcion).trim()) &&
    Boolean(vals.contacto && asText(vals.contacto).trim());

  const estadoFormulario: {
    severidad: "info" | "warning";
    titulo: string;
    mensaje: string;
  } | null = tieneSeguimientos
    ? null
    : {
        severidad: formValid ? "info" : "warning",
        titulo: formValid ? "Pendiente de guardar" : "Faltan completar campos",
        mensaje: formValid
          ? "El seguimiento esta completo, pero aun no se ha guardado."
          : "Complete todos los campos para registrar el seguimiento.",
      };

  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;
  useEffect(() => {
    if (onValidityChangeRef.current) onValidityChangeRef.current(tieneSeguimientos || formValid);
  }, [formValid, tieneSeguimientos]);

  const handleSave = async () => {
    if (!formValid) return;
    const vals = formValuesRef.current;
    const codEmpresa = empresaIdFromDetalles;
    const codCc = centroCostoIdFromDetalles;
    const entidadId = (embarqueData?.ENTIDAD_ID_CLI ?? embarqueData?.entidad_id_cli ?? null) as
      | number
      | null;
    const fechaProgramada = deInputDateTimeLocal(`${asText(vals.fecha)}T00:00`);
    if (!fechaProgramada) return;

    const asuntoGenerado = embarqueId ? `Coordinación: [${embarqueId}]` : "Seguimiento";
    await insertarActividad({
      asunto: asuntoGenerado,
      descripcion: vals.descripcion,
      cod_tipo: codTipo,
      fecha_programada: fechaProgramada,
      cod_cliente: entidadId,
      cod_emp: codEmpresa,
      cod_cc: codCc,
      cod_asesor: codUsuario,
      contactos: vals.contacto ? [Number(vals.contacto) || vals.contacto] : [],
      cod_documento: embarqueId ? String(embarqueId) : "",
    });
    formValuesRef.current = { fecha: "", descripcion: "", contacto: "" };
    setFormValues({ fecha: "", descripcion: "", contacto: "" });
    setResetKey((k) => k + 1);
    if (onValidityChangeRef.current) onValidityChangeRef.current(false);
  };

  const handleContactoGuardada = (resultado: unknown) => {
    const res = resultado as { data?: Record<string, unknown> };
    const saved = res?.data;
    if (saved?.entidadcontacto_id) {
      const id = safeString(saved.entidadcontacto_id);
      formValuesRef.current = { ...formValuesRef.current, contacto: id };
      setFormValues((prev) => ({ ...prev, contacto: id }));
      setContactosLocal((prev) => {
        const idx = (prev || []).findIndex(
          (c) => safeString(c.entidadcontacto_id) === safeString(saved.entidadcontacto_id),
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...(prev || []), saved];
      });
    }
    if (entidadIdCliente) {
      queryClient.invalidateQueries({
        queryKey: ["entidad-contacto", { cod_tipo: codTipoCliente, entidad_id: entidadIdCliente }],
      });
    }
    setOpenContactoDialog(false);
  };

  return (
    <div>
      <SeccionHeader titulo="Seguimiento" />
      <div className="mt-2 flex justify-center">
        <div className="flex w-full max-w-325 flex-col gap-4 md:flex-row">
          <div className="relative flex max-w-200 flex-1 flex-col">
            {estadoFormulario && (
              <BannerInformativo
                severidad={estadoFormulario.severidad}
                titulo={estadoFormulario.titulo}
                mensaje={estadoFormulario.mensaje}
              />
            )}
            <FormularioConGuardar disabled={!formValid} guardando={false} onGuardar={handleSave}>
              <FormularioAlternativo
                key={resetKey}
                initialValues={formValues}
                fields={fields}
                title="Registrar Seguimiento"
                validate={validate}
                onValuesChange={(vals: Record<string, unknown>) => {
                  formValuesRef.current = vals as typeof formValues;
                  setFormValues(vals as typeof formValues);
                }}
                onValidityChange={setFormValid}
                showSubmitButton={false}
              />
            </FormularioConGuardar>
          </div>

          <div className="max-w-200 flex-1 rounded-md border bg-card p-2">
            <TablaActividadesCTS
              embarqueData={embarqueData}
              lineasVisibles={6}
              filtrarPorAsunto
              codTipo={codTipo}
            />
          </div>
        </div>
      </div>

      <DialogComponent
        titulo={contactoDialogMode === "edit" ? "Editar Contacto" : "Nuevo Contacto"}
        openDialog={openContactoDialog}
        handleClose={() => setOpenContactoDialog(false)}
        width="50vw"
        height="auto"
      >
        <NuevoContactoEntidad
          entidadId={entidadIdCliente as string | number}
          contactoId={(editContactoData?.entidadcontacto_id as number) ?? undefined}
          initialValues={editContactoData ?? {}}
          codTipo={codTipoCliente}
          onSubmit={handleContactoGuardada}
        />
      </DialogComponent>

      <BannerInformativo ocultar={!mensaje} severidad="info" mensaje={mensaje} />
    </div>
  );
}
