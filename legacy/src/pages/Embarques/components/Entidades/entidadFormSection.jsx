import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { api } from "@/api";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import FormularioAlternativo from "@/components/bpm/Formularios/FormularioAlternativo";
import FormularioConGuardar from "../secciones/formularioConGuardar";
import BannerInformativo from "../banner";
import ClienteComparePanel from "./EntidadComparePanel";
import DialogComponent from "@/components/Dialog/DialogComponent";
import NuevoContactoEntidad from "./modalEntidad/nuevoContactoEntidad";
import { buildEntidadFields, EntidadFormHeader } from "./entidadFormUI";
import { useFetchCiudades, useFetchIndustrias } from "@/hooks/Fetch/useFetchCatalog";
import {
    useFetchEntidadContacto,
    useFetchEntidadesDireccion,
    useFetchEntidadIdentificacion,
    useFetchEntidades,
    useFetchDatosEntidad,
    useFetchDatosEntidadRelacionadaAppweb,
    useInsertarEntidadRelacion,
    useInsertarEntidadDireccion,
    useInsertarEntidadContacto,
    useInsertarEntidadIdentificacion,
    useActualizarEntidadDireccion,
    useActualizarEntidadContacto,
    useActualizarEntidadIdentificacion,
    useUpdateCoordinacion,
    useCoordinacionData,
    useFetchPaises,
    useFetchDepartamentos,
    useFetchMunicipios,
    useFetchTipos,
} from "@/hooks/Bpm";
import { buildCoordPayload, getEmbarqueId, refreshCoordinationSharedData } from "../secciones/payloadUtils";

const NO_RESULTS_OPTION = {
    value: "___NO_RESULTS___",
    label: "No se encontraron entidades",
};

const getFirstExistingValue = (source, keys = [], fallback = "") => {
    if (!source || !Array.isArray(keys)) return fallback;

    for (const key of keys) {
        const value = source[key];
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }

    return fallback;
};

const normalizeRelationLabel = (value) => String(value || "")
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

// `entidad_nombre` a veces llega vac\u00edo (p.ej. entidades creadas como "candidato"),
// pero el nombre real vive en `data_nombres[0]`. Sin este fallback, esas entidades
// quedan sin label en el selector (mismo patr\u00f3n que entidadPublicFormSection.jsx).
const resolveEntidadNombre = (ent) =>
    ent?.entidad_nombre || ent?.data_nombres?.[0]?.entidadnombre_nombre || "";

const buildDiffState = (nextValues, previousValues) => {
    if (!nextValues || typeof nextValues !== "object") return previousValues;
    if (!previousValues || typeof previousValues !== "object") return { ...nextValues };

    const diffs = {};

    for (const key of Object.keys(nextValues)) {
        const nextValue = nextValues[key];
        const prevValue = previousValues[key];

        if (nextValue !== prevValue) {
            diffs[key] = nextValue;
        }
    }

    if (Object.keys(diffs).length === 0) {
        return previousValues;
    }

    return {
        ...previousValues,
        ...diffs,
    };
};

const shallowEqual = (a, b) => {
    if (a === b) return true;
    if (!a || !b) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
        if (a[key] !== b[key]) return false;
    }
    return true;
};

// Extrae los códigos de tipo de contacto que vienen como JSON string
// (por ejemplo data_entidad_contacto_tipo) o como array de objetos.
const extractContactoTipoList = (contacto) => {
    if (!contacto) return [];

    let raw = contacto.data_entidad_contacto_tipo ?? contacto.lista_cod_tipo ?? [];
    if (typeof raw === "string") {
        try {
            raw = JSON.parse(raw);
        } catch {
            raw = [];
        }
    }
    if (!Array.isArray(raw)) return [];

    return raw
        .map((t) => String(t.cod_tipo ?? t.COD_TIPO ?? t))
        .filter(Boolean);
};

const VALIDITY_STATUS = {
    VALID: "valid",
    PENDING: "pending",
    INVALID: "invalid",
};

// Lee un valor del bloque que el cliente envió en la carta pública, probando
// varias claves candidatas (el público y el privado nombran distinto).
const getClienteValue = (clienteData, keys = []) => {
    if (!clienteData) return "";
    for (const key of keys) {
        const value = clienteData[key];
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return "";
};

// Construye las filas de comparación (campo por campo) mapeando las claves
// canónicas del cliente a las claves del config de la sección privada.
const normalizeCompareValue = (v) => {
    if (Array.isArray(v)) return [...v].map(String).sort((a, b) => a.localeCompare(b)).join(",");
    return String(v ?? "");
};

// Resuelve un valor (o lista de ids) contra una lista de opciones {value,label},
// devolviendo el label legible. Si no hay match, devuelve el valor original.
const resolveCatalogLabel = (rawValue, options) => {
    if (rawValue === undefined || rawValue === null || rawValue === "") return "";
    if (!Array.isArray(options) || options.length === 0) {
        return Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue);
    }

    const findLabel = (v) => {
        const found = options.find(
            (opt) => String(opt.value) === String(v),
        );
        return found ? (found.label || String(v)) : String(v);
    };

    if (Array.isArray(rawValue)) {
        return rawValue.map(findLabel).join(", ");
    }
    return findLabel(rawValue);
};

const buildClienteCompareRows = (clienteData, config, values, catalogs = {}) => {
    if (!clienteData) return [];

    const modificados = Array.isArray(clienteData._modificados) ? clienteData._modificados : [];

    const seccionInfo = config.sectionLabel || config.title || "Información";

    const defs = [
        { label: "Nombre", clienteKeys: ["entidad_nombre", "nombre"], configKey: config.nombreField, section: seccionInfo },
        { label: "Dirección", clienteKeys: ["direccion_recoleccion", "direccion"], configKey: config.addressField, section: "Dirección" },
        { label: "País (dirección)", clienteKeys: ["direccion_recoleccion_pais"], configKey: config.addressCountryField, catalog: "paises", section: "Dirección" },
        { label: "Ciudad", clienteKeys: ["direccion_recoleccion_ciudad", config.ciudadField, "entidad_ciudad", "shipper_ciudad", "consignatario_ciudad"], configKey: config.ciudadField || config.addressCiudadField, catalog: "ciudades", section: config.ciudadField ? seccionInfo : "Dirección" },
        { label: "Departamento", clienteKeys: ["direccion_recoleccion_depto"], configKey: config.addressDeptoField, catalog: "departamentos", section: "Dirección" },
        { label: "Municipio", clienteKeys: ["direccion_recoleccion_muni"], configKey: config.addressMuniField, catalog: "municipios", section: "Dirección" },
        { label: "País (entidad)", clienteKeys: ["entidad_pais"], configKey: config.paisField, catalog: "paises", section: seccionInfo },
        { label: "Industria", clienteKeys: ["entidad_industria"], configKey: config.industriaField, catalog: "industrias", section: seccionInfo },
        { label: "Contacto", clienteKeys: ["entidad_contacto_nombre", "contacto", "contacto_nombre"], configKey: config.contactField, section: "Contacto" },
        { label: "Teléfono", clienteKeys: ["entidad_contacto_telefono", "telefono", "telefonos", "contacto_telefono"], configKey: config.phoneField, section: "Contacto" },
        { label: "Email", clienteKeys: ["entidad_contacto_email", "email", "contacto_email"], configKey: config.emailField, section: "Contacto" },
        { label: "Tipos de contacto", clienteKeys: ["_contacto_tipo_list"], configKey: "_contacto_tipo_list", catalog: "tiposContacto", section: "Contacto" },
        { label: "NIT", clienteKeys: ["entidad_nit", "nit", "identificacion_numero"], configKey: config.identNumeroField, section: "Identificación" },
    ];

    return defs
        .filter((def) => Boolean(def.configKey))
        .map((def) => {
            const clienteValue = getClienteValue(clienteData, def.clienteKeys);
            const currentValue = values[def.configKey] ?? "";
            const modificado = def.clienteKeys.some((key) => modificados.includes(key));
            
            const getFormattedLabel = (value, catalog) => {
                if (catalog && catalogs[catalog]) {
                    return resolveCatalogLabel(value, catalogs[catalog]);
                }
                return Array.isArray(value) ? value.join(", ") : value;
            };
            
            const clienteLabel = getFormattedLabel(clienteValue, def.catalog);
            const currentLabel = getFormattedLabel(currentValue, def.catalog);
            
            return {
                label: def.label,
                configKey: def.configKey,
                section: def.section,
                clienteValue,
                clienteLabel,
                currentValue,
                currentLabel,
                modificado,
                iguales: normalizeCompareValue(currentValue) === normalizeCompareValue(clienteValue),
            };
        });
};

const getPrefillEntityObj = (prefillEntityId, entidades, prefillEntidadDatos, detallesEmbarque, config) => {
    if (!prefillEntityId) return null;

    const inMain = entidades.find((ent) => String(ent.entidad_id) === String(prefillEntityId));
    if (inMain) return inMain;

    const fromById = (prefillEntidadDatos?.data_entidad || []).find(
        (ent) => String(ent.entidad_id) === String(prefillEntityId),
    );
    if (fromById) {
        return {
            ...fromById,
            entidad_nombre: resolveEntidadNombre({
                entidad_nombre: fromById.entidad_nombre,
                data_nombres: prefillEntidadDatos.data_nombres,
            }),
        };
    }

    const relationType = config?.relationType;
    const nombreKeysByRelation = {
        shipper: [
            "entidadShipperNombre",
            "entidad_shipper_nombre",
            "ENTIDAD_SHIPPER_NOMBRE",
        ],
        consignatario: [
            "entidadConsignatarioNombre",
            "entidad_consig_nombre",
            "ENTIDAD_CONSIG_NOMBRE",
        ],
    };
    const sectionNombreKeys = relationType && nombreKeysByRelation[relationType]
        ? nombreKeysByRelation[relationType]
        : [
            "entidadShipperNombre",
            "entidad_shipper_nombre",
            "ENTIDAD_SHIPPER_NOMBRE",
            "entidadConsignatarioNombre",
            "entidad_consig_nombre",
            "ENTIDAD_CONSIG_NOMBRE",
        ];
    const entityNombre = getFirstExistingValue(detallesEmbarque, sectionNombreKeys, "");
    const codTipoFallback = entidades[0]?.cod_tipo ?? null;

    if (entityNombre) {
        return {
            entidad_id: Number(prefillEntityId),
            entidad_nombre: entityNombre,
            cod_tipo: codTipoFallback,
        };
    }

    return null;
};

