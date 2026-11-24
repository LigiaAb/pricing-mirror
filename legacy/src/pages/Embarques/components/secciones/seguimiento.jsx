import { useEffect, useState, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import FormularioAlternativo, { ModernFormHeader } from "@/components/bpm/Formularios/FormularioAlternativo";
import FormularioConGuardar from "./formularioConGuardar";
import DialogComponent from "@/components/Dialog/DialogComponent";
import NuevoContactoEntidad from "@/pages/Embarques/components/Entidades/modalEntidad/nuevoContactoEntidad";
import { useInsertarActividad, useFetchEntidadContacto, getCodUsuarioFromLocalStorage, useFetchActividades, useFetchEntidades } from "@/hooks/Bpm";
import TablaActividadesCTS from "@/components/bpm/tablas/tablaActividadesCTS";
import BannerInformativo from "../banner";

const SeguimientoSection = ({ mensaje = "", embarqueData = null, onValidityChange = null, onLoadingChange = null, codTipo = 35 }) => {
  const { mutateAsync: insertarActividad, isLoading: guardando } = useInsertarActividad();

  const cod_usuario = typeof getCodUsuarioFromLocalStorage === "function" ? getCodUsuarioFromLocalStorage() : null;
  const { data: actividades = [], isLoading: isLoadingActividades } = useFetchActividades(
    { cod_asesor: cod_usuario, cod_tipo: codTipo },
    { enabled: Boolean(cod_usuario) },
  );

  const embarqueId = useMemo(
    () => embarqueData?.EMBARQUE_ID || embarqueData?.embarque_id || embarqueData?.id || embarqueData?.embarqueId || null,
    [embarqueData],
  );

  const tieneSeguimientos = useMemo(() => {
    if (!actividades || actividades.length === 0 || !embarqueId) return false;
    return actividades.some((a) => {
      const asunto = String(a.asunto || a.ASUNTO || "");
      return asunto.includes(`[${embarqueId}]`) || String(a.embarque_id || a.EMBARQUE_ID || a.embarqueId || "") === String(embarqueId);
    });
  }, [actividades, embarqueId]);

  const entidadIdCliente = useMemo(
    () => embarqueData?.ENTIDAD_ID_CLI || embarqueData?.entidad_id_cli || embarqueData?.entidadIdCli || null,
    [embarqueData],
  );

  // ── Detectar si es Cliente o Pre-Cliente ─────────────────────────
  const { data: clienteEntidades = [], isSuccess: clienteQueryDone, isLoading: isLoadingClienteEntidades } = useFetchEntidades(
    { tipo_entidad: "CLIENTE", entidad_id: entidadIdCliente },
    { enabled: Boolean(entidadIdCliente) },
  );
  const esPreCliente = clienteQueryDone && clienteEntidades.length === 0;
  const codTipoCliente = clienteEntidades?.[0]?.cod_tipo ?? (esPreCliente ? 5 : 3);

  const empresaIdFromDetalles =
    embarqueData?.empresa_id ?? embarqueData?.EMPRESA_ID ?? embarqueData?.empresaId ?? embarqueData?.cod_empresa ?? null;

  const centroCostoIdFromDetalles =
    embarqueData?.cencos_id ?? embarqueData?.CENCOS_ID ?? embarqueData?.cencosId ?? embarqueData?.cencod_id ?? embarqueData?.CENCOD_ID ?? embarqueData?.cencodId ?? embarqueData?.centroId ?? embarqueData?.centro_id ?? embarqueData?.cod_cc ?? embarqueData?.COD_CC ?? null;

  const { data: contactosResp = {}, isLoading: isLoadingContactos } = useFetchEntidadContacto(
    { cod_tipo: codTipoCliente, entidad_id: entidadIdCliente },
    { enabled: Boolean(entidadIdCliente) },
  );

  const [isLoadingTablaActividades, setIsLoadingTablaActividades] = useState(true);

  useEffect(() => {
    onLoadingChange?.(
      isLoadingActividades ||
      isLoadingClienteEntidades ||
      isLoadingContactos ||
      isLoadingTablaActividades,
    );
  }, [
    isLoadingActividades,
    isLoadingClienteEntidades,
    isLoadingContactos,
    isLoadingTablaActividades,
    onLoadingChange,
  ]);

  // Local copy to allow immediate UI updates when a contact is created/edited.
  const [contactosLocal, setContactosLocal] = useState(contactosResp.data || []);
  useEffect(() => {
    setContactosLocal(contactosResp.data || []);
  }, [contactosResp.data]);

  const contactoOptions = useMemo(
    () => (contactosLocal || []).map((c) => ({
      value: c.entidadcontacto_id,
      label: c.entidadcontacto_nombre || c.entidad_nombre || `${c.entidadcontacto_nombre}`,
    })),
    [contactosLocal],
  );

  // Captura los valores actuales del formulario para usarlos en handleSave
  const queryClient = useQueryClient();

  const formValuesRef = useRef({ fecha: "", descripcion: "", contacto: "" });
  const [formValues, setFormValues] = useState({ fecha: "", descripcion: "", contacto: "" });
  const [formValid, setFormValid] = useState(false);

  const [openContactoDialog, setOpenContactoDialog] = useState(false);
  const [contactoDialogMode, setContactoDialogMode] = useState("create");
  const [editContactoData, setEditContactoData] = useState(null);

  // Clave para forzar el remontaje del formulario tras guardar exitosamente
  const [resetKey, setResetKey] = useState(0);

  const emptyValues = useMemo(() => ({ fecha: "", descripcion: "", contacto: "" }), []);
  const initialValues = formValues;

  useEffect(() => {
    setFormValues(emptyValues);
    formValuesRef.current = emptyValues;
  }, [emptyValues, resetKey]);

  const selectedContactoId = formValues.contacto;
  const selectedContactoObj = useMemo(() => {
    if (!selectedContactoId) return null;
    return (contactosLocal || []).find(
      (c) => String(c.entidadcontacto_id) === String(selectedContactoId),
    );
  }, [contactosLocal, selectedContactoId]);

  const contactoActions = useMemo(() => {
    if (!entidadIdCliente) return [];

    const actions = [
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
  }, [entidadIdCliente, selectedContactoObj]);

  const fields = useMemo(
    () => [
      { key: "descripcion", label: "Descripción", type: "textarea", colSpan: "span 12", required: true },
      { key: "contacto", label: "Contacto", type: "select", colSpan: "span 12", options: contactoOptions, required: true, actions: contactoActions },
      { key: "fecha", label: "Fecha", type: "date", colSpan: "span 12", required: true },
    ],
    [contactoOptions, contactoActions],
  );

  const validate = (vals) =>
    Boolean(vals.fecha && String(vals.fecha).trim()) &&
    Boolean(vals.descripcion && String(vals.descripcion).trim()) &&
    Boolean(vals.contacto && String(vals.contacto).trim());

  const estadoFormulario = tieneSeguimientos ? null : {
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
    const embarqueId =
      embarqueData?.EMBARQUE_ID || embarqueData?.embarque_id || embarqueData?.id || embarqueData?.embarqueId || null;

    const cod_empresa = empresaIdFromDetalles;
    const cod_cc = centroCostoIdFromDetalles;

    const entidad_id =
      embarqueData?.ENTIDAD_ID_CLI || embarqueData?.entidad_id_cli || null;

    try {
      const asuntoGenerado = embarqueId ? `Coordinación: [${embarqueId}]` : "Seguimiento";

      const payload = {
        asunto: asuntoGenerado,
        descripcion: vals.descripcion,
        cod_tipo: codTipo,
        fecha_programada: vals.fecha || null,
        cod_cliente: entidad_id,
        cod_emp: cod_empresa,
        cod_cc: cod_cc,
        cod_asesor: typeof getCodUsuarioFromLocalStorage === "function" ? getCodUsuarioFromLocalStorage() : null,
        contactos: vals.contacto ? [Number(vals.contacto) || vals.contacto] : [],
        cod_documento: embarqueId ? String(embarqueId) : "",
      };

      const resp = await insertarActividad(payload);

      const success = resp?.data?.mensaje === "Actividad creada correctamente" || resp?.success || resp?.data?.success;

      if (success) {
        // reiniciar formulario y actualizar validez
        formValuesRef.current = emptyValues;
        setFormValues(emptyValues);
        setResetKey((k) => k + 1);
        if (onValidityChangeRef.current) onValidityChangeRef.current(false);
      } else {
        console.error("Error al insertar actividad:", resp);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContactoGuardada = (resultado) => {
    const saved = resultado?.data;
    if (saved?.entidadcontacto_id) {
      const id = String(saved.entidadcontacto_id);
      formValuesRef.current = { ...formValuesRef.current, contacto: id };
      setFormValues((prev) => ({ ...prev, contacto: id }));

      setContactosLocal((prev) => {
        const idx = (prev || []).findIndex((c) => String(c.entidadcontacto_id) === String(saved.entidadcontacto_id));
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...(prev || []), saved];
      });
    }

    if (entidadIdCliente) {
      queryClient.invalidateQueries(["entidad-contacto", { cod_tipo: codTipoCliente, entidad_id: entidadIdCliente }]);
    }

    setOpenContactoDialog(false);
  };

  return (
    <Box>

      <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", maxWidth: 1300, display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
          {/* Formulario (izquierda) */}
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: 800, display: "flex", flexDirection: "column", position: "relative" }}>
            {estadoFormulario && (
              <BannerInformativo
                severidad={estadoFormulario.severidad}
                titulo={estadoFormulario.titulo}
                mensaje={estadoFormulario.mensaje}
              />
            )}

            <FormularioConGuardar disabled={!formValid} guardando={guardando} onGuardar={handleSave} variant="modern">
              <ModernFormHeader icon="c-derecha-doble" title="Seguimiento" subtitle="Registra un nuevo seguimiento para este embarque." />
              <FormularioAlternativo
                key={resetKey}
                initialValues={initialValues}
                fields={fields}
                title="Registrar Seguimiento"
                validate={validate}
                onValuesChange={(vals) => {
                  formValuesRef.current = vals;
                  setFormValues(vals);
                }}
                onValidityChange={setFormValid}
                showSubmitButton={false}
                hideHeader
                variant="modern"
              />
            </FormularioConGuardar>
          </Box>

          {/* Historial (derecha) */}
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: 800, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, p: 1 }}>
            <TablaActividadesCTS embarqueData={embarqueData} lineasVisibles={6} filtrarPorAsunto={true} codTipo={codTipo} onLoadingChange={setIsLoadingTablaActividades} />
          </Box>
        </Box>
      </Box>

      <DialogComponent
        titulo={contactoDialogMode === "edit" ? "Editar Contacto" : "Nuevo Contacto"}
        openDialog={openContactoDialog}
        handleClose={() => setOpenContactoDialog(false)}
        width="50vw"
        height="auto"
      >
        <NuevoContactoEntidad
          entidadId={entidadIdCliente}
          contactoId={editContactoData?.entidadcontacto_id}
          initialValues={editContactoData}
          codTipo={codTipoCliente}
          codEmp={empresaIdFromDetalles}
          codCc={centroCostoIdFromDetalles}
          onSubmit={handleContactoGuardada}
        />
      </DialogComponent>

      <BannerInformativo
        ocultar={!mensaje}
        severidad="info"
        mensaje={mensaje}
        sx={{ mt: 1, mb: 0 }}
      />
    </Box>
  );
};

SeguimientoSection.propTypes = {
  mensaje: PropTypes.string,
  embarqueData: PropTypes.object,
  onValidityChange: PropTypes.func,
  onLoadingChange: PropTypes.func,
  codTipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default SeguimientoSection;
