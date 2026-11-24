import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Button, Icon } from "@mui/material";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import FormularioAlternativo, { ModernFormHeader } from "../../../../components/bpm/Formularios/FormularioAlternativo";
import FormularioConGuardar from "./formularioConGuardar";
import { useUpdateCoordinacion, useFetchEntidades, useFetchEntidadContacto, useCoordinacionData } from "@/hooks/Bpm";
import { buildCoordPayload, getEmbarqueId, refreshCoordinationSharedData } from "./payloadUtils";
import BannerInformativo from "../banner";
import ClienteComparePanel from "@/pages/Embarques/components/Entidades/EntidadComparePanel";

const NOTIF_COMPARE_FIELDS = [
    { label: "Nombre", key: "nombre" },
    { label: "Email", key: "email" },
    { label: "Teléfono", key: "telefono" },
];

// Mismo lenguaje visual que Shipper/Consignatario (ModernFormHeader + sección +
// grilla de 3 columnas en desktop) — ver EntidadFormHeader/buildEntidadFields
// en entidadFormUI.jsx.
export const NOTIFICACIONES_FIELDS = [
    { key: "__section_notificaciones__", type: "section", label: "Notificar a", icon: "c-campana", colSpan: "span 12" },
    { key: "nombre", label: "Nombre", required: true, colSpan: { sm: "span 12", md: "span 4" } },
    { key: "email", label: "Email", required: true, type: "text", colSpan: { sm: "span 12", md: "span 4" } },
    { key: "telefono", label: "Telefono", required: true, colSpan: { sm: "span 12", md: "span 4" } },
];

export const NotificacionesForm = ({
    initialValues,
    onValuesChange,
    onSave,
    isSaving,
    topContent,
}) => (
    <FormularioConGuardar guardando={isSaving} onGuardar={onSave} variant="modern">
        <ModernFormHeader
            icon="c-campana"
            title="Notificaciones"
            subtitle="Indica a quién debemos notificar sobre el estado del embarque."
        />
        {topContent}
        <FormularioAlternativo
            title="Notificar a"
            initialValues={initialValues}
            fields={NOTIFICACIONES_FIELDS}
            onValuesChange={onValuesChange}
            showSubmitButton={false}
            hideHeader
            variant="modern"
        />
    </FormularioConGuardar>
);

NotificacionesForm.propTypes = {
    initialValues: PropTypes.object,
    onValuesChange: PropTypes.func,
    onSave: PropTypes.func,
    isSaving: PropTypes.bool,
    topContent: PropTypes.node,
};

const DEFAULT_VALUES = { nombre: "", email: "", telefono: "" };

const validateValues = (vals) => Boolean(vals.nombre && vals.email && vals.telefono);