const getEntityOptions = (entidades, entidadesFetching, prefillEntityObj) => {
    if (entidadesFetching) {
        if (prefillEntityObj) {
            return [{ value: prefillEntityObj.entidad_id, label: resolveEntidadNombre(prefillEntityObj) }];
        }
        return [];
    }

    const base = (!entidades || entidades.length === 0)
        ? []
        : entidades.map((ent) => ({ value: ent.entidad_id, label: resolveEntidadNombre(ent) }));

    if (prefillEntityObj) {
        const alreadyIn = base.some((opt) => String(opt.value) === String(prefillEntityObj.entidad_id));
        if (!alreadyIn) {
            return [
                { value: prefillEntityObj.entidad_id, label: resolveEntidadNombre(prefillEntityObj) },
                ...base,
            ];
        }
    }

    return base.length === 0 ? [NO_RESULTS_OPTION] : base;
};

const getDireccionOptions = ({ direccionEnabled, direccionLocked, values, config, direccionesFiltradas }) => {
    if (direccionEnabled) {
        return direccionesFiltradas.map((direccion) => ({
            value: direccion.direccion,
            label: direccion.direccion,
        }));
    }

    if (direccionLocked && values[config.addressField]) {
        return [{
            value: values[config.addressField],
            label: values[config.addressField],
        }];
    }

    return [];
};

const resolveFieldChange = ({ key, value, config, direccionesFiltradas, contactosRespData }) => {
    if (value === NO_RESULTS_OPTION.value) {
        return { [key]: "" };
    }

    if (key === config.entityField) {
        return {
            [config.nombreField]: "",
            [config.contactField]: "",
            [config.contactIdField]: "",
            [config.addressField]: "",
            [config.addressCountryField]: "",
            [config.addressZonaField]: "",
            [config.addressKmField]: "",
            [config.addressCiudadField]: "",
            [config.addressDeptoField]: "",
            [config.addressMuniField]: "",
            [config.phoneField]: "",
            [config.emailField]: "",
            [config.identTributariaField]: "",
            [config.identNumeroField]: "",
        };
    }

    if (key === config.addressField) {
        const selectedDireccion = (direccionesFiltradas || []).find(
            (direccion) => String(direccion.direccion) === String(value),
        );

        return {
            [config.addressCountryField]: selectedDireccion?.cod_pais || "",
            [config.addressZonaField]: selectedDireccion?.entidaddireccion_zona || "",
            [config.addressKmField]: selectedDireccion?.entidaddireccion_km || "",
            [config.addressCiudadField]: selectedDireccion?.nombre_ciudad || "",
            [config.addressDeptoField]: selectedDireccion?.cod_depto || "",
            [config.addressMuniField]: selectedDireccion?.cod_muni || "",
        };
    }

    if (key === config.addressCountryField) {
        return {
            [config.addressDeptoField]: "",
            [config.addressMuniField]: "",
        };
    }

    if (key === config.addressDeptoField) {
        return {
            [config.addressMuniField]: "",
        };
    }

    if (key === config.contactIdField) {
        const contacts = contactosRespData || [];
        const selectedContact = contacts.find(
            (c) => String(c.entidadcontacto_id) === String(value),
        );

        return {
            [config.contactField]: selectedContact?.entidadcontacto_nombre || selectedContact?.entidad_nombre || "",
            [config.phoneField]: selectedContact?.entidadcontacto_telefono || "",
            [config.emailField]: selectedContact?.entidadcontacto_email || "",
            _contacto_tipo_list: extractContactoTipoList(selectedContact),
        };
    }

    return {};
};

const getIdentOptions = ({ identEnabled, identRespData, selectedEntityId }) => {
    if (!identEnabled) return [];

    return (identRespData || [])
        .filter((identificacion) => {
            if (identificacion.cod_estado != null && Number(identificacion.cod_estado) !== 1) {
                return false;
            }
            if (selectedEntityId && String(identificacion.entidad_id) !== String(selectedEntityId)) {
                return false;
            }
            return String(identificacion.nom_identificacion || "").toLowerCase() === "nit";
        })
        .map((identificacion) => ({
            value: identificacion.entidadidentificacion_id,
            label: identificacion.nom_identificacion,
        }));
};


const getContactoOptions = (contactosRespData) => {
    const contacts = contactosRespData || [];
    return contacts.map((c) => {
        const nombre = c.entidadcontacto_nombre || c.entidad_nombre || "";
        const email = c.entidadcontacto_email || "";
        const telefono = c.entidadcontacto_telefono || "";
        const partes = [
            `Nombre: ${nombre || "-"}`,
            `Email: ${email || "-"}`,
            `Teléfono: ${telefono || "-"}`,
        ];
        return {
            value: c.entidadcontacto_id,
            label: partes.join("  |  "),
            nombre,
            email,
            telefono,
        };
    });
};


const buildReportedValidity = (isValid, isSavedValid) => {
    if (isSavedValid) return VALIDITY_STATUS.VALID;
    if (isValid) return VALIDITY_STATUS.PENDING;
    return VALIDITY_STATUS.INVALID;
};

const normalizeDateTime = (dateValue) => {
    let normalized = String(dateValue);
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        normalized = `${normalized}T00:00`;
    }
    return normalized;
};

const parseOptionalJson = (rawJson) => {
    if (!rawJson) return {};

    try {
        return typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
    } catch (error) {
        console.warn("No se pudo parsear json opcionales:", error);
        return {};
    }
};

const syncFieldValueIfChanged = (setValues, fieldKey, nextValue) => {
    if (!nextValue) return;
    setValues((previousValues) => {
        if (String(previousValues[fieldKey]) === String(nextValue)) {
            return previousValues;
        }
        return {
            ...previousValues,
            [fieldKey]: String(nextValue),
        };
    });
};

const syncContactInfoValues = (detallesEmbarque, config, setValues) => {
    const contactValue = getFirstExistingValue(detallesEmbarque, config.prefillContactKeys || [config.contactField], "");
    const phoneValue = getFirstExistingValue(detallesEmbarque, config.prefillPhoneKeys || [config.phoneField], "");
    const emailValue = getFirstExistingValue(detallesEmbarque, config.prefillEmailKeys || [config.emailField], "");

    if (!contactValue && !phoneValue && !emailValue) return;

    setValues((previousValues) => {
        const nextValues = { ...previousValues };
        if (contactValue && !previousValues[config.contactField]) {
            nextValues[config.contactField] = contactValue;
        }
        if (phoneValue && !previousValues[config.phoneField]) {
            nextValues[config.phoneField] = phoneValue;
        }
        if (emailValue && !previousValues[config.emailField]) {
            nextValues[config.emailField] = emailValue;
        }
        return nextValues;
    });
};

const syncSelectedContactValues = (selectedEntityId, contactosRespData, config, setValues, detallesEmbarque) => {
    const clearContactValues = () => {
        setValues((previousValues) => ({
            ...previousValues,
            [config.contactField]: "",
            [config.contactIdField]: "",
            [config.phoneField]: "",
            [config.emailField]: "",
            _contacto_tipo_list: [],
        }));
    };

    if (!selectedEntityId) {
        clearContactValues();
        return;
    }

    const contacts = contactosRespData || [];
    if (contacts.length === 0) {
        clearContactValues();
        return;
    }

    const savedContactId = detallesEmbarque
        ? getFirstExistingValue(detallesEmbarque, config.prefillContactIdKeys || [], "")
        : "";

    setValues((previousValues) => {
        if (savedContactId) {
            const matchingContact = contacts.find(
                (c) => String(c.entidadcontacto_id) === String(savedContactId),
            );
            if (matchingContact) {
                return {
                    ...previousValues,
                    [config.contactIdField]: String(matchingContact.entidadcontacto_id),
                    [config.contactField]: matchingContact.entidadcontacto_nombre || matchingContact.entidad_nombre || "",
                    [config.phoneField]: matchingContact.entidadcontacto_telefono || "",
                    [config.emailField]: matchingContact.entidadcontacto_email || "",
                    _contacto_tipo_list: extractContactoTipoList(matchingContact),
                };
            }
        }

        const currentContactId = previousValues[config.contactIdField];
        if (currentContactId) {
            const matchingContact = contacts.find(
                (c) => String(c.entidadcontacto_id) === String(currentContactId),
            );
            if (matchingContact) {
                return previousValues;
            }
        }

        const firstContact = contacts[0];
        return {
            ...previousValues,
            [config.contactIdField]: String(firstContact.entidadcontacto_id),
            [config.contactField]: firstContact.entidadcontacto_nombre || firstContact.entidad_nombre || "",
            [config.phoneField]: firstContact.entidadcontacto_telefono || "",
            [config.emailField]: firstContact.entidadcontacto_email || "",
            _contacto_tipo_list: extractContactoTipoList(firstContact),
        };
    });
};

const syncLockedDireccionValue = ({ direccionLocked, direccionesFiltradas, config, setValues }) => {
    if (!direccionLocked || direccionesFiltradas.length === 0) return;

    const firstAddress = direccionesFiltradas[0]?.direccion;
    if (!firstAddress) return;

    setValues((previousValues) => {
        if (String(previousValues[config.addressField]) === String(firstAddress)) {
            return previousValues;
        }

        return {
            ...previousValues,
            [config.addressField]: firstAddress,
        };
    });
};

