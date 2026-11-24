import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { Box, CircularProgress } from "@mui/material";
import { api } from "@/api";
import {
  useCoordinacionData,
  useFetchEntidades,
  useFetchDatosEntidad,
  useUpdateCoordinacion,
  useInsertarEntidadDireccion,
  useActualizarEntidadDireccion,
  useActualizarEntidadContacto,
  useInsertarEntidadIdentificacion,
  useActualizarEntidadIdentificacion,
} from "@/hooks/Bpm";
import { EntidadPublicForm, renderContactoOption } from "@/pages/Embarques/components/Entidades/entidadFormUI";
import BannerInformativo from "../banner";
import DialogComponent from "@/components/Dialog/DialogComponent";
import NuevoContactoEntidad from "@/pages/Embarques/components/Entidades/modalEntidad/nuevoContactoEntidad";
import { buildCoordPayload, getEmbarqueId, refreshCoordinationSharedData } from "./payloadUtils";

const REQUIRED_KEYS = new Set(["numero", "direccionFiscal", "clienteContactoEmail", "clienteContactoTelefono"]);

const pick = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
};

// Quita los inactivos; si todos estan inactivos devuelve la lista original para no
// dejar los selectores vacíos.
const onlyActive = (arr = []) => {
  const activos = arr.filter((x) => x.cod_estado === 1);
  return activos.length ? activos : arr;
};

const dedupeByValue = (opts = []) => {
  const seen = new Set();
  return opts.filter((o) => (seen.has(o.value) ? false : (seen.add(o.value), true)));
};

// Dirección a precargar: FACTURACION (12) → FISCAL (11) → primera disponible,
// priorizando direcciones activas.
const findFiscalDireccion = (dirs = []) => {
  const pool = onlyActive(dirs);
  return (
    pool.find((d) => d.cod_tipo === 12) ||
    pool.find((d) => d.cod_tipo === 11) ||
    pool[0] ||
    null
  );
};

// NIT a precargar: identificación cuyo nombre sea "NIT", luego por código
// conocido (46 / 3), luego la primera disponible.
const findNit = (idents = []) => {
  const pool = onlyActive(idents);
  return (
    pool.find((i) => String(i.nom_identificacion || "").toLowerCase() === "nit") ||
    pool.find((i) => ["46", "3"].includes(String(i.cod_identificacion))) ||
    pool[0] ||
    null
  );
};

const extractContactoTipoList = (contacto) => {
  if (!contacto) return [];
  let raw = contacto.data_entidad_contacto_tipo ?? [];
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => String(t.cod_tipo ?? t.COD_TIPO ?? t)).filter(Boolean);
};

/**
 * Sección de Facturación privada (gestión de embarques). Mismo diseño y campos
 * que FacturacionPublica (CTS): selector de entidad de facturación, país/ciudad/
 * industria, dirección fiscal, contacto (selector + tipos) e identificación.
 * A diferencia de esa, esta persiste directamente contra la entidad/coordinación
 * (no hay carta de instrucciones pública en este flujo).
 */