const getFirstValue = (source, keys) => {
    if (!source) return "";

    for (const key of keys) {
        const value = source[key];
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return "";
};

const getConsignatarioEntityId = (source) => {
    const rawValue = getFirstValue(source, [
        "entidadIdConsignatario",
        "entidad_id_consignatario",
        "ENTIDAD_ID_CONSIGNATARIO",
        "cod_entidad_consignatario",
        "COD_ENTIDAD_CONSIGNATARIO",
        "entidadidconsignatario",
        "codentidadconsignatario",
    ]);

    if (rawValue === "" || rawValue === null || rawValue === undefined) return "";

    const normalized = String(rawValue).trim();
    if (!normalized || normalized === "0" || normalized.toLowerCase() === "null") return "";

    return normalized;
};

const NotificacionesSection = ({ initialValues, embarque_id = null, clienteData = null, onValuesChange, onValidityChange }) => {
    const { data: embarqueData = null, isFetching: isFetchingCoordinacion } = useCoordinacionData(embarque_id);

    const computedInitial = useMemo(() => {
        if (initialValues) return initialValues;
        const raw =
            embarqueData?.json_datos_opcionales ||
            embarqueData?.jsonDatosOpcionales ||
            embarqueData?.json_atributos_opcionales ||
            embarqueData?.jsonAtributosOpcionales ||
            embarqueData?.notificaciones ||
            embarqueData?.NOTIFICACIONES ||
            null;

        if (raw) {
            try {
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

                const note = parsed?.notificaciones ? parsed.notificaciones : parsed;
                if (note && typeof note === "object") {
                    return { ...DEFAULT_VALUES, ...note };
                }
            } catch (e) {
                console.warn("Failed to parse notificaciones JSON", e);
            }
        }
        return DEFAULT_VALUES;
    }, [initialValues, embarqueData]);

    const [values, setValues] = useState(computedInitial);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const { cod_usuario } = useSelector((state) => state.auth);
    const queryClient = useQueryClient();
    const { mutateAsync: actualizarCoordinacion } = useUpdateCoordinacion();

    // --- Hooks para copiar datos del consignatario ---
    const consignatarioEntityId = useMemo(() => getConsignatarioEntityId(embarqueData), [embarqueData]);

    const entityIdParaCopiar = consignatarioEntityId;

    const {
        data: entidadesParaCopiar = [],
        refetch: refetchEntidadesParaCopiar,
    } = useFetchEntidades(
        { tipo_entidad: "consignatario", entidad_id: entityIdParaCopiar },
        { enabled: Boolean(entityIdParaCopiar) },
    );

    const entidadParaCopiarObj = useMemo(() => {
        if (!entityIdParaCopiar || !entidadesParaCopiar.length) return null;
        return entidadesParaCopiar[0] ?? null;
    }, [entidadesParaCopiar, entityIdParaCopiar]);

    const COD_TIPO_CONSIGNATARIO = 156;

    const {
        data: contactosParaCopiarResp = {},
        refetch: refetchContactosParaCopiar,
    } = useFetchEntidadContacto(
        { cod_tipo: COD_TIPO_CONSIGNATARIO, entidad_id: entityIdParaCopiar },
        { enabled: Boolean(COD_TIPO_CONSIGNATARIO && entityIdParaCopiar) },
    );

    useEffect(() => {
        if (typeof onValuesChange === "function") {
            onValuesChange(values);
        }
    }, [values, onValuesChange]);

    useEffect(() => {
        if (typeof onValidityChange === "function") {
            const savedValid = validateValues(computedInitial);
            const localValid = validateValues(values);
            let validityStatus;

            if (savedValid) {
                validityStatus = true;
            } else if (localValid) {
                validityStatus = "pending";
            } else {
                validityStatus = false;
            }

            onValidityChange(validityStatus);
        }
    }, [computedInitial, values, onValidityChange]);
    useEffect(() => {
        setValues(computedInitial);
    }, [computedInitial]);

    const hasEmbId = Boolean(getEmbarqueId(embarqueData));

    // custom validation that also requires embarque id
    const validateSection = (vals) => validateValues(vals) && hasEmbId;

    const savedValid = validateValues(computedInitial);
    const localValid = validateValues(values);
    const estadoFormulario = savedValid ? null : {
        severidad: localValid ? "info" : "warning",
        titulo: localValid ? "Pendiente de guardar" : "Faltan completar campos",
        mensaje: localValid
            ? "Las notificaciones estan completas, pero aun no se han guardado."
            : "Complete nombre, email y telefono para continuar.",
    };

    const handleCopiarConsignatario = async () => {

        if (!entityIdParaCopiar) {
            if (isFetchingCoordinacion) {
                setSaveMessage("Cargando datos de coordinacion. Intente copiar de nuevo en un momento.");
                return;
            }
            setSaveMessage(`No se encontró entidad_id_consignatario en la coordinación.`);
            return;
        }

        const firstEntidad = (source) => (Array.isArray(source) ? source[0] || null : null);
        const firstContacto = (source) => source?.data?.[0] || null;

        let entidadObj = entidadParaCopiarObj || firstEntidad(entidadesParaCopiar);
        let firstContact = firstContacto(contactosParaCopiarResp);

        if (!entidadObj || !firstContact) {
            const [entidadesRefetchResp, contactosRefetchResp] = await Promise.all([
                !entidadObj ? refetchEntidadesParaCopiar() : Promise.resolve(null),
                !firstContact ? refetchContactosParaCopiar() : Promise.resolve(null),
            ]);

            if (!entidadObj) {
                entidadObj = firstEntidad(entidadesRefetchResp?.data);
            }

            if (!firstContact) {
                firstContact = firstContacto(contactosRefetchResp?.data);
            }
        }

        if (!entidadObj && !firstContact) {
            setSaveMessage(`No se encontraron datos del consignatario.`);
            return;
        }

        const nombre = (entidadObj?.entidad_nombre || "").trim();
        const email = (firstContact?.entidadcontacto_email || "").trim();
        const telefono = (firstContact?.entidadcontacto_telefono || "").trim();

        if (!nombre && !email && !telefono) {
            setSaveMessage(`No se encontraron datos de consignatario para copiar.`);
            return;
        }

        setValues((prev) => ({
            ...prev,
            nombre: nombre || prev.nombre,
            email: email || prev.email,
            telefono: telefono || prev.telefono,
        }));

        setSaveMessage(`Se completaron los datos de notificaciones desde consignatario.`);
    };

    // ── Comparación con lo que el cliente envió en la carta pública ──
    const [clienteUndoStash, setClienteUndoStash] = useState({});

    const clienteCompareRows = useMemo(() => {
        if (!clienteData) return [];
        const modificados = Array.isArray(clienteData._modificados) ? clienteData._modificados : [];
        return NOTIF_COMPARE_FIELDS.map((def) => {
            const clienteValue = clienteData[def.key] ?? "";
            const currentValue = values?.[def.key] ?? "";
            const iguales = String(currentValue ?? "") === String(clienteValue ?? "");
            return {
                label: def.label,
                configKey: def.key,
                clienteValue,
                currentValue,
                modificado: modificados.includes(def.key),
                iguales,
                puedeDeshacer: Object.hasOwn(clienteUndoStash, def.key) && iguales,
            };
        });
    }, [clienteData, values, clienteUndoStash]);

    const mostrarComparacion = clienteCompareRows.some((row) => row.modificado);

    const handleAcceptClienteField = (key, value) => {
        if (!key) return;
        setClienteUndoStash((stash) => (Object.hasOwn(stash, key) ? stash : { ...stash, [key]: values?.[key] ?? "" }));
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleAcceptAllClienteFields = () => {
        const stashAdd = {};
        clienteCompareRows.forEach((row) => {
            if (row.modificado && !row.iguales) {
                stashAdd[row.configKey] = values?.[row.configKey] ?? "";
            }
        });
        setClienteUndoStash((stash) => ({ ...stashAdd, ...stash }));
        setValues((prev) => {
            const next = { ...prev };
            clienteCompareRows.forEach((row) => {
                if (row.modificado) next[row.configKey] = row.clienteValue;
            });
            return next;
        });
    };

    const handleUndoClienteField = (key) => {
        if (!Object.hasOwn(clienteUndoStash, key)) return;
        const prevValue = clienteUndoStash[key];
        setValues((prev) => ({ ...prev, [key]: prevValue }));
        setClienteUndoStash((stash) => {
            const next = { ...stash };
            delete next[key];
            return next;
        });
    };

    const handleUndoAllClienteFields = () => {
        setValues((prev) => {
            const next = { ...prev };
            for (const [key, prevValue] of Object.entries(clienteUndoStash)) {
                next[key] = prevValue;
            }
            return next;
        });
        setClienteUndoStash({});
    };

    const handleGuardar = async (vals) => {
        setSaveMessage(null);
        if (saving) return;
        if (!validateValues(vals)) {
            setSaveMessage("Complete todos los campos antes de guardar.");
            return;
        }
        if (!embarqueData) {
            setSaveMessage("No hay datos de embarque para actualizar.");
            return;
        }

        const embarqueId = getEmbarqueId(embarqueData);
        if (!embarqueId) {
            setSaveMessage("El embarque no tiene identificador válido.");
            return;
        }

        let newJson = {};
        const existingRaw =
            embarqueData?.json_datos_opcionales ||
            embarqueData?.jsonDatosOpcionales ||
            embarqueData?.json_atributos_opcionales ||
            embarqueData?.jsonAtributosOpcionales ||
            null;
        if (existingRaw) {
            try {
                newJson = typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw;
            } catch (e) {
                console.warn("Unable to parse existing optional JSON (json_datos_opcionales or legacy json_atributos_opcionales)", e);
            }
        }

        newJson = {
            ...newJson,
            notificaciones: {
                ...newJson.notificaciones,
                ...vals,
            },
        };

        const finalPayload = buildCoordPayload(
            embarqueData,
            { json_datos_opcionales: newJson },
            cod_usuario,
        );

        try {
            setSaving(true);
            await actualizarCoordinacion(finalPayload);
            await refreshCoordinationSharedData(queryClient, embarqueId, finalPayload);
            queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas", String(embarqueId)] });
            setSaveMessage("Guardado correctamente");
        } catch (err) {
            console.error("Error guardando notificaciones:", err);
            setSaveMessage("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {estadoFormulario && (
                <BannerInformativo
                    severidad={estadoFormulario.severidad}
                    titulo={estadoFormulario.titulo}
                    mensaje={estadoFormulario.mensaje}
                />
            )}

            <Box sx={{ display: "flex", gap: 3, alignItems: { xs: "stretch", md: "flex-start" }, flexDirection: { xs: "column", md: "row" }, flexWrap: "wrap" }}>
                <Box sx={{ flex: "1 1 560px", minWidth: 0 }}>
                    <FormularioConGuardar guardando={saving} onGuardar={() => handleGuardar(values)} variant="modern">
                        <ModernFormHeader
                            icon="c-campana"
                            title="Notificaciones"
                            subtitle="Indica a quién debemos notificar sobre el estado del embarque."
                        />
                        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
                            <Button size="small" variant="outlined" onClick={handleCopiarConsignatario} startIcon={<Icon className="c-copiar" sx={{ color: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined) }} fontSize="small" />}>
                                Copiar consignatario
                            </Button>
                        </Box>
                        <FormularioAlternativo
                            title="Notificar a"
                            initialValues={values}
                            fields={NOTIFICACIONES_FIELDS}
                            validate={validateSection}
                            onValuesChange={setValues}
                            showSubmitButton={false}
                            hideHeader
                            variant="modern"
                        />
                    </FormularioConGuardar>
                </Box>

                {clienteData && mostrarComparacion && (
                    <Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
                        <ClienteComparePanel
                            titulo="Notificaciones"
                            showEntity={false}
                            rows={clienteCompareRows}
                            onAcceptField={handleAcceptClienteField}
                            onAcceptAllFields={handleAcceptAllClienteFields}
                            onUndoField={handleUndoClienteField}
                            onUndoAllFields={handleUndoAllClienteFields}
                        />
                    </Box>
                )}
            </Box>

            <BannerInformativo
                ocultar={!saveMessage}
                severidad={saveMessage?.includes("Error") || saveMessage?.includes("Complete") || saveMessage?.includes("No ") || saveMessage?.includes("no ") ? "warning" : "success"}
                mensaje={saveMessage}
                sx={{ mt: 1, mb: 0 }}
            />
        </>
    );
};

NotificacionesSection.propTypes = {
    initialValues: PropTypes.object,
    embarque_id: PropTypes.number,
    clienteData: PropTypes.object,
    onValuesChange: PropTypes.func,
    onValidityChange: PropTypes.func,
};

export default NotificacionesSection;