const syncSelectedAddressCountry = ({ config, values, direccionesFiltradas, setValues }) => {
    if (!values[config.addressField] || direccionesFiltradas.length === 0) return;

    const selectedDireccion = direccionesFiltradas.find(
        (direccion) => String(direccion.direccion) === String(values[config.addressField]),
    );
    const countryName = selectedDireccion?.nombre_pais || "";

    if (!countryName || values[config.addressCountryField] === countryName) return;

    setValues((previousValues) => ({
        ...previousValues,
        [config.addressCountryField]: countryName,
    }));
};

const syncSelectedAddressValue = ({ selectedEntityId, direccionOptions, config, setValues }) => {
    if (!selectedEntityId || direccionOptions.length === 0) return;

    setValues((previousValues) => {
        const currentAddress = previousValues[config.addressField];
        const selectedOptionIsValid = direccionOptions.some(
            (option) => String(option.value) === String(currentAddress),
        );

        if (selectedOptionIsValid) return previousValues;
        const firstOption = direccionOptions[0];
        if (!firstOption) return previousValues;

        return {
            ...previousValues,
            [config.addressField]: firstOption.value,
        };
    });
};

const isEntregaYRecoleccion = (direccion) => {
    const codEstado = direccion?.cod_estado ?? direccion?.COD_ESTADO;
    if (codEstado != null && Number(codEstado) !== 1) return false;

    const tipoDescripcion = String(
        direccion?.tipo_descripcion ?? direccion?.TIPO_DESCRIPCION ?? "",
    )
        .toLowerCase()
        .trim();

    if (tipoDescripcion) {
        return tipoDescripcion === "entrega y recoleccion";
    }

    const codTipo = Number(direccion?.cod_tipo ?? direccion?.COD_TIPO ?? Number.NaN);
    return codTipo === 145;
};

const syncDetallesEmbarqueValues = (detallesEmbarque, config, setValues) => {
    if (!detallesEmbarque) return;

    syncFieldValueIfChanged(setValues, config.entityField, getFirstExistingValue(detallesEmbarque, config.prefillEntityKeys, ""));
    syncFieldValueIfChanged(setValues, config.addressField, getFirstExistingValue(detallesEmbarque, config.prefillAddressKeys, ""));

    syncContactInfoValues(detallesEmbarque, config, setValues);
};

const insertEntidadRelacionIfNeeded = async ({
    insertarEntidadRelacion,
    entidadIdCliente,
    optionEntidad,
    queryClient,
    codTipoCliente = 3,
}) => {
    if (!entidadIdCliente || !optionEntidad?.entidad_id) return;

    try {
        await insertarEntidadRelacion({
            cod_estado: 1,
            cod_tipo: 300,
            entidad_id_1: Number(entidadIdCliente),
            entidad_id_2: Number(optionEntidad.entidad_id),
        });

        queryClient.invalidateQueries({
            queryKey: ["datos-entidad-relacionada-appweb", { entidad_id: Number(entidadIdCliente), cod_tipo: codTipoCliente, cod_estado: 1 }],
            exact: true,
        });
    } catch (error) {
        console.error("Error al insertar relación de entidad:", error);
    }
};


const invalidateSelectedEntityQueries = ({
    queryClient,
    codTipoEntidad,
    selectedEntityId,
}) => {
    if (!codTipoEntidad || !selectedEntityId) return;

    queryClient.invalidateQueries({
        queryKey: ["entidades-direccion", { cod_tipo: codTipoEntidad, entidad_id: selectedEntityId }],
    });
    queryClient.invalidateQueries({
        queryKey: ["entidad-contacto", { cod_tipo: codTipoEntidad, entidad_id: selectedEntityId }],
    });
    queryClient.invalidateQueries({
        queryKey: ["entidad-identificacion", { cod_tipo: codTipoEntidad, entidad_id: selectedEntityId }],
    });
};

const invalidateEntityListQueries = ({
    queryClient,
    config,
    prefillEntityId,
    prefillEntityAlreadyInList,
}) => {
    queryClient.invalidateQueries({
        queryKey: ["entidades", { tipo_entidad: config.relationType }],
    });

    if (prefillEntityId && !prefillEntityAlreadyInList) {
        queryClient.invalidateQueries({
            queryKey: ["entidades", { tipo_entidad: config.relationType, entidad_id: prefillEntityId }],
        });
    }
};

const buildHandleRefresh = ({
    queryClient,
    config,
    prefillEntityId,
    prefillEntityAlreadyInList,
    codTipoEntidad,
    selectedEntityId,
    setValues,
    detallesEmbarque,
}) => () => {
    setValues({ ...config.initialValues });
    syncDetallesEmbarqueValues(detallesEmbarque, config, setValues);
    queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
    invalidateEntityListQueries({
        queryClient,
        config,
        prefillEntityId,
        prefillEntityAlreadyInList,
    });
    invalidateSelectedEntityQueries({
        queryClient,
        codTipoEntidad,
        selectedEntityId,
    });
};


const getExistingJsonOpcionales = (detallesEmbarque) => {
    const existingJsonRaw =
        detallesEmbarque?.json_datos_opcionales ??
        detallesEmbarque?.jsonDatosOpcionales ??
        detallesEmbarque?.json_atributos_opcionales ??
        detallesEmbarque?.jsonAtributosOpcionales ??
        null;

    if (!existingJsonRaw) return null;
    return parseOptionalJson(existingJsonRaw);
};

const buildJsonOpcionales = ({ detallesEmbarque, fechaRecoleccionValue, telefonoEmergenciaValue }) => {
    const existingJson = getExistingJsonOpcionales(detallesEmbarque);
    const jsonOpcionales = existingJson ? { ...existingJson } : {};

    if (fechaRecoleccionValue) {
        jsonOpcionales.fecha_recoleccion = fechaRecoleccionValue;
    }

    if (telefonoEmergenciaValue) {
        jsonOpcionales.telefonoEmergencia = telefonoEmergenciaValue;
    }

    return jsonOpcionales;
};

const isFormValid = ({ values, config, identRequired, modoNuevo = false }) => Boolean(
    (modoNuevo || values[config.entityField]) &&
    values[config.addressField] &&
    (modoNuevo || values[config.contactIdField]) &&
    (!modoNuevo || (values._contacto_tipo_list || []).length > 0) &&
    (!config.dateField || values[config.dateField]) &&
    (!identRequired || values[config.identNumeroField])
);

const useSyncFormValues = (detallesEmbarque, config, setValues) => {
    useEffect(() => {
        syncDetallesEmbarqueValues(detallesEmbarque, config, setValues);
    }, [config.addressField, config.dateField, config.entityField, config.emailField, config.prefillAddressKeys, config.prefillContactKeys, config.prefillEmailKeys, config.prefillEntityKeys, config.prefillPhoneKeys, config.phoneField, config.contactField, detallesEmbarque]);
};

const useSyncEntityData = (selectedEntityId, contactosActivos, config, setValues, detallesEmbarque) => {
    useEffect(() => {
        if (!selectedEntityId) return;
        syncSelectedContactValues(selectedEntityId, contactosActivos, config, setValues, detallesEmbarque);
    }, [selectedEntityId, contactosActivos, config, setValues, detallesEmbarque]);
};

const useSyncEntityNombre = (selectedEntityObj, config, setValues) => {
    const prevEntityIdRef = useRef(null);
    useEffect(() => {
        if (!config.nombreField) return;
        const currentEntityId = selectedEntityObj?.entidad_id ?? null;
        if (currentEntityId === prevEntityIdRef.current) return;
        prevEntityIdRef.current = currentEntityId;
        const name = selectedEntityObj?.entidad_nombre || "";
        setValues((prev) => {
            if (prev[config.nombreField] === name) return prev;
            return { ...prev, [config.nombreField]: name };
        });
    }, [selectedEntityObj?.entidad_id, selectedEntityObj?.entidad_nombre, config.nombreField, setValues]);
};

const useSyncLockedAddress = (direccionLocked, direccionesFiltradas, config, setValues) => {
    useEffect(() => {
        syncLockedDireccionValue({ direccionLocked, direccionesFiltradas, config, setValues });
    }, [config.addressField, direccionLocked, direccionesFiltradas, config, setValues]);
};

const useSyncAddressSelection = (selectedEntityId, direccionOptions, config, direccionesFiltradas, setValues) => {
    const optionsRef = useRef(direccionOptions);
    optionsRef.current = direccionOptions;

    useEffect(() => {
        if (!selectedEntityId || optionsRef.current.length === 0) return;
        setValues((previousValues) => {
            const currentAddress = previousValues[config.addressField];
            const currentDirecciones = direccionesFiltradas;
            const currentOptions = optionsRef.current;

            const selectedDireccion = currentDirecciones.find(
                (direccion) => String(direccion.direccion) === String(currentAddress),
            );
            const countryCode = selectedDireccion?.cod_pais || "";
            const zona = selectedDireccion?.entidaddireccion_zona || "";
            const km = selectedDireccion?.entidaddireccion_km || "";
            const ciudad = selectedDireccion?.nombre_ciudad || "";
            const deptoCode = selectedDireccion?.cod_depto || "";
            const muniCode = selectedDireccion?.cod_muni || "";

            const nextValues = { ...previousValues };
            let changed = false;

            if (countryCode && previousValues[config.addressCountryField] !== countryCode) {
                nextValues[config.addressCountryField] = countryCode;
                changed = true;
            }
            if (previousValues[config.addressZonaField] !== zona) {
                nextValues[config.addressZonaField] = zona;
                changed = true;
            }
            if (previousValues[config.addressKmField] !== km) {
                nextValues[config.addressKmField] = km;
                changed = true;
            }
            if (previousValues[config.addressCiudadField] !== ciudad) {
                nextValues[config.addressCiudadField] = ciudad;
                changed = true;
            }
            if (previousValues[config.addressDeptoField] !== deptoCode) {
                nextValues[config.addressDeptoField] = deptoCode;
                changed = true;
            }
            if (previousValues[config.addressMuniField] !== muniCode) {
                nextValues[config.addressMuniField] = muniCode;
                changed = true;
            }

            const selectedOptionIsValid = currentOptions.some(
                (option) => String(option.value) === String(currentAddress),
            );
            if (!selectedOptionIsValid && !currentAddress) {
                const firstOption = currentOptions[0];
                if (firstOption && previousValues[config.addressField] !== firstOption.value) {
                    nextValues[config.addressField] = firstOption.value;
                    changed = true;
                }
            }

            return changed ? nextValues : previousValues;
        });
    }, [config.addressCountryField, config.addressField, config.addressZonaField, config.addressKmField, config.addressCiudadField, config.addressDeptoField, config.addressMuniField, selectedEntityId, direccionesFiltradas, setValues]);
};