const FacturacionSection = ({
  embarque_id = null,
  embarqueData: propEmbarqueData = null,
  onValidityChange = null,
  onValuesChange = null,
  codIdentificacion = null,
}) => {
  const codIdent = codIdentificacion ?? 3;
  const { cod_usuario } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();

  const { data: fetchedData = null, isLoading: isLoadingEmbarque } = useCoordinacionData(
    embarque_id,
    { enabled: !propEmbarqueData },
  );
  const embarqueData = propEmbarqueData ?? fetchedData;

  const entidadIdCliente = useMemo(
    () => embarqueData?.ENTIDAD_ID_CLI ?? embarqueData?.entidad_id_cli ?? embarqueData?.entidadIdCli ?? null,
    [embarqueData],
  );

  const contactoIdCliente = useMemo(
    () => embarqueData?.contactoIdCliente ?? embarqueData?.contacto_id_cliente ?? null,
    [embarqueData],
  );

  const empresaIdFromDetalles = useMemo(
    () => embarqueData?.empresa_id ?? embarqueData?.EMPRESA_ID ?? embarqueData?.empresaId ?? embarqueData?.cod_empresa ?? embarqueData?.COD_EMPRESA ?? null,
    [embarqueData],
  );

  const centroCostoIdFromDetalles = useMemo(
    () => embarqueData?.cencos_id ?? embarqueData?.CENCOS_ID ?? embarqueData?.cencosId ?? embarqueData?.cod_cc ?? embarqueData?.COD_CC ?? null,
    [embarqueData],
  );

  // El mismo entidad_id de cliente puede existir como CLIENTE (cod_tipo 3) o
  // como PRE-CLIENTE (cod_tipo 5); recuperar-datos-entidad filtra por ese
  // cod_tipo, así que hay que resolverlo primero.
  const { data: clienteEntidades = [], isSuccess: clienteQueryDone } = useFetchEntidades(
    { tipo_entidad: "CLIENTE", entidad_id: entidadIdCliente },
    { enabled: Boolean(entidadIdCliente) },
  );
  const esPreCliente = clienteQueryDone && clienteEntidades.length === 0;
  const codTipoCliente = clienteEntidades?.[0]?.cod_tipo ?? (esPreCliente ? 5 : 3);
  const tituloCliente = esPreCliente ? "Pre-Cliente" : "Cliente";

  const { data: entidadData, isLoading: entidadLoading } = useFetchDatosEntidad(
    { entidad_id: entidadIdCliente, cod_tipo: codTipoCliente },
    { enabled: Boolean(entidadIdCliente) && clienteQueryDone },
  );

  const contactoOptions = useMemo(
    () => dedupeByValue(
      onlyActive(entidadData?.data_contactos || []).map((c) => ({
        value: String(c.entidadcontacto_id),
        label: `Nombre: ${c.entidadcontacto_nombre || "-"}  |  Email: ${c.entidadcontacto_email || "-"}  |  Teléfono: ${c.entidadcontacto_telefono || "-"}`,
        nombre: c.entidadcontacto_nombre,
        email: c.entidadcontacto_email,
        telefono: c.entidadcontacto_telefono,
      })),
    ),
    [entidadData],
  );

  const baseValues = useMemo(() => {
    const entity = entidadData?.data_entidad?.[0] || null;
    const contacto =
      (entidadData?.data_contactos || []).find(
        (c) => String(c.entidadcontacto_id) === String(contactoIdCliente),
      ) ||
      entidadData?.data_contactos?.[0] ||
      null;
    const direccion = findFiscalDireccion(entidadData?.data_direcciones || []);
    const nit = findNit(entidadData?.data_identificaciones || []);

    return {
      entidad_id: String(pick(entity?.entidad_id, entidadIdCliente) || ""),
      cliente: entity?.entidad_nombre || "",
      entidadcontacto_id: contacto ? String(contacto.entidadcontacto_id) : "",
      clienteContacto: contacto?.entidadcontacto_nombre || "",
      clienteContactoEmail: contacto?.entidadcontacto_email || "",
      clienteContactoTelefono: contacto?.entidadcontacto_telefono || "",
      direccionFiscal: direccion?.entidaddireccion_direccion || "",
      numero: nit?.entidadidentificacio_numero || "",
    };
  }, [entidadData, entidadIdCliente, contactoIdCliente]);

  const [values, setValues] = useState(baseValues);

  const baseSig = useMemo(() => JSON.stringify(baseValues), [baseValues]);
  const lastBaseSig = useRef(null);
  useEffect(() => {
    if (lastBaseSig.current === baseSig) return;
    lastBaseSig.current = baseSig;
    setValues(baseValues);
  }, [baseSig, baseValues]);

  const [openCrearContacto, setOpenCrearContacto] = useState(false);

  const handleContactoCreada = useCallback((resultado) => {
    const saved = resultado?.data;
    if (saved) {
      setValues((prev) => ({
        ...prev,
        entidadcontacto_id: saved.entidadcontacto_id ? String(saved.entidadcontacto_id) : prev.entidadcontacto_id,
        clienteContacto: saved.entidadcontacto_nombre || "",
        clienteContactoEmail: saved.entidadcontacto_email || "",
        clienteContactoTelefono: saved.entidadcontacto_telefono || "",
      }));
    }
    setOpenCrearContacto(false);
    if (entidadIdCliente) {
      queryClient.invalidateQueries({ queryKey: ["datos-entidad", { entidad_id: entidadIdCliente, cod_tipo: codTipoCliente }] });
    }
  }, [entidadIdCliente, codTipoCliente, queryClient]);

  const nuevoContactoAction = useMemo(() => ({
    visible: true, enabled: true, nombre: "Nuevo", icono: "c-suma",
    onClick: () => setOpenCrearContacto(true),
  }), []);

  const fields = useMemo(() => {
    const raw = [
      { key: "__sec_info__", type: "section", label: "Información", colSpan: "span 12" },
      { key: "cliente", label: "Nombre", type: "text", colSpan: "span 12" },
      { key: "__sec_dir__", type: "section", label: "Dirección Fiscal", colSpan: "span 12" },
      { key: "direccionFiscal", label: "Dirección Fiscal", type: "text", colSpan: "span 12" },
      { key: "__sec_con__", type: "section", label: "Contacto", colSpan: "span 12" },
      { key: "entidadcontacto_id", label: "Seleccionar Contacto", type: "select", colSpan: "span 10", options: contactoOptions, renderOption: renderContactoOption },
      { key: "__btn_nuevo_contacto__", type: "button", colSpan: "span 2", action: nuevoContactoAction },
      { key: "clienteContacto", label: "Nombre Contacto", type: "text", colSpan: "span 4" },
      { key: "clienteContactoEmail", label: "Email", type: "email", colSpan: "span 4" },
      { key: "clienteContactoTelefono", label: "Teléfono", type: "text", colSpan: "span 4" },
      { key: "__sec_nit__", type: "section", label: "Identificación", colSpan: "span 12" },
      { key: "numero", label: "NIT", type: "text", colSpan: "span 12" },
    ];
    return raw.map((f) => ({ ...f, required: REQUIRED_KEYS.has(f.key) || f.required }));
  }, [contactoOptions, nuevoContactoAction]);

  const handleFieldChange = useCallback((key, value) => {
    if (key === "entidadcontacto_id") {
      const contacto = (entidadData?.data_contactos || []).find((c) => String(c.entidadcontacto_id) === String(value));
      return {
        clienteContacto: contacto?.entidadcontacto_nombre || "",
        clienteContactoEmail: contacto?.entidadcontacto_email || "",
        clienteContactoTelefono: contacto?.entidadcontacto_telefono || "",
      };
    }
    return {};
  }, [entidadData]);

  const handleValuesChange = useCallback((next) => {
    setValues((prev) => ({ ...prev, ...next }));
  }, []);

  const isValid = useMemo(() => Boolean(
    values.numero &&
    values.direccionFiscal &&
    values.clienteContactoEmail &&
    values.clienteContactoTelefono,
  ), [values]);

  const hasChanges = useMemo(
    () => Object.keys(baseValues).some((k) => String(values[k] ?? "") !== String(baseValues[k] ?? "")),
    [values, baseValues],
  );

  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;
  const lastValiditySig = useRef(null);
  useEffect(() => {
    if (typeof onValidityChangeRef.current !== "function") return;
    let next;
    if (esPreCliente && isValid && !hasChanges) {
      next = "pre-cliente";
    } else if (isValid && !hasChanges) {
      next = true;
    } else if (isValid) {
      next = "pending";
    } else {
      next = false;
    }
    const sig = `${next}|${hasChanges}`;
    if (lastValiditySig.current === sig) return;
    lastValiditySig.current = sig;
    onValidityChangeRef.current(next);
  }, [isValid, hasChanges, esPreCliente]);

  useEffect(() => {
    if (typeof onValuesChange === "function") {
      onValuesChange({ cliente: values });
    }
  }, [values, onValuesChange]);

  const { mutateAsync: actualizarCoordinacion } = useUpdateCoordinacion();
  const { mutateAsync: insertarDireccion } = useInsertarEntidadDireccion();
  const { mutateAsync: actualizarDireccion } = useActualizarEntidadDireccion();
  const { mutateAsync: actualizarContacto } = useActualizarEntidadContacto();
  const { mutateAsync: insertarIdentificacion } = useInsertarEntidadIdentificacion();
  const { mutateAsync: actualizarIdentificacion } = useActualizarEntidadIdentificacion();

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const handleGuardar = useCallback(async () => {
    if (saving || !isValid || !embarqueData) return;

    const embarqueId = getEmbarqueId(embarqueData);
    if (!embarqueId) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const entity = entidadData?.data_entidad?.[0] || null;
      const entidadIdActual = Number(values.entidad_id) || entidadIdCliente;

      const direccionExistente = findFiscalDireccion(entidadData?.data_direcciones || []);
      const direccionPayload = {
        entidad_id: entidadIdActual,
        cod_tipo: direccionExistente?.cod_tipo || 12,
        entidaddireccion_direccion: values.direccionFiscal || "",
        cod_estado: 1,
      };
      if (direccionExistente?.entidaddireccion_id) {
        await actualizarDireccion({ ...direccionPayload, entidaddireccion_id: Number(direccionExistente.entidaddireccion_id) });
      } else {
        await insertarDireccion(direccionPayload);
      }

      if (values.entidadcontacto_id) {
        await actualizarContacto({
          entidadcontacto_id: Number(values.entidadcontacto_id),
          entidad_id: entidadIdActual,
          cod_tipo: codTipoCliente,
          cod_emp: empresaIdFromDetalles,
          cod_cc: centroCostoIdFromDetalles,
          entidadcontacto_nombre: values.clienteContacto || "",
          entidadcontacto_email: values.clienteContactoEmail || "",
          entidadcontacto_telefono: values.clienteContactoTelefono || "",
          cod_estado: 1,
        });
      }

      const nitExistente = findNit(entidadData?.data_identificaciones || []);
      if (nitExistente?.entidadidentificacion_id) {
        await actualizarIdentificacion({
          entidadidentificacion_id: Number(nitExistente.entidadidentificacion_id),
          entidad_id: entidadIdActual,
          cod_identificacion: nitExistente.cod_identificacion || codIdent,
          entidadidentificacio_numero: values.numero || "",
          cod_estado: nitExistente.cod_estado ?? 1,
          entidadidentificacion_fecha_inicio: nitExistente.entidadidentificacion_fecha_inicio || null,
          entidadidentificacion_fecha_fin: nitExistente.entidadidentificacion_fecha_fin || null,
          entidadidentificacion_ruta: nitExistente.entidadidentificacion_ruta || null,
        });
      } else if (values.numero) {
        await insertarIdentificacion({
          entidad_id: entidadIdActual,
          cod_identificacion: codIdent,
          entidadidentificacio_numero: values.numero || "",
          cod_estado: 1,
          entidadidentificacion_fecha_inicio: null,
          entidadidentificacion_fecha_fin: null,
          entidadidentificacion_ruta: null,
        });
      }

      const finalPayload = buildCoordPayload(
        embarqueData,
        { nit_exp: values.numero || "", direccion_exp: values.direccionFiscal || "" },
        cod_usuario,
      );
      await actualizarCoordinacion(finalPayload);
      await refreshCoordinationSharedData(queryClient, embarqueId, finalPayload);

      queryClient.invalidateQueries({ queryKey: ["datos-entidad", { entidad_id: entidadIdCliente, cod_tipo: codTipoCliente }] });
      queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });

      setSaveMessage("Datos guardados correctamente");
    } catch (err) {
      console.error("Error al guardar Facturación:", err);
      setSaveMessage("Error guardando información");
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    isValid,
    embarqueData,
    entidadData,
    values,
    entidadIdCliente,
    codTipoCliente,
    empresaIdFromDetalles,
    centroCostoIdFromDetalles,
    codIdent,
    cod_usuario,
    actualizarCoordinacion,
    actualizarDireccion,
    insertarDireccion,
    actualizarContacto,
    actualizarIdentificacion,
    insertarIdentificacion,
    queryClient,
  ]);

  const estadoFormulario = useMemo(() => {
    if (isValid && !hasChanges) return null;
    if (isValid) {
      return { severidad: "info", titulo: "Pendiente de guardar", mensaje: "La facturación está completa, pero aún no se ha guardado." };
    }
    return { severidad: "warning", titulo: "Faltan completar campos", mensaje: "Complete los datos obligatorios de facturación para continuar." };
  }, [isValid, hasChanges]);

  if (entidadLoading || isLoadingEmbarque) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", minHeight: "100%" }}>
      <BannerInformativo
        ocultar={!esPreCliente}
        severidad="error"
        titulo="Pre-cliente pendiente"
        mensaje="El pre-cliente debe convertirse en cliente."
      />
      {estadoFormulario && (
        <BannerInformativo
          severidad={estadoFormulario.severidad}
          titulo={estadoFormulario.titulo}
          mensaje={estadoFormulario.mensaje}
        />
      )}

      <Box sx={{ flex: "1 1 560px", minWidth: 0 }}>
        <EntidadPublicForm
          title={`Facturación - ${tituloCliente}`}
          fields={fields}
          initialValues={values}
          onValuesChange={handleValuesChange}
          onFieldChange={handleFieldChange}
          onSave={handleGuardar}
          isSaving={saving}
          disabled={!isValid}
          hideHeader
        />
      </Box>

      <BannerInformativo
        ocultar={!saveMessage}
        severidad={saveMessage?.includes("Error") ? "error" : "success"}
        mensaje={saveMessage}
        sx={{ mt: 1, mb: 0 }}
      />

      <DialogComponent
        titulo="Nuevo Contacto (Facturación)"
        openDialog={openCrearContacto}
        handleClose={() => setOpenCrearContacto(false)}
        width="50vw"
        height="auto"
      >
        <NuevoContactoEntidad
          entidadId={entidadIdCliente || null}
          codTipo={codTipoCliente}
          codEmp={empresaIdFromDetalles}
          codCc={centroCostoIdFromDetalles}
          onSubmit={handleContactoCreada}
        />
      </DialogComponent>
    </Box>
  );
};

FacturacionSection.propTypes = {
  embarque_id: PropTypes.number,
  embarqueData: PropTypes.object,
  onValidityChange: PropTypes.func,
  onValuesChange: PropTypes.func,
  codIdentificacion: PropTypes.number,
};

export default FacturacionSection;