const useSyncIdentificacion = (selectedEntityId, identOptions, identResp, config, setValues) => {
    useEffect(() => {
        if (!selectedEntityId || identOptions.length === 0) return;
        const firstIdent = identOptions[0];
        const identData = (identResp.data || []).find(
            (identificacion) => String(identificacion.entidadidentificacion_id) === String(firstIdent.value),
        );
        setValues((previousValues) => {
            const nextNumero = String(identData?.entidadidentificacion_numero ?? "");
            if (String(previousValues[config.identNumeroField]) === nextNumero) {
                return previousValues;
            }
            return { ...previousValues, [config.identNumeroField]: nextNumero };
        });
    }, [config.identNumeroField, identOptions, identResp.data, selectedEntityId]);
};

const useSyncExtraAddressFields = (config, direccionesFiltradas, setValues) => {
    useEffect(() => {
        if (direccionesFiltradas.length === 0) return;
        setValues((previousValues) => {
            const currentAddress = previousValues[config.addressField];
            if (!currentAddress) return previousValues;

            const selectedDireccion = direccionesFiltradas.find(
                (direccion) => String(direccion.direccion) === String(currentAddress),
            );
            const countryCode = selectedDireccion?.cod_pais || "";
            const zona = selectedDireccion?.entidaddireccion_zona || "";
            const km = selectedDireccion?.entidaddireccion_km || "";
            const ciudad = selectedDireccion?.nombre_ciudad || "";
            const deptoCode = selectedDireccion?.cod_depto || "";
            const muniCode = selectedDireccion?.cod_muni || "";

            const nextValues = { ...previousValues };
            let changed = false;

            if (countryCode && previousValues[config.addressCountryField] !== countryCode) {
                nextValues[config.addressCountryField] = countryCode;
                changed = true;
            }
            if (previousValues[config.addressZonaField] !== zona) {
                nextValues[config.addressZonaField] = zona;
                changed = true;
            }
            if (previousValues[config.addressKmField] !== km) {
                nextValues[config.addressKmField] = km;
                changed = true;
            }
            if (previousValues[config.addressCiudadField] !== ciudad) {
                nextValues[config.addressCiudadField] = ciudad;
                changed = true;
            }
            if (previousValues[config.addressDeptoField] !== deptoCode) {
                nextValues[config.addressDeptoField] = deptoCode;
                changed = true;
            }
            if (previousValues[config.addressMuniField] !== muniCode) {
                nextValues[config.addressMuniField] = muniCode;
                changed = true;
            }

            return changed ? nextValues : previousValues;
        });
    }, [config.addressCountryField, config.addressField, config.addressZonaField, config.addressKmField, config.addressCiudadField, config.addressDeptoField, config.addressMuniField, direccionesFiltradas, setValues]);
};

const useValidityReporter = (onValidityChange, reportedValidity) => {
    const onValidityChangeRef = useRef(onValidityChange);
    onValidityChangeRef.current = onValidityChange;
    useEffect(() => {
        if (typeof onValidityChangeRef.current === "function") {
            onValidityChangeRef.current(reportedValidity);
        }
    }, [reportedValidity]);
};

const useLoadingReporter = (detallesEmbarque, relacionesFetching, onLoadingChange) => {
    const onLoadingChangeRef = useRef(onLoadingChange);
    onLoadingChangeRef.current = onLoadingChange;
    useEffect(() => {
        onLoadingChangeRef.current?.(!detallesEmbarque || relacionesFetching);
    }, [detallesEmbarque, relacionesFetching]);
};

const useEntityValueNotifier = (options) => {
    const {
        entityOptions,
        values,
        config,
        onValuesChange,
        selectedDireccionObj,
        selectedEntityId,
        identOptions,
        contactosRespData,
    } = options;
    const onValuesChangeRef = useRef(onValuesChange);
    onValuesChangeRef.current = onValuesChange;
    const lastNotifiedSig = useRef(null);
    useEffect(() => {
        if (typeof onValuesChangeRef.current !== "function") return;
        const entityLabel = entityOptions.find(
            (option) => String(option.value) === String(values[config.entityField]),
        )?.label || "";
        const payload = {
            entidad_nombre: entityLabel,
            entidad_id: selectedEntityId || null,
            direccion_recoleccion: values[config.addressField],
            direccion_recoleccion_pais: values[config.addressCountryField] || selectedDireccionObj?.nombre_pais || "",
            direccion_recoleccion_zona: values[config.addressZonaField] || selectedDireccionObj?.entidaddireccion_zona || "",
            direccion_recoleccion_km: values[config.addressKmField] || selectedDireccionObj?.entidaddireccion_km || "",
            direccion_recoleccion_ciudad: values[config.addressCiudadField] || selectedDireccionObj?.nombre_ciudad || "",
            direccion_recoleccion_depto: values[config.addressDeptoField] || selectedDireccionObj?.nombre_depto || selectedDireccionObj?.cod_depto || "",
            direccion_recoleccion_muni: values[config.addressMuniField] || selectedDireccionObj?.nombre_muni || selectedDireccionObj?.cod_muni || "",
            entidaddireccion_id: selectedDireccionObj?.entidaddireccion_id ?? null,
            entidad_contacto_nombre: values[config.contactField] || "",
            entidad_contacto_telefono: values[config.phoneField] || "",
            entidad_contacto_email: values[config.emailField] || "",
            entidadcontacto_id: contactosRespData?.[0]?.entidadcontacto_id ?? null,
            entidad_nit: values[config.identNumeroField] || "",
            identificacion_numero: values[config.identNumeroField] || "",
            entidadidentificacion_id: identOptions?.[0]?.value ?? null,
            ...(config.dateField ? { [config.dateField]: values[config.dateField] || "" } : {}),
        };
        const sig = JSON.stringify(payload);
        if (lastNotifiedSig.current === sig) return;
        lastNotifiedSig.current = sig;
        onValuesChangeRef.current(payload);
    }, [
        config.addressCountryField,
        config.addressField,
        config.addressZonaField,
        config.addressKmField,
        config.addressCiudadField,
        config.addressDeptoField,
        config.addressMuniField,
        config.contactField,
        config.emailField,
        config.entityField,
        config.identNumeroField,
        config.phoneField,
        entityOptions,
        selectedDireccionObj,
        selectedEntityId,
        identOptions,
        contactosRespData,
        values,
    ]);
};


const getSelectedEntityObj = (entidadesList, prefillEntityObjVal, selectedEntityIdVal) => {
    const candidates = [
        ...(Array.isArray(entidadesList) ? entidadesList : []),
        ...(prefillEntityObjVal ? [prefillEntityObjVal] : []),
    ];

    return candidates.find(
        (ent) => String(ent?.entidad_id) === String(selectedEntityIdVal),
    ) || null;
};

// Helper to extract client entity ID from detalles
const extractClientEntityId = (detallesEmbarque) => {
    if (!detallesEmbarque) return null;
    return (
        detallesEmbarque.ENTIDAD_ID_CLI ||
        detallesEmbarque.entidad_id_cli ||
        detallesEmbarque.entidadIdCli ||
        null
    );
};

const buildInitialEntityData = (embarque_id) => {
    const normalizedId = embarque_id != null && embarque_id !== "" ? Number(embarque_id) : null;
    return { normalizedId };
};

const EntidadFormSection = ({
    config,
    title,
    embarque_id = null,
    embarqueData: externalEmbarqueData = null,
    clienteData = null,
    onValidityChange,
    onValuesChange = null,
    onLoadingChange = null,
    onSaveSuccess = null,
}) => {
    const displayTitle = title || config.title;
    const queryClient = useQueryClient();
    const { cod_usuario } = useSelector((state) => state.auth);
    const { mutateAsync: actualizarCoordinacion } = useUpdateCoordinacion();
    const { mutateAsync: insertarEntidadRelacion } = useInsertarEntidadRelacion();
    const { mutateAsync: insertarEntidadDireccion } = useInsertarEntidadDireccion();
    const { mutateAsync: insertarEntidadContacto } = useInsertarEntidadContacto();
    const { mutateAsync: insertarEntidadIdentificacion } = useInsertarEntidadIdentificacion();
    const { mutateAsync: actualizarEntidadDireccion } = useActualizarEntidadDireccion();
    const { mutateAsync: actualizarEntidadContacto } = useActualizarEntidadContacto();
    const { mutateAsync: actualizarEntidadIdentificacion } = useActualizarEntidadIdentificacion();
    const { data: tiposData = [] } = useFetchTipos();
    const { data: fetchedEmbarque = null, isLoading: isLoadingDetalles } = useCoordinacionData(
        embarque_id,
        { enabled: !externalEmbarqueData },
    );
    const detallesEmbarque = externalEmbarqueData ?? fetchedEmbarque;

    const [values, setValues] = useState(config.initialValues);
    const [modoNuevo, setModoNuevo] = useState(false);

    const { normalizedId: normalizedPropEmbarqueId } = buildInitialEntityData(embarque_id);

    const entidadIdCliente = useMemo(
        () => extractClientEntityId(detallesEmbarque),
        [detallesEmbarque],
    );

    // El mismo entidad_id de cliente puede existir como CLIENTE (cod_tipo 3) o
    // como PRE-CLIENTE (cod_tipo 5); recuperar-datos-entidad-relacionada filtra
    // por ese cod_tipo, así que hay que resolverlo primero (mismo patrón que
    // facturacion.jsx) en vez de asumir siempre 3.
    const { data: clienteEntidadesData = [], isSuccess: clienteQueryDone } = useFetchEntidades(
        { tipo_entidad: "CLIENTE", entidad_id: entidadIdCliente },
        { enabled: Boolean(entidadIdCliente) },
    );
    const esPreCliente = clienteQueryDone && clienteEntidadesData.length === 0;
    const codTipoCliente = clienteEntidadesData?.[0]?.cod_tipo ?? (esPreCliente ? 5 : 3);

    // Mismo endpoint y parámetros que usa la vista pública (CTS), en vez de
    // lista-entidad-relacion: ese endpoint sólo trae relaciones ya registradas
    // manualmente (ENTIDAD_RELACION cod_tipo 300), por lo que el selector queda
    // vacío si el shipper/consignatario se eligió desde CTS sin crear esa
    // relación. recuperar-datos-entidad-relacionada resuelve la lista completa
    // en el servidor y no depende de ese registro manual.
    const relacionesQuery = useFetchDatosEntidadRelacionadaAppweb(
        { entidad_id: entidadIdCliente, cod_tipo: codTipoCliente, cod_estado: 1 },
        { enabled: Boolean(entidadIdCliente) },
    );
    const { isFetching: relacionesFetching } = relacionesQuery;
    const relacionesEntidad = useMemo(
        () => (Array.isArray(relacionesQuery.data?.data) ? relacionesQuery.data.data : []),
        [relacionesQuery.data],
    );

    // React 18 concurrent renders can discard the enabled:false→true transition,
    // leaving the query stuck in pending/idle. Kick refetch from an effect (post-commit).
    const relacionesRefetchRef = useRef(relacionesQuery.refetch);
    relacionesRefetchRef.current = relacionesQuery.refetch;
    useEffect(() => {
        if (!entidadIdCliente) return;
        if (relacionesQuery.status !== "pending" || relacionesQuery.fetchStatus !== "idle") return;
        relacionesRefetchRef.current();
    }, [entidadIdCliente, relacionesQuery.status, relacionesQuery.fetchStatus]);

    const relacionesFiltradas = useMemo(() => {
        const aliases = [config.relacionTipoDescripcion, ...(config.relationTypeAliases || [])]
            .map(normalizeRelationLabel)
            .filter(Boolean);

        if (aliases.length === 0) return [];

        // `descripcion_tipo_relacion` describe el tipo de RELACIÓN (cod_tipo_relacion
        // 300, "entidad relacionada al cliente"), no el tipo de la entidad — el
        // backend devuelve el mismo texto ("CONSIGNATARIO") para todas las filas
        // sin importar si la entidad es shipper o consignatario. Se prioriza
        // `entidad_clasificacion` (correcto por entidad) y solo se cae a
        // `descripcion_tipo_relacion` cuando la clasificación viene vacía.
        return relacionesEntidad.filter((r) => {
            const clasificacion = normalizeRelationLabel(r.entidad_clasificacion);
            if (clasificacion) return aliases.includes(clasificacion);
            return aliases.includes(normalizeRelationLabel(r.descripcion_tipo_relacion));
        });
    }, [relacionesEntidad, config.relacionTipoDescripcion, config.relationTypeAliases]);

    const entidades = useMemo(() => {
        if (!Array.isArray(relacionesFiltradas) || relacionesFiltradas.length === 0) return [];
        return relacionesFiltradas.map((ent) => ({
            ...ent,
            entidad_nombre: resolveEntidadNombre(ent),
        }));
    }, [relacionesFiltradas]);

    const entidadesFetching = isLoadingDetalles || relacionesFetching;
    const hasEntityList = entidades.length > 0;

    // ID de la entidad preestablecida desde embarqueData (e.g. ENTIDAD_ID_SHIPPER)
    const prefillEntityId = useMemo(() => {
        if (!detallesEmbarque) return null;
        return getFirstExistingValue(detallesEmbarque, config.prefillEntityKeys, "") || null;
    }, [detallesEmbarque, config.prefillEntityKeys]);

    const prefillEntityAlreadyInList = useMemo(() => {
        if (!prefillEntityId || entidadesFetching) return false;
        return entidades.some((ent) => String(ent.entidad_id) === String(prefillEntityId));
    }, [prefillEntityId, entidades, entidadesFetching]);

    const selectedEntityId = values[config.entityField] || "";

    // Buscar la entidad por ID (via recuperar-datos-entidad) cuando no está en la
    // lista principal del tipo de sección; este endpoint sí trae data_nombres,
    // a diferencia de lista-entidad.
    const { data: prefillEntidadDatos } = useFetchDatosEntidad(
        { entidad_id: prefillEntityId, cod_tipo: config.nuevaEntidadTipo },
        { enabled: Boolean(prefillEntityId) && !prefillEntityAlreadyInList && !entidadesFetching },
    );

    const prefillEntityObj = useMemo(
        () => getPrefillEntityObj(prefillEntityId, entidades, prefillEntidadDatos, detallesEmbarque, config),
        [prefillEntityId, entidades, prefillEntidadDatos, detallesEmbarque, config],
    );

    const entityOptions = useMemo(
        () => getEntityOptions(entidades, entidadesFetching, prefillEntityObj),
        [entidades, entidadesFetching, prefillEntityObj],
    );

    useSyncFormValues(detallesEmbarque, config, setValues);

    const empresaIdFromDetalles =
        detallesEmbarque?.empresa_id ??
        detallesEmbarque?.EMPRESA_ID ??
        detallesEmbarque?.empresaId ??
        detallesEmbarque?.cod_empresa ??
        detallesEmbarque?.COD_EMPRESA ??
        null;

    const centroCostoIdFromDetalles =
        detallesEmbarque?.cencos_id ??
        detallesEmbarque?.CENCOS_ID ??
        detallesEmbarque?.cencosId ??
        detallesEmbarque?.cencod_id ??
        detallesEmbarque?.CENCOD_ID ??
        detallesEmbarque?.cencodId ??
        detallesEmbarque?.cod_cc ??
        detallesEmbarque?.COD_CC ??
        null;

    const selectedEntityObj = getSelectedEntityObj(entidades, prefillEntityObj, selectedEntityId);

    useSyncEntityNombre(selectedEntityObj, config, setValues);

    const codTipoEntidad = selectedEntityObj?.cod_tipo || selectedEntityObj?.COD_TIPO || null;
    const direccionEnabled = Boolean(codTipoEntidad && selectedEntityId);
    const direccionLocked = codTipoEntidad === 145;

    const { data: direccionesResp = [] } = useFetchEntidadesDireccion(
        { cod_tipo: codTipoEntidad, entidad_id: selectedEntityId },
        { enabled: direccionEnabled, staleTime: 5 * 60 * 1000 },
    );

    const direccionesFiltradas = useMemo(
        () => (direccionesResp || []).filter(isEntregaYRecoleccion),
        [direccionesResp],
    );

    const direccionOptions = useMemo(
        () => getDireccionOptions({ direccionEnabled, direccionLocked, values, config, direccionesFiltradas }),
        [direccionEnabled, direccionLocked, values, config, direccionesFiltradas],
    );

    const { data: contactosResp = {}, isFetching: contactosFetching } = useFetchEntidadContacto(
        { cod_tipo: codTipoEntidad, entidad_id: selectedEntityId },
        { enabled: Boolean(selectedEntityId) && Boolean(codTipoEntidad), staleTime: 5 * 60 * 1000 },
    );

    const contactosActivos = useMemo(
        () => (contactosResp.data || []).filter((c) => c.cod_estado == null || Number(c.cod_estado) === 1),
        [contactosResp.data],
    );

    const hasDireccion = Boolean(values[config.addressField]);

    useSyncEntityData(selectedEntityId, contactosActivos, config, setValues, detallesEmbarque);
    useSyncLockedAddress(direccionLocked, direccionesFiltradas, config, setValues);
    useSyncAddressSelection(selectedEntityId, direccionOptions, config, direccionesFiltradas, setValues);

    const identEnabled = Boolean(codTipoEntidad && selectedEntityId);

    const { data: identResp = {} } = useFetchEntidadIdentificacion(
        { cod_tipo: codTipoEntidad, entidad_id: selectedEntityId },
        { enabled: identEnabled, staleTime: 5 * 60 * 1000 },
    );

    const identOptions = useMemo(
        () => getIdentOptions({ identEnabled, identRespData: identResp.data, selectedEntityId }),
        [identEnabled, identResp.data, selectedEntityId],
    );

    useSyncIdentificacion(selectedEntityId, identOptions, identResp, config, setValues);

    const selectedDireccionObj = useMemo(
        () => (direccionesFiltradas || []).find(
            (direccion) => String(direccion.direccion) === String(values[config.addressField]),
        ),
        [direccionesFiltradas, values, config.addressField],
    );

    const identRequired = config.identRequired !== false;

    const { data: paisesData = [] } = useFetchPaises();
    const paisOptions = useMemo(
        () => paisesData.map((p) => ({ value: p.cod_pais, label: p.nombre_pais })),
        [paisesData],
    );

    const { data: departamentosData = [] } = useFetchDepartamentos(
        { cod_pais: values[config.addressCountryField] },
        { enabled: !!values[config.addressCountryField] },
    );
    const departamentoOptions = useMemo(
        () => departamentosData.map((d) => ({ value: d.cod_depto, label: d.nombre_depto })),
        [departamentosData],
    );

    const { data: municipiosData = [] } = useFetchMunicipios(
        { cod_depto: values[config.addressDeptoField] },
        { enabled: !!values[config.addressDeptoField] },
    );
    const municipioOptions = useMemo(
        () => municipiosData.map((m) => ({ value: m.cod_muni, label: m.nombre_muni })),
        [municipiosData],
    );

    // Catálogos sin filtrar por país/depto seleccionados, usados sólo para
    // resolver labels en el panel de comparación: el valor actual puede
    // pertenecer a un país/depto distinto al que está seleccionado ahora mismo.
    const { data: todosDepartamentosData = [] } = useFetchDepartamentos();
    const todosDepartamentoOptions = useMemo(
        () => todosDepartamentosData.map((d) => ({ value: d.cod_depto, label: d.nombre_depto })),
        [todosDepartamentosData],
    );

    const { data: todosMunicipiosData = [] } = useFetchMunicipios();
    const todosMunicipioOptions = useMemo(
        () => todosMunicipiosData.map((m) => ({ value: m.cod_muni, label: m.nombre_muni })),
        [todosMunicipiosData],
    );

    useSyncExtraAddressFields(config, direccionesFiltradas, setValues);

    const { data: ciudadesData = [] } = useFetchCiudades(
        { cod_pais: values[config.paisField] },
        { enabled: Boolean(values[config.paisField]) },
    );
    const { data: industriasData = [] } = useFetchIndustrias();

    const { data: selectedEntidadDatos } = useFetchDatosEntidad(
        { entidad_id: selectedEntityId, cod_tipo: codTipoEntidad || config.nuevaEntidadTipo },
        { enabled: Boolean(selectedEntityId) && !entidadesFetching },
    );

    useEffect(() => {
        const entityData = selectedEntidadDatos?.data_entidad?.[0];
        if (!entityData) return;

        setValues((prev) => {
            const next = { ...prev };
            let changed = false;

            const paisVal = config.paisField && entityData.cod_pais != null ? String(entityData.cod_pais) : null;
            const ciudadVal = config.ciudadField && entityData.cod_ciudad != null ? String(entityData.cod_ciudad) : null;
            const industriaVal = config.industriaField && entityData.cod_industria != null ? String(entityData.cod_industria) : null;

            if (paisVal && prev[config.paisField] !== paisVal) {
                next[config.paisField] = paisVal;
                changed = true;
            }
            if (ciudadVal && prev[config.ciudadField] !== ciudadVal) {
                next[config.ciudadField] = ciudadVal;
                changed = true;
            }
            if (industriaVal && prev[config.industriaField] !== industriaVal) {
                next[config.industriaField] = industriaVal;
                changed = true;
            }

            return changed ? next : prev;
        });
    }, [selectedEntityId, selectedEntidadDatos, config.paisField, config.ciudadField, config.industriaField, setValues]);

    const ciudadOptions = useMemo(
        () => (ciudadesData || []).map((c) => ({
            label: c.nombre_ciudad || c.NOMBRE_CIUDAD || c.label,
            value: c.cod_ciudad || c.COD_CIUDAD || c.value,
        })),
        [ciudadesData],
    );

    const industriaOptions = useMemo(
        () => (industriasData || []).map((i) => ({
            label: i.NOM_INDUSTRIA_ES || i.nom_industria_es,
            value: i.COD_INDUSTRIA || i.cod_industria,
        })),
        [industriasData],
    );

    const tiposContactoOptions = useMemo(
        () => tiposData
            .filter((t) => t.tipoTabla === "ENTIDAD_CONTACTOS")
            .map((t) => ({
                value: t.codTipo || t.cod_tipo || t.COD_TIPO,
                label: t.nomTipo || t.nom_tipo || t.NOM_TIPO || t.tipo_descripcion || "",
            })),
        [tiposData],
    );

    const handleFieldChange = useCallback((key, value) => {
        if (key === config.entityField && value && value !== "" && modoNuevo) {
            setModoNuevo(false);
        }
        return resolveFieldChange({ key, value, config, direccionesFiltradas, contactosRespData: contactosActivos });
    }, [config, direccionesFiltradas, contactosActivos, modoNuevo]);

    const handleValuesChange = useCallback((nextValues) => {
        setValues((previousValues) => {
            const result = buildDiffState(nextValues, previousValues);
            if (result === previousValues) return previousValues;
            if (shallowEqual(result, previousValues)) return previousValues;
            return result;
        });
    }, []);

    // --- Comparación con los datos que el cliente envió en la carta pública ---
    const [relatingCliente, setRelatingCliente] = useState(false);

    const clienteEntityId = clienteData?.entidad_id ?? null;
    const clienteEntityNombre = getClienteValue(clienteData, ["entidad_nombre", "nombre"]) || "";

    const isClienteEntityRelated = useMemo(() => {
        if (!clienteEntityId) return false;
        return entidades.some((ent) => String(ent.entidad_id) === String(clienteEntityId));
    }, [clienteEntityId, entidades]);

    // A diferencia de isClienteEntityRelated (que evalúa clienteEntityId, la
    // entidad que envió el cliente en la carta pública), esta evalúa la entidad
    // actualmente elegida en el selector shipper/consignatario, que puede ser
    // otra distinta.
    const isSelectedEntityRelated = useMemo(() => {
        if (!selectedEntityId) return false;
        return entidades.some((ent) => String(ent.entidad_id) === String(selectedEntityId));
    }, [selectedEntityId, entidades]);

    const differsEntity = Boolean(clienteEntityId) && String(clienteEntityId) !== String(selectedEntityId);

    const clienteCompareRows = useMemo(
        () => buildClienteCompareRows(clienteData, config, values, {
            paises: paisOptions,
            ciudades: ciudadOptions,
            departamentos: todosDepartamentoOptions,
            municipios: todosMunicipioOptions,
            industrias: industriaOptions,
            tiposContacto: tiposContactoOptions,
        }),
        [clienteData, config, values, paisOptions, ciudadOptions, todosDepartamentoOptions, todosMunicipioOptions, industriaOptions, tiposContactoOptions],
    );

    // Valores previos guardados al aceptar, para poder deshacer cada campo.
    const [clienteUndoStash, setClienteUndoStash] = useState({});

    const clienteCompareRowsConUndo = useMemo(
        () => clienteCompareRows.map((row) => ({
            ...row,
            puedeDeshacer: Object.hasOwn(clienteUndoStash, row.configKey) && row.iguales,
        })),
        [clienteCompareRows, clienteUndoStash],
    );

    // Escenarios 1 y 3: el cliente eligió otra entidad. Si aún no está
    // relacionada con el cliente (creada por él en el público), se inserta la
    // relación antes de seleccionarla; sus dirección/contacto/NIT ya existen en
    // BD y el formulario los cargará al quedar seleccionada.
    const handleAcceptClienteEntity = useCallback(async () => {
        if (!clienteEntityId) return;
        setRelatingCliente(true);
        try {
            if (!isClienteEntityRelated && entidadIdCliente) {
                await insertEntidadRelacionIfNeeded({
                    insertarEntidadRelacion,
                    entidadIdCliente,
                    optionEntidad: { entidad_id: clienteEntityId },
                    queryClient,
                    codTipoCliente,
                });
            }
            setValues({
                ...config.initialValues,
                [config.entityField]: Number(clienteEntityId),
            });
        } catch (error) {
            console.error("Error al aceptar la entidad del cliente:", error);
        } finally {
            setRelatingCliente(false);
        }
    }, [clienteEntityId, isClienteEntityRelated, entidadIdCliente, insertarEntidadRelacion, queryClient, config, codTipoCliente]);

    // Escenario 2: misma entidad, el cliente modificó un campo.
    const handleAcceptClienteField = useCallback((key, value) => {
        if (!key) return;
        setClienteUndoStash((stash) => (Object.hasOwn(stash, key) ? stash : { ...stash, [key]: values[key] ?? "" }));
        setValues((previousValues) => ({ ...previousValues, [key]: value }));
    }, [values]);

    const handleAcceptAllClienteFields = useCallback(() => {
        const stashAdd = {};
        clienteCompareRows.forEach((row) => {
            if (row.modificado && !row.iguales) {
                stashAdd[row.configKey] = values[row.configKey] ?? "";
            }
        });
        setClienteUndoStash((stash) => ({ ...stashAdd, ...stash }));
        setValues((previousValues) => {
            const nextValues = { ...previousValues };
            clienteCompareRows.forEach((row) => {
                if (row.modificado) {
                    nextValues[row.configKey] = row.clienteValue;
                }
            });
            return nextValues;
        });
    }, [clienteCompareRows, values]);

    const handleUndoClienteField = useCallback((key) => {
        if (!Object.hasOwn(clienteUndoStash, key)) return;
        const prevValue = clienteUndoStash[key];
        setValues((previousValues) => ({ ...previousValues, [key]: prevValue }));
        setClienteUndoStash((stash) => {
            const next = { ...stash };
            delete next[key];
            return next;
        });
    }, [clienteUndoStash]);

    const handleUndoAllClienteFields = useCallback(() => {
        setValues((previousValues) => {
            const nextValues = { ...previousValues };
            for (const [key, prevValue] of Object.entries(clienteUndoStash)) {
                nextValues[key] = prevValue;
            }
            return nextValues;
        });
        setClienteUndoStash({});
    }, [clienteUndoStash]);

    const nuevoEntityAction = useMemo(() => ({
        visible: !config.hideNuevoEntidad,
        enabled: true,
        nombre: modoNuevo ? "Cancelar" : "Nuevo",
        icono: modoNuevo ? "c-cerrar" : "c-suma",
        onClick: () => {
            if (modoNuevo) {
                setModoNuevo(false);
                setValues(config.initialValues);
            } else {
                setModoNuevo(true);
                setValues(config.initialValues);
            }
        },
    }), [modoNuevo, config.initialValues, config.hideNuevoEntidad]);

    const [openCrearContacto, setOpenCrearContacto] = useState(false);

    const nuevoContactoAction = useMemo(() => ({
        visible: true,
        enabled: Boolean(selectedEntityId) && Boolean(codTipoEntidad),
        nombre: "Nuevo",
        icono: "c-suma",
        onClick: () => setOpenCrearContacto(true),
    }), [selectedEntityId, codTipoEntidad]);

    const contactoOptions = useMemo(
        () => getContactoOptions(contactosActivos),
        [contactosActivos],
    );

    const shouldAutoEnterModoNuevoForEntities = () => !entidadesFetching && !modoNuevo && entidades.length === 0 && !prefillEntityId;

    const shouldAutoEnterModoNuevoForContacts = () => Boolean(selectedEntityId) && Boolean(codTipoEntidad) && !contactosFetching && !modoNuevo && (contactosActivos.length === 0);

    useEffect(() => {
        if (shouldAutoEnterModoNuevoForEntities()) {
            setModoNuevo(true);
        }
    }, [entidades.length, entidadesFetching, modoNuevo, prefillEntityId]);

    useEffect(() => {
        if (shouldAutoEnterModoNuevoForContacts()) {
            setModoNuevo(true);
        }
    }, [selectedEntityId, codTipoEntidad, contactosActivos, contactosFetching, modoNuevo]);

    const selectedContactId = values[config.contactIdField] || "";

    const fields = useMemo(
        () => buildEntidadFields({
            config,
            entityOptions,
            selectedEntityId,
            selectedContactId,
            nuevoEntityAction,
            nuevoContactoAction,
            contactoOptions,
            paisOptions,
            departamentoOptions,
            municipioOptions,
            ciudadOptions,
            industriaOptions,
            tiposContactoOptions,
            modoNuevo,
            hiddenFields: config.hiddenFields,
        }),
        [
            config.addressCountryField,
            config.addressField,
            config.addressZonaField,
            config.addressKmField,
            config.addressCiudadField,
            config.addressDeptoField,
            config.addressMuniField,
            config.contactField,
            config.contactIdField,
            config.emailField,
            config.entityField,
            config.identNumeroField,
            config.phoneField,
            config.paisField,
            config.ciudadField,
            config.industriaField,
            nuevoEntityAction,
            nuevoContactoAction,
            entityOptions,
            selectedEntityId,
            selectedContactId,
            config.dateField,
            direccionLocked,
            contactoOptions,
            paisOptions,
            departamentoOptions,
            municipioOptions,
            ciudadOptions,
            industriaOptions,
            tiposContactoOptions,
            modoNuevo,
        ],
    );

    const handleRefresh = useCallback(
        buildHandleRefresh({
            queryClient,
            config,
            prefillEntityId,
            prefillEntityAlreadyInList,
            codTipoEntidad,
            selectedEntityId,
            setValues,
            detallesEmbarque,
        }),
        [queryClient, config, prefillEntityId, prefillEntityAlreadyInList, codTipoEntidad, selectedEntityId, setValues, detallesEmbarque],
    );

    const executeSave = useCallback(async (payload, embarqueId) => {
        try {
            await actualizarCoordinacion(payload);
            await refreshCoordinationSharedData(queryClient, embarqueId, payload);
        } catch (error) {
            console.error("Error al actualizar coordinación:", error);
        }
    }, [actualizarCoordinacion, queryClient]);

    const invalidateEntityQueries = useCallback((entityIdUsed) => {
        queryClient.invalidateQueries({
            queryKey: ["entidades", { tipo_entidad: config.relationType }],
        });
        if (entidadIdCliente) {
            queryClient.invalidateQueries({
                queryKey: ["datos-entidad-relacionada-appweb", { entidad_id: Number(entidadIdCliente), cod_tipo: codTipoCliente, cod_estado: 1 }],
            });
        }
        invalidateSelectedEntityQueries({
            queryClient,
            codTipoEntidad,
            selectedEntityId: entityIdUsed,
        });
    }, [queryClient, config.relationType, entidadIdCliente, codTipoEntidad, codTipoCliente]);

    const buildDireccionPayload = useCallback(() => ({
        entidad_id: null,
        cod_tipo: 145,
        entidaddireccion_direccion: values[config.addressField],
        entidaddireccion_zona: values[config.addressZonaField] || "",
        entidaddireccion_km: values[config.addressKmField] || null,
        cod_muni: values[config.addressMuniField] ? Number(values[config.addressMuniField]) : null,
        cod_depto: values[config.addressDeptoField] ? Number(values[config.addressDeptoField]) : null,
        cod_pais: Number(values[config.addressCountryField]),
        cod_estado: 1,
    }), [values, config]);

    const buildContactoPayload = useCallback(() => ({
        entidad_id: null,
        cod_estado: 1,
        entidadcontacto_nombre: values[config.contactField],
        entidadcontacto_email: values[config.emailField],
        entidadcontacto_telefono: values[config.phoneField],
        lista_cod_tipo: values._contacto_tipo_list || [],
        cod_emp: empresaIdFromDetalles || null,
        cod_cc: centroCostoIdFromDetalles || null,
    }), [values, config, empresaIdFromDetalles, centroCostoIdFromDetalles]);

    const buildIdentPayload = useCallback(() => ({
        entidad_id: null,
        cod_identificacion: config.nitCodIdentificacion,
        entidadidentificacio_numero: values[config.identNumeroField],
        cod_estado: 1,
        entidadidentificacion_fecha_inicio: null,
        entidadidentificacion_fecha_fin: null,
        entidadidentificacion_ruta: null,
    }), [values, config]);

    const handleCreateNewEntity = useCallback(async (embarqueId, jsonOpcionales) => {
        let entidadIdToUse = selectedEntityId ? Number(selectedEntityId) : null;

        if (!entidadIdToUse) {
            const entidadResp = await api.post("api/appweb/insertar-entidad", {
                entidad_nombre: values[config.nombreField],
                cod_ciudad: values[config.ciudadField] ? Number(values[config.ciudadField]) : null,
                cod_pais: values[config.paisField] ? Number(values[config.paisField]) : null,
                cod_industria: values[config.industriaField] ? Number(values[config.industriaField]) : null,
                limite_credito: 0,
                cod_moneda: null,
                credito_utilizado: 0,
                cod_estado: 1,
                cod_tipo: config.nuevaEntidadTipo,
            });
            entidadIdToUse = Number(entidadResp.data.data.entidad_id);

            await insertarEntidadRelacion({
                cod_estado: 1,
                cod_tipo: 300,
                entidad_id_1: Number(entidadIdCliente),
                entidad_id_2: entidadIdToUse,
            });
        }

        const direccionPayload = buildDireccionPayload();
        await insertarEntidadDireccion({ ...direccionPayload, entidad_id: entidadIdToUse });

        const contactoPayload = buildContactoPayload();
        const contactResult = await insertarEntidadContacto({ ...contactoPayload, entidad_id: entidadIdToUse });
        const newContactoId = contactResult?.data?.entidadcontacto_id || null;

        if (values[config.identNumeroField]) {
            const identPayload = buildIdentPayload();
            await insertarEntidadIdentificacion({ ...identPayload, entidad_id: entidadIdToUse });
        }

        const valuesWithContact = { ...values, [config.contactIdField]: newContactoId };
        const entityObj = { entidad_id: entidadIdToUse, entidad_nombre: values[config.nombreField] };
        const finalPayload = buildCoordPayload(
            detallesEmbarque,
            {
                ...config.savePayload(entidadIdToUse, entityObj, valuesWithContact),
                json_atributos_opcionales: jsonOpcionales,
            },
            cod_usuario,
        );
        await executeSave(finalPayload, embarqueId);

        invalidateEntityQueries(entidadIdToUse);
        setModoNuevo(false);
    }, [selectedEntityId, values, config, insertarEntidadRelacion, entidadIdCliente, insertarEntidadContacto, insertarEntidadIdentificacion, buildDireccionPayload, buildContactoPayload, buildIdentPayload, detallesEmbarque, cod_usuario, executeSave, invalidateEntityQueries, insertarEntidadDireccion]);

    const updateEntityDireccion = useCallback(async (existingEntityId) => {
        const direccionId = selectedDireccionObj?.entidaddireccion_id;
        if (!values[config.addressField]) return;

        const direccionPayload = buildDireccionPayload();
        if (direccionId) {
            await actualizarEntidadDireccion({
                entidaddireccion_id: Number(direccionId),
                ...direccionPayload,
                entidad_id: existingEntityId,
            });
        } else {
            await insertarEntidadDireccion({ ...direccionPayload, entidad_id: existingEntityId });
        }
    }, [values, config, selectedDireccionObj, actualizarEntidadDireccion, insertarEntidadDireccion, buildDireccionPayload]);

    const updateEntityContacto = useCallback(async (existingEntityId) => {
        const existingContactoId = values[config.contactIdField] ? Number(values[config.contactIdField]) : null;
        const contactoPayload = buildContactoPayload();

        if (existingContactoId) {
            await actualizarEntidadContacto({ entidadcontacto_id: existingContactoId, ...contactoPayload, entidad_id: existingEntityId });
            return existingContactoId;
        }

        const contactResult = await insertarEntidadContacto({ ...contactoPayload, entidad_id: existingEntityId });
        return contactResult?.data?.entidadcontacto_id || null;
    }, [values, config, actualizarEntidadContacto, insertarEntidadContacto, buildContactoPayload]);

    const updateEntityIdentificacion = useCallback(async (existingEntityId) => {
        const existingIdentId = identOptions?.[0]?.value ? Number(identOptions[0].value) : null;
        const numeroNit = values[config.identNumeroField];
        if (!numeroNit) return;

        const identPayload = buildIdentPayload();
        if (existingIdentId) {
            await actualizarEntidadIdentificacion({ entidadidentificacion_id: existingIdentId, ...identPayload, entidad_id: existingEntityId });
        } else {
            await insertarEntidadIdentificacion({ ...identPayload, entidad_id: existingEntityId });
        }
    }, [values, config, identOptions, actualizarEntidadIdentificacion, insertarEntidadIdentificacion, buildIdentPayload]);

    const handleUpdateExistingEntity = useCallback(async (embarqueId, jsonOpcionales) => {
        const existingEntityId = Number(selectedEntityId);
        if (!existingEntityId) return;

        await api.post("api/appweb/actualizar-entidad", {
            entidad_id: existingEntityId,
            entidad_nombre: values[config.nombreField],
            cod_ciudad: values[config.ciudadField] ? Number(values[config.ciudadField]) : null,
            cod_pais: values[config.paisField] ? Number(values[config.paisField]) : null,
            cod_industria: values[config.industriaField] ? Number(values[config.industriaField]) : null,
            cod_estado: selectedEntityObj?.cod_estado || 1,
        });

        if (entidadIdCliente && !isSelectedEntityRelated && String(entidadIdCliente) !== String(existingEntityId)) {
            await insertarEntidadRelacion({
                cod_estado: 1,
                cod_tipo: 300,
                entidad_id_1: Number(entidadIdCliente),
                entidad_id_2: existingEntityId,
            });
        }

        await updateEntityDireccion(existingEntityId);
        const contactoIdToUse = await updateEntityContacto(existingEntityId);
        await updateEntityIdentificacion(existingEntityId);

        const valuesWithContact = contactoIdToUse ? { ...values, [config.contactIdField]: contactoIdToUse } : values;
        const finalPayload = buildCoordPayload(
            detallesEmbarque,
            {
                ...config.savePayload(existingEntityId, selectedEntityObj, valuesWithContact),
                json_atributos_opcionales: jsonOpcionales,
            },
            cod_usuario,
        );
        await executeSave(finalPayload, embarqueId);
        invalidateEntityQueries(existingEntityId);
    }, [selectedEntityId, values, config, selectedEntityObj, entidadIdCliente, isSelectedEntityRelated, insertarEntidadRelacion, updateEntityDireccion, updateEntityContacto, updateEntityIdentificacion, detallesEmbarque, cod_usuario, executeSave, invalidateEntityQueries]);

    const handleSave = useCallback(async () => {
        if (!isFormValid({ values, config, identRequired, modoNuevo })) return;

        const embarqueId = getEmbarqueId(detallesEmbarque, normalizedPropEmbarqueId);
        if (!embarqueId) {
            console.error("No se encontró embarque_id para actualizar la coordinación.");
            return;
        }

        const jsonOpcionales = buildJsonOpcionales({
            detallesEmbarque,
            fechaRecoleccionValue: values[config.dateField],
            telefonoEmergenciaValue: values.telefonoEmergencia,
        });

        try {
            if (modoNuevo) {
                await handleCreateNewEntity(embarqueId, jsonOpcionales);
            } else if (selectedEntityId) {
                await handleUpdateExistingEntity(embarqueId, jsonOpcionales);
            } else {
                const finalPayload = buildCoordPayload(
                    detallesEmbarque,
                    {
                        ...config.savePayload(selectedEntityId, selectedEntityObj, values),
                        json_atributos_opcionales: jsonOpcionales,
                    },
                    cod_usuario,
                );
                await executeSave(finalPayload, embarqueId);
            }

            if (typeof onSaveSuccess === "function") {
                await onSaveSuccess();
            }
        } catch (error) {
            console.error("Error al guardar:", error);
        }
    }, [
        cod_usuario,
        config,
        detallesEmbarque,
        normalizedPropEmbarqueId,
        selectedEntityId,
        selectedEntityObj,
        values,
        isFormValid,
        executeSave,
        modoNuevo,
        handleCreateNewEntity,
        handleUpdateExistingEntity,
        identRequired,
        onSaveSuccess,
    ]);

    const isValid = isFormValid({ values, config, identRequired, modoNuevo });

    const savedEntityId = getFirstExistingValue(detallesEmbarque, config.prefillEntityKeys, "");
    const isSavedValid = Boolean(savedEntityId) && isValid;
    const reportedValidity = buildReportedValidity(isValid, isSavedValid);

    useValidityReporter(onValidityChange, reportedValidity);
    useLoadingReporter(detallesEmbarque, relacionesFetching, onLoadingChange);
    useEntityValueNotifier({
        entityOptions,
        values,
        config,
        onValuesChange,
        selectedDireccionObj,
        selectedEntityId,
        identOptions,
        contactosRespData: contactosActivos,
    });

    const copiarDeClienteButton = null;
    const estadoFormulario = reportedValidity === VALIDITY_STATUS.VALID ? null : {
        severidad: reportedValidity === VALIDITY_STATUS.PENDING ? "info" : "warning",
        titulo: reportedValidity === VALIDITY_STATUS.PENDING ? "Pendiente de guardar" : "Faltan completar campos",
        mensaje: reportedValidity === VALIDITY_STATUS.PENDING
            ? `${displayTitle} esta completo, pero aun no se ha guardado.`
            : `Complete los datos obligatorios de ${displayTitle}.`,
    };

    const handleContactoCreada = useCallback((resultado) => {
        const saved = resultado?.data;
        if (saved) {
            setValues((previousValues) => ({
                ...previousValues,
                [config.contactIdField]: saved.entidadcontacto_id === null ? previousValues[config.contactIdField] : String(saved.entidadcontacto_id),
                [config.contactField]: saved.entidadcontacto_nombre || previousValues[config.contactField],
                [config.phoneField]: saved.entidadcontacto_telefono || previousValues[config.phoneField],
                [config.emailField]: saved.entidadcontacto_email || previousValues[config.emailField],
            }));
        }
        if (codTipoEntidad && selectedEntityId) {
            queryClient.invalidateQueries({
                queryKey: ["entidad-contacto", { cod_tipo: codTipoEntidad, entidad_id: selectedEntityId }],
            });
        }
        setOpenCrearContacto(false);
    }, [config, codTipoEntidad, selectedEntityId, queryClient]);

    return (
        <Box sx={{ position: "relative", minHeight: "100%" }}>
            {modoNuevo && (
                <BannerInformativo
                    severidad="info"
                    titulo={`Ingresando nuevo ${displayTitle}`}
                    mensaje={`Complete los datos del nuevo ${displayTitle}. Los campos están habilitados para ingreso manual.`}
                />
            )}
            {!modoNuevo && estadoFormulario && (
                <BannerInformativo
                    severidad={estadoFormulario.severidad}
                    titulo={estadoFormulario.titulo}
                    mensaje={estadoFormulario.mensaje}
                />
            )}

            <Box sx={{ display: "flex", gap: 3, alignItems: { xs: "stretch", md: "flex-start" }, flexDirection: { xs: "column", md: "row" }, flexWrap: "wrap", justifyContent: "center" }}>
                <Box sx={{ flex: "0 1 720px", minWidth: 0 }}>
                    <FormularioConGuardar disabled={!isValid} onGuardar={handleSave} variant="modern">
                        <EntidadFormHeader title={displayTitle} />
                        <FormularioAlternativo
                            title={displayTitle}
                            hideHeader
                            fields={fields}
                            initialValues={values}
                            onFieldChange={handleFieldChange}
                            onValuesChange={handleValuesChange}
                            onRefresh={handleRefresh}
                            showSubmitButton={false}
                            topContent={copiarDeClienteButton}
                            variant="modern"
                        />
                    </FormularioConGuardar>
                </Box>

                {clienteData && (
                    <Box sx={{ width: { xs: "100%", md: 380 }, flexShrink: 0 }}>
                        <ClienteComparePanel
                            titulo={displayTitle}
                            clienteEntityNombre={clienteEntityNombre}
                            differsEntity={differsEntity}
                            isRelated={isClienteEntityRelated}
                            relating={relatingCliente}
                            onAcceptEntity={handleAcceptClienteEntity}
                            rows={clienteCompareRowsConUndo}
                            onAcceptField={handleAcceptClienteField}
                            onAcceptAllFields={handleAcceptAllClienteFields}
                            onUndoField={handleUndoClienteField}
                            onUndoAllFields={handleUndoAllClienteFields}
                        />
                    </Box>
                )}
            </Box>

            <DialogComponent
                titulo={config.contactDialogCreateTitle || "Nuevo Contacto"}
                openDialog={openCrearContacto}
                handleClose={() => setOpenCrearContacto(false)}
                width="50vw"
                height="auto"
            >
                <NuevoContactoEntidad
                    entidadId={selectedEntityId || null}
                    onSubmit={handleContactoCreada}
                />
            </DialogComponent>
        </Box>
    );
};

EntidadFormSection.propTypes = {
    config: PropTypes.shape({
        title: PropTypes.string.isRequired,
        relationType: PropTypes.string.isRequired,
        relacionTipoDescripcion: PropTypes.string.isRequired,
        relationTypeAliases: PropTypes.arrayOf(PropTypes.string),
        entityField: PropTypes.string.isRequired,
        nombreField: PropTypes.string.isRequired,
        addressField: PropTypes.string.isRequired,
        addressCountryField: PropTypes.string.isRequired,
        addressZonaField: PropTypes.string,
        addressKmField: PropTypes.string,
        addressCiudadField: PropTypes.string,
        addressDeptoField: PropTypes.string,
        addressMuniField: PropTypes.string,
        paisField: PropTypes.string,
        ciudadField: PropTypes.string,
        industriaField: PropTypes.string,
        contactField: PropTypes.string.isRequired,
        contactIdField: PropTypes.string.isRequired,
        phoneField: PropTypes.string.isRequired,
        emailField: PropTypes.string.isRequired,
        identTributariaField: PropTypes.string,
        identNumeroField: PropTypes.string,
        identRequired: PropTypes.bool,
        nuevaEntidadTipo: PropTypes.number.isRequired,
        nitCodIdentificacion: PropTypes.number.isRequired,
        prefillEntityKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
        prefillAddressKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
        prefillContactKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
        prefillPhoneKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
        prefillEmailKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
        prefillDateKeys: PropTypes.arrayOf(PropTypes.string),
        dateField: PropTypes.string,
        initialValues: PropTypes.object.isRequired,
        savePayload: PropTypes.func.isRequired,
        hidePaisesAsociados: PropTypes.bool,
        hiddenFields: PropTypes.instanceOf(Set),
        contactDialogCreateTitle: PropTypes.string,
    }).isRequired,
    title: PropTypes.string,
    embarque_id: PropTypes.number,
    embarqueData: PropTypes.object,
    clienteData: PropTypes.object,
    onValidityChange: PropTypes.func,
    onValuesChange: PropTypes.func,
    onLoadingChange: PropTypes.func,
    onSaveSuccess: PropTypes.func,
};

export default EntidadFormSection;
