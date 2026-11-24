import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Box, CircularProgress } from "@mui/material";
import { areRequiredFieldsFilled, getModifiedFields, unionModificados } from "../seccionesPublicas/validation";
import { EntidadPublicForm, buildEntidadPublicFields, EntidadFormHeader } from "@/pages/Embarques/components/Entidades/entidadFormUI";
import FormularioAlternativo from "@/components/bpm/Formularios/FormularioAlternativo";
import EntidadComparePanel from "@/pages/Embarques/components/Entidades/EntidadComparePanel";
import { ENTIDAD_REL_FIELD_MAP, getEntidadRelSource } from "@/pages/Embarques/components/cartaInstrucciones/entidadRelacionada";
import BannerInformativo from "@/pages/Embarques/components/banner";
import DialogComponent from "@/components/Dialog/DialogComponent";
import NuevaEntidad from "@/pages/Embarques/components/Entidades/modalEntidad/nuevaEntidad";
import NuevaDireccionEntidad from "@/pages/Embarques/components/Entidades/modalEntidad/nuevaDireccionEntidad";
import NuevaIdentificacionEntidad from "@/pages/Embarques/components/Entidades/modalEntidad/nuevaIdentificacionEntidad";
import {
    useFetchDatosEntidadPublico,
    useFetchDatosEntidadRelacionadaAppweb,
    useFetchDatosEntidadRelacionadaPublico,
    useFetchEntidadContacto,
    useFetchEntidadesDireccion,
    useFetchEntidadIdentificacion,
    useFetchPaises,
    useFetchPaisesPublico,
    useFetchCiudades,
    useFetchCiudadesPublico,
    useFetchDepartamentos,
    useFetchDepartamentosPublico,
    useFetchMunicipios,
    useFetchMunicipiosPublico,
    useFetchIndustrias,
    useFetchIndustriasPublico,
    useFetchTipos,
    useFetchTiposPublico,
} from "@/hooks/Bpm";

// Form field names — identical for all public entity forms (shipper & consignatario).
const FORM_CONFIG = {
    entityField: "entidad_id",
    nombreField: "entidad_nombre",
    paisField: "entidad_pais",
    ciudadField: "direccion_recoleccion_ciudad",
    industriaField: "entidad_industria",
    addressField: "direccion_recoleccion",
    addressCountryField: "direccion_recoleccion_pais",
    addressDeptoField: "direccion_recoleccion_depto",
    addressMuniField: "direccion_recoleccion_muni",
    contactField: "entidad_contacto_nombre",
    contactIdField: "entidadcontacto_id",
    phoneField: "entidad_contacto_telefono",
    emailField: "entidad_contacto_email",
    identNumeroField: "entidad_nit",
    identRequired: false,
};

const REQUIRED_FIELDS = new Set([
    "entidad_nombre",
    "entidad_pais",
    "entidad_industria",
    "direccion_recoleccion",
    "direccion_recoleccion_pais",
    "entidad_nit",
    "entidad_contacto_nombre",
    "entidad_contacto_email",
    "entidad_contacto_telefono",
]);

const normalizeLabel = (v) =>
    String(v || "").normalize("NFD").replaceAll(/[̀-ͯ]/g, "").trim().toUpperCase();

// `entidad_nombre` a veces llega vacío en el snapshot (p.ej. entidades creadas
// como "candidato"), pero el nombre real vive en `data_nombres[0]`. Sin este
// fallback, esas entidades quedan sin label y desaparecen del selector.
const resolveEntidadNombre = (ent) =>
    ent?.entidad_nombre || ent?.data_nombres?.[0]?.entidadnombre_nombre || "";

// API de recuperar-datos-entidad-relacionada devuelve claves en MAYÚSCULAS.
// Normalizamos a minúsculas recursivamente para que el resto del código funcione
// con claves consistentes.
const normalizeKeys = (obj) => {
    if (Array.isArray(obj)) return obj.map(normalizeKeys);
    if (obj !== null && typeof obj === "object") {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k.toLowerCase(), normalizeKeys(v)]),
        );
    }
    return obj;
};

// Extrae los códigos de tipo de contacto. `data_entidad_contacto_tipo` llega como
// JSON string con objetos {cod_tipo, tipo_descripcion}; también acepta array
// directo o fallback a `lista_cod_tipo`.
const extractContactoTipoList = (contacto) => {
    if (!contacto) return [];

    let raw = contacto.data_entidad_contacto_tipo ?? contacto.lista_cod_tipo ?? contacto._contacto_tipo_list ?? [];
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

const buildInitialValues = (d, config) => ({
    entidad_id: d?.entidad_id ?? "",
    entidad_nombre: d?.nombre || "",
    entidad_pais: d?.paisDestino || "",
    direccion_recoleccion: d?.[config.addressDataKey] || "",
    direccion_recoleccion_pais: d?.paisDestino || "",
    direccion_recoleccion_ciudad: d?.ciudadDestino || "",
    direccion_recoleccion_depto: d?.departamentoDestino || "",
    direccion_recoleccion_muni: d?.municipioDestino || "",
    entidad_industria: d?.industria || "",
    entidadcontacto_id: d?.entidadcontacto_id != null ? String(d.entidadcontacto_id) : "",
    entidad_contacto_nombre: d?.contacto || "",
    entidad_contacto_telefono: d?.[config.phoneDataKey] || "",
    entidad_contacto_email: d?.email || "",
    _contacto_tipo_list: extractContactoTipoList(d),
    entidad_nit: d?.nit || "",
    entidaddireccion_id: d?.entidaddireccion_id ?? null,
    entidadidentificacion_id: d?.entidadidentificacion_id ?? null,
    identificacion_tributaria: "",
    telefonoEmergencia: d?.telefonoEmergencia || "",
});

// Helper to build patch with basic entity fields
const applyBasicFields = (patch, prev, ent, codPais, codIndustria) => {
    if (!prev.entidad_nombre && ent.entidad_nombre) patch.entidad_nombre = ent.entidad_nombre;
    if (!prev.entidad_pais && codPais) patch.entidad_pais = codPais;
    if (!prev.entidad_industria && codIndustria) patch.entidad_industria = codIndustria;
};

// Helper to build patch with address fields
const applyAddressFields = (patch, prev, codPais, codCiudad, codDepto, codMuni, addr) => {
    if (!prev.direccion_recoleccion_pais && codPais) patch.direccion_recoleccion_pais = codPais;
    if (!prev.direccion_recoleccion_ciudad && codCiudad) patch.direccion_recoleccion_ciudad = codCiudad;
    if (!prev.direccion_recoleccion_depto && codDepto) patch.direccion_recoleccion_depto = codDepto;
    if (!prev.direccion_recoleccion_muni && codMuni) patch.direccion_recoleccion_muni = codMuni;
    if (!prev.direccion_recoleccion && addr?.entidaddireccion_direccion) {
        patch.direccion_recoleccion = addr.entidaddireccion_direccion;
    }
};

// Helper to build patch with contact fields
const applyContactFields = (patch, prev, contact) => {
    if (!prev.entidadcontacto_id && contact) {
        patch.entidadcontacto_id = String(contact.entidadcontacto_id);
        patch.entidad_contacto_nombre = contact.entidadcontacto_nombre || "";
        patch.entidad_contacto_email = contact.entidadcontacto_email || "";
        patch.entidad_contacto_telefono = contact.entidadcontacto_telefono || "";
        patch._contacto_tipo_list = extractContactoTipoList(contact);
    }
};

// Helper to build patch with NIT field
const applyNitField = (patch, prev, nit) => {
    if (!prev.entidad_nit && nit) patch.entidad_nit = nit;
};

const pickEntidadIdFromData = (d, fallback) => {
    const id = d?.entidad_id;
    if (id !== undefined && id !== null && id !== "") return id;
    if (fallback !== undefined && fallback !== null && fallback !== "") return fallback;
    return "";
};

// Resuelve un valor (o lista de códigos) contra opciones {value,label}, devolviendo
// el label legible. Si no hay match, devuelve el valor crudo.
const resolveCatalogLabel = (rawValue, options) => {
    if (rawValue === undefined || rawValue === null || rawValue === "") return "";
    const findLabel = (v) => {
        const found = (options || []).find((opt) => String(opt.value) === String(v));
        return found ? (found.label ?? String(v)) : String(v);
    };
    if (Array.isArray(rawValue)) return rawValue.map(findLabel).join(", ");
    return findLabel(rawValue);
};

const normalizeCompareValue = (v) => {
    if (Array.isArray(v)) return [...v].map(String).sort((a, b) => a.localeCompare(b)).join(",");
    return String(v ?? "");
};

// Campos comparables shipper/consignatario: clave del form → etiqueta, sección y
// catálogo para resolver el label. La sección coincide con las del formulario.
const CAMBIOS_DEFS = [
    { key: "entidad_nombre", label: "Nombre", section: "info" },
    { key: "entidad_pais", label: "País", section: "info", catalog: "paises" },
    { key: "direccion_recoleccion_ciudad", label: "Ciudad", section: "info", catalog: "ciudades" },
    { key: "entidad_industria", label: "Industria", section: "info", catalog: "industrias" },
    { key: "direccion_recoleccion", label: "Dirección de Recolección", section: "Dirección" },
    { key: "direccion_recoleccion_pais", label: "País", section: "Dirección", catalog: "paises" },
    { key: "direccion_recoleccion_depto", label: "Departamento", section: "Dirección", catalog: "departamentos" },
    { key: "direccion_recoleccion_muni", label: "Municipio", section: "Dirección", catalog: "municipios" },
    { key: "entidad_contacto_nombre", label: "Nombre Contacto", section: "Contacto" },
    { key: "entidad_contacto_email", label: "Email", section: "Contacto" },
    { key: "entidad_contacto_telefono", label: "Teléfono", section: "Contacto" },
    { key: "_contacto_tipo_list", label: "Tipo(s) de Contacto", section: "Contacto", catalog: "tiposContacto" },
    { key: "entidad_nit", label: "NIT", section: "Identificación" },
];

// Campos cuyo maestro se resuelve preferentemente desde una consulta "separada"
// (privado: useFetchEntidadContacto/Direccion/Identificacion), porque el
// snapshot de recuperar-datos-entidad-relacionada puede traer esos sub-arreglos
// vacíos o desactualizados (ver comentario en contactoOptions más abajo).
const SEPARATED_FIELD_ACCESSORS = {
    entidad_contacto_nombre: (s) => s.contacto?.entidadcontacto_nombre ?? "",
    entidad_contacto_email: (s) => s.contacto?.entidadcontacto_email ?? "",
    entidad_contacto_telefono: (s) => s.contacto?.entidadcontacto_telefono ?? "",
    direccion_recoleccion: (s) => s.direccion?.direccion ?? "",
    direccion_recoleccion_pais: (s) => s.direccion?.cod_pais ?? "",
    direccion_recoleccion_depto: (s) => s.direccion?.cod_depto ?? "",
    direccion_recoleccion_muni: (s) => s.direccion?.cod_muni ?? "",
    entidad_nit: (s) => s.nit ?? "",
};

// Obtiene el valor maestro (BD) de un campo del form. Prioriza las consultas
// "separadas" (más confiables en privado) y cae al snapshot raw de
// recuperar-datos-entidad-relacionada cuando no hay dato separado disponible.
const getMasterValue = (rawEntidad, key, formVals, separated = {}) => {
    if (key === "_contacto_tipo_list") {
        if (separated.contacto) {
            return (separated.contacto.data_entidad_contacto_tipo || []).map((t) => String(t.cod_tipo ?? t.COD_TIPO ?? t));
        }
        const source = getEntidadRelSource(rawEntidad, "contacto", formVals);
        return (source?.data_entidad_contacto_tipo || []).map((t) => String(t.cod_tipo));
    }

    const separatedAccessor = SEPARATED_FIELD_ACCESSORS[key];
    if (separatedAccessor) {
        if (key.startsWith("entidad_contacto_") && separated.contacto) return separatedAccessor(separated);
        if (key.startsWith("direccion_recoleccion") && separated.direccion) return separatedAccessor(separated);
        if (key === "entidad_nit" && separated.nit !== null && separated.nit !== undefined) return separatedAccessor(separated);
    }

    if (!rawEntidad) return "";
    const def = ENTIDAD_REL_FIELD_MAP[key];
    if (!def) return "";
    const source = getEntidadRelSource(rawEntidad, def.src, formVals);
    return source?.[def.rawCode || def.code] ?? "";
};

// Construye las filas de comparación (maestro BD → valor que envió el cliente)
// para los campos listados en `_modificados`.
const buildCambiosClienteRows = ({ modificados, rawEntidad, values, sectionInfo, catalogs, separated = {} }) => {
    const mods = Array.isArray(modificados) ? modificados : [];
    if (mods.length === 0) return [];

    return CAMBIOS_DEFS
        .filter((def) => mods.includes(def.key))
        .map((def) => {
            const masterValue = getMasterValue(rawEntidad, def.key, values, separated);
            const clienteValue = def.key === "_contacto_tipo_list"
                ? (values._contacto_tipo_list || [])
                : (values[def.key] ?? "");

            const formatLabel = (value) => (def.catalog && catalogs[def.catalog]
                ? resolveCatalogLabel(value, catalogs[def.catalog])
                : (Array.isArray(value) ? value.join(", ") : value));

            return {
                configKey: def.key,
                label: def.label,
                section: def.section === "info" ? sectionInfo : def.section,
                currentValue: masterValue,
                currentLabel: formatLabel(masterValue),
                clienteValue,
                clienteLabel: formatLabel(clienteValue),
                modificado: true,
                iguales: normalizeCompareValue(masterValue) === normalizeCompareValue(clienteValue),
            };
        })
        .filter((row) => !row.iguales);
};

/**
 * config shape:
 * {
 *   title: string,
 *   sectionLabel: string,
 *   aliases: Set<string>,        — normalized tipo_relacion values that match this role
 *   tipo: number,                — cod_tipo for NuevaEntidad / NuevaDireccionEntidad
 *   nitCodIdentificacion: number,
 *   addressDataKey: string,      — key in `data` prop for the address field
 *   phoneDataKey: string,        — key in `data` prop for the phone field
 *   dialogs: { entidad, direccion, contacto, ident },
 * }
 */
const EntidadPublicFormSection = ({
    config,
    data = {},
    isLoading = false,
    onValidityChange = null,
    onValuesChange = null,
    onSave = null,
    isSaving = false,
    cliInfo = null,
    selectedEntidadId = null,
    apiMode = "public",
    disableEntitySelector = false,
}) => {
    const readOnly = apiMode === "private";

    const [values, setValues] = useState(() => {
        const merged = { ...(data || {}), entidad_id: pickEntidadIdFromData(data, selectedEntidadId) };
        return buildInitialValues(merged, config);
    });
    // Línea base para detectar ediciones reales del cliente: arranca igual a los
    // valores iniciales, pero se actualiza junto con los auto-rellenos (entidad,
    // dirección, contacto, NIT) para que esos defaults heredados del maestro NO
    // se cuenten como "modificados". Solo lo que el cliente cambia a mano respecto
    // a esta línea base entra en `_modificados`.
    const baselineRef = useRef(values);

    const [openCrearEntidad, setOpenCrearEntidad] = useState(false);
    const [openCrearDireccion, setOpenCrearDireccion] = useState(false);
    const [openCrearIdent, setOpenCrearIdent] = useState(false);
    // "Nuevo" en Contacto ya no abre un modal: bloquea el selector de contacto
    // (solo lectura) y deja los campos nombre/email/teléfono libres para
    // capturar un contacto nuevo directo en el formulario.
    const [modoNuevoContacto, setModoNuevoContacto] = useState(false);
    // Tras crear una entidad nueva vía el modal "Nuevo", el selector de
    // entidad (Shipper/Consignatario) se bloquea para no pisar los datos
    // recién capturados si el usuario vuelve a tocarlo; el botón pasa a
    // "Cancelar" para poder volver al modo selección.
    const [modoNuevaEntidad, setModoNuevaEntidad] = useState(false);

    const { data: paisesData = [] } = apiMode === "private"
        ? useFetchPaises()
        : useFetchPaisesPublico();
    const paisOptions = useMemo(
        () => paisesData.map((p) => ({ value: p.cod_pais, label: p.nombre_pais })),
        [paisesData],
    );

    // Resolve paisDestino name → code once paises are loaded
    const resolvedData = useMemo(() => {
        if (!data || !paisesData.length) return data;
        const raw = data.paisDestino;
        if (!raw) return data;
        const isCode = paisesData.some((p) => String(p.cod_pais) === String(raw));
        if (isCode) return data;
        const match = paisesData.find((p) => p.nombre_pais?.toLowerCase() === String(raw).toLowerCase());
        return match ? { ...data, paisDestino: String(match.cod_pais) } : data;
    }, [data, paisesData]);

    const entidadesRelParams = { entidad_id: cliInfo?.entidad_id, cod_tipo: cliInfo?.cod_tipo ?? 3, cod_estado: 1 };
    const entidadesRelOptions = { enabled: Boolean(cliInfo?.entidad_id) };
    const entidadesRelQuery = apiMode === "private"
        ? useFetchDatosEntidadRelacionadaAppweb(entidadesRelParams, entidadesRelOptions)
        : useFetchDatosEntidadRelacionadaPublico(entidadesRelParams, entidadesRelOptions);
    const { data: entidadesData, isLoading: entidadesRelLoading } = entidadesRelQuery;

    const allEntidades = useMemo(
        () => (entidadesData?.data || []).map(normalizeKeys),
        [entidadesData],
    );

    // `descripcion_tipo_relacion` describe el tipo de RELACIÓN (cod_tipo_relacion
    // 300, "entidad relacionada al cliente"), no el tipo de la entidad — en la
    // práctica el backend devuelve el mismo texto ("CONSIGNATARIO") para todas
    // las filas sin importar si la entidad es shipper o consignatario. Por eso
    // se prioriza `entidad_clasificacion` (correcto por entidad) y solo se cae a
    // `descripcion_tipo_relacion` cuando la clasificación viene vacía.
    const entidades = useMemo(
        () => allEntidades.filter((e) => {
            const clasificacion = normalizeLabel(e.entidad_clasificacion);
            if (clasificacion) return config.aliases.has(clasificacion);
            return config.aliases.has(normalizeLabel(e.descripcion_tipo_relacion));
        }),
        [allEntidades, config.aliases],
    );

    // `entidadesRelParams` trae solo entidades RELACIONADAS al cliente (p.ej.
    // shippers/consignatarios distintos de él), nunca al cliente mismo. Cuando
    // la coordinación preselecciona como shipper la MISMA entidad del cliente
    // (caso válido: el cliente despacha su propia mercadería), `allEntidades`
    // no trae ese registro y todo el autorelleno (nombre/dirección/contacto/NIT)
    // se queda vacío — la sección nunca llega a `isValid`, así que el banner
    // sigue mostrando "Aún no se ha guardado" y el stepper no marca el paso
    // como completo aunque el selector ya muestre la entidad elegida. Se
    // resuelve consultando el maestro de esa entidad puntual por separado.
    const entidadSeleccionadaId = values.entidad_id;
    const entidadEnRelacionadas = useMemo(
        () => allEntidades.find((e) => String(e.entidad_id) === String(entidadSeleccionadaId)) || null,
        [allEntidades, entidadSeleccionadaId],
    );
    const { data: entidadFallbackRaw } = useFetchDatosEntidadPublico(
        { entidad_id: entidadSeleccionadaId },
        { enabled: apiMode === "public" && Boolean(entidadSeleccionadaId) && !entidadEnRelacionadas },
    );
    const entidadFallback = useMemo(() => {
        const base = entidadFallbackRaw?.data_entidad?.[0];
        if (!base) return null;
        return {
            ...base,
            data_nombres: entidadFallbackRaw.data_nombres || [],
            data_contactos: entidadFallbackRaw.data_contactos || [],
            data_direcciones: entidadFallbackRaw.data_direcciones || [],
            data_identificaciones: entidadFallbackRaw.data_identificaciones || [],
        };
    }, [entidadFallbackRaw]);

    const findEntidadById = useCallback(
        (id) => {
            if (id === undefined || id === null || id === "") return null;
            const found = allEntidades.find((e) => String(e.entidad_id) === String(id));
            if (found) return found;
            if (entidadFallback && String(entidadFallback.entidad_id) === String(id)) return entidadFallback;
            return null;
        },
        [allEntidades, entidadFallback],
    );

    const codTipoEntidad = useMemo(
        () => findEntidadById(values.entidad_id)?.cod_tipo ?? (apiMode === "private" ? config.tipo : null),
        [findEntidadById, values.entidad_id, apiMode, config.tipo],
    );

    const { data: contactosResp = {} } = useFetchEntidadContacto(
        { cod_tipo: codTipoEntidad, entidad_id: values.entidad_id },
        { enabled: apiMode === "private" && Boolean(values.entidad_id) && Boolean(codTipoEntidad), staleTime: 5 * 60 * 1000 },
    );
    const contactosSeparados = useMemo(
        () => (apiMode === "private" ? (contactosResp?.data || []) : []),
        [apiMode, contactosResp],
    );

    // En privado, la lista de entidades-relacionadas (`findEntidadById`) puede no
    // traer la entidad del consignatario (sin relación cod_tipo 300 con el cliente),
    // dejando data_direcciones/data_identificaciones vacíos. Igual que el contacto,
    // se consulta dirección y NIT directo por cod_tipo + entidad_id.
    const { data: direccionesSepResp = [] } = useFetchEntidadesDireccion(
        { cod_tipo: codTipoEntidad, entidad_id: values.entidad_id },
        { enabled: apiMode === "private" && Boolean(values.entidad_id) && Boolean(codTipoEntidad), staleTime: 5 * 60 * 1000 },
    );
    const direccionesSeparadas = useMemo(
        () => (apiMode === "private" ? (direccionesSepResp || []) : []),
        [apiMode, direccionesSepResp],
    );

    const { data: identSepResp = {} } = useFetchEntidadIdentificacion(
        { cod_tipo: codTipoEntidad, entidad_id: values.entidad_id },
        { enabled: apiMode === "private" && Boolean(values.entidad_id) && Boolean(codTipoEntidad), staleTime: 5 * 60 * 1000 },
    );
    const identificacionesSeparadas = useMemo(
        () => (apiMode === "private" ? (identSepResp.data || []) : []),
        [apiMode, identSepResp],
    );

    // Campos que el cliente ya modificó explícitamente (vienen de _modificados,
    // persistido al guardar). Si un campo está aquí, ni el auto-relleno ni el
    // reset de abajo deben pisarlo con "" aunque el snapshot recién refetcheado
    // lo traiga vacío (p.ej. el cliente vació el Municipio a propósito, o el GET
    // que dispara el guardado de OTRA sección devuelve momentáneamente un
    // snapshot incompleto) — de lo contrario se revierte la edición del cliente,
    // se pierde el rastro del cambio en el panel de comparación, o la pestaña
    // parpadea a "Faltan campos" con datos que en realidad sí están guardados.
    const explicitlyModifiedKeys = useMemo(
        () => new Set(Array.isArray(data?._modificados) ? data._modificados : []),
        [data],
    );

    const resolvedDataSig = useMemo(() => JSON.stringify(resolvedData || {}), [resolvedData]);
    const lastResolvedSig = useRef(null);
    const lastSelectedEntidadIdSig = useRef(null);
    useEffect(() => {
        const selectedSig = selectedEntidadId == null ? "" : String(selectedEntidadId);
        const dataCambio = lastResolvedSig.current !== resolvedDataSig;
        const selectedCambio = lastSelectedEntidadIdSig.current !== selectedSig;
        if (!dataCambio && !selectedCambio) return;
        lastResolvedSig.current = resolvedDataSig;
        lastSelectedEntidadIdSig.current = selectedSig;
        const merged = {
            ...(resolvedData || {}),
            entidad_id: pickEntidadIdFromData(resolvedData, selectedEntidadId),
        };
        const nuevosValores = buildInitialValues(merged, config);
        setValues((prev) => {
            const patched = { ...nuevosValores };
            for (const key of explicitlyModifiedKeys) {
                const vacio = patched[key] === "" || patched[key] == null
                    || (Array.isArray(patched[key]) && patched[key].length === 0);
                if (vacio && prev[key] && !(Array.isArray(prev[key]) && prev[key].length === 0)) {
                    patched[key] = prev[key];
                }
            }
            // La línea base debe reflejar lo mismo que se aplicó a `values` (no el
            // `nuevosValores` sin parchar), o `hasChanges` compararía contra un
            // valor "" que nunca se mostró y marcaría la sección como "sin guardar".
            baselineRef.current = patched;
            return patched;
        });
        // La entidad se guardó como "nueva" sin entidad_id (el cliente la creó vía
        // "Nuevo" en la vista pública, sin elegir una existente). Cuando el campo
        // nunca cambió respecto a su línea base (p.ej. el cliente jamás tuvo una
        // entidad preseleccionada), `entidad_id` no entra en `_modificados` y llega
        // como `undefined` en vez de `""` explícito — por eso se aceptan ambos acá.
        // También exigimos que no haya `selectedEntidadId` (el id que trae la
        // coordinación): si lo hay, la entidad ya existe y no debe forzarse "nueva".
        // Forzar el modo "nueva entidad" evita que el selector, al abrir/recargar la
        // sección (p.ej. en CTS), muestre preseleccionada la entidad ANTERIOR
        // mientras el resto del formulario ya trae los datos que el cliente capturó
        // para la entidad nueva.
        const entidadIdVacio = resolvedData?.entidad_id === "" || resolvedData?.entidad_id === undefined;
        const sinEntidadIdSeleccionada = selectedEntidadId === undefined || selectedEntidadId === null || selectedEntidadId === "";
        if (entidadIdVacio && sinEntidadIdSeleccionada && Boolean(resolvedData?.nombre)) {
            setModoNuevaEntidad(true);
            setModoNuevoContacto(true);
        }
    }, [resolvedDataSig, resolvedData, config, selectedEntidadId, explicitlyModifiedKeys]);

    // Cuando cambia la entidad seleccionada, autocompletar país / ciudad / industria /
    // contacto / dirección / NIT desde la lista de entidades-relacionadas, si esos campos
    // todavía no tienen valor (no pisar ediciones manuales del usuario).
    // También se re-ejecuta cuando `resolvedDataSig` cambia o cuando `isSaving` pasa de
    // true a false: el refetch que dispara `handleGuardarSeccion` tras guardar puede
    // tardar más que el ciclo de re-render inmediato, o el GET puede devolver todavía
    // un snapshot incompleto (solo los campos recién modificados), dejando en blanco
    // campos que ya estaban completos. Sin este re-disparo, el guard de abajo (basado
    // solo en `id`) nunca vuelve a rellenarlos y el cliente queda viendo el formulario
    // vacío hasta que recarga la página manualmente.
    const lastAutoIdSig = useRef(null);
    useEffect(() => {
        const id = values.entidad_id;
        if (!id) return;
        const sig = `${id}|${resolvedDataSig}|${isSaving}`;
        if (lastAutoIdSig.current === sig) return;
        const ent = findEntidadById(id);
        if (!ent) return;
        lastAutoIdSig.current = sig;
        const contact = ent.data_contactos?.[0] || null;
        const addr = (ent.data_direcciones || []).find((d) => Number(d.cod_tipo) === 145) || null;
        const nit = (ent.data_identificaciones || []).find(
            (i) => String(i.nom_identificacion || "").toLowerCase() === "nit",
        )?.entidadidentificacio_numero || "";
        const codPais = ent.cod_pais ?? "";
        const codCiudad = ent.cod_ciudad ?? "";
        const codIndustria = ent.cod_industria ?? "";
        // La dirección (Dirección > País/Departamento/Municipio) tiene su propio país,
        // que puede diferir del país de clasificación de la entidad (codPais arriba) —
        // usar siempre el país de la dirección guardada, no el de la entidad.
        const codPaisDireccion = addr?.cod_pais ?? "";
        const codDepto = addr?.cod_depto ?? "";
        const codMuni = addr?.cod_muni ?? "";
        const canFill = (key) => !explicitlyModifiedKeys.has(key);
        setValues((prev) => {
            const patch = {};
            if (!prev.entidad_nombre && resolveEntidadNombre(ent) && canFill("entidad_nombre")) patch.entidad_nombre = resolveEntidadNombre(ent);
            if (!prev.entidad_pais && codPais && canFill("entidad_pais")) patch.entidad_pais = codPais;
            if (!prev.entidad_industria && codIndustria && canFill("entidad_industria")) patch.entidad_industria = codIndustria;
            if (!prev.direccion_recoleccion_pais && codPais && canFill("direccion_recoleccion_pais")) patch.direccion_recoleccion_pais = codPais;
            if (!prev.direccion_recoleccion_ciudad && codCiudad && canFill("direccion_recoleccion_ciudad")) patch.direccion_recoleccion_ciudad = codCiudad;
            if (!prev.direccion_recoleccion_depto && codDepto && canFill("direccion_recoleccion_depto")) patch.direccion_recoleccion_depto = codDepto;
            if (!prev.direccion_recoleccion_muni && codMuni && canFill("direccion_recoleccion_muni")) patch.direccion_recoleccion_muni = codMuni;
            // Cada subcampo del contacto se rellena de forma independiente (no todo
            // detrás de la guarda de `entidadcontacto_id`): ese id casi nunca entra en
            // `_modificados` (el cliente no cambia de contacto, solo edita p.ej. sus
            // tipos), así que agrupar todo bajo `canFill("entidadcontacto_id")` pisaba
            // campos ya guardados (p.ej. `_contacto_tipo_list`) con el default del
            // contacto maestro en cada mount/refetch.
            if (!prev.entidadcontacto_id && contact && canFill("entidadcontacto_id")) {
                patch.entidadcontacto_id = String(contact.entidadcontacto_id);
            }
            if (!prev.entidad_contacto_nombre && contact?.entidadcontacto_nombre && canFill("entidad_contacto_nombre")) {
                patch.entidad_contacto_nombre = contact.entidadcontacto_nombre;
            }
            if (!prev.entidad_contacto_email && contact?.entidadcontacto_email && canFill("entidad_contacto_email")) {
                patch.entidad_contacto_email = contact.entidadcontacto_email;
            }
            if (!prev.entidad_contacto_telefono && contact?.entidadcontacto_telefono && canFill("entidad_contacto_telefono")) {
                patch.entidad_contacto_telefono = contact.entidadcontacto_telefono;
            }
            if ((!prev._contacto_tipo_list || prev._contacto_tipo_list.length === 0) && contact && canFill("_contacto_tipo_list")) {
                patch._contacto_tipo_list = extractContactoTipoList(contact);
            }
            if (!prev.direccion_recoleccion && addr?.entidaddireccion_direccion && canFill("direccion_recoleccion")) {
                patch.direccion_recoleccion = addr.entidaddireccion_direccion;
            }
            if (!prev.entidad_nit && nit && canFill("entidad_nit")) patch.entidad_nit = nit;
            if (Object.keys(patch).length === 0) return prev;
            baselineRef.current = { ...baselineRef.current, ...patch };
            return { ...prev, ...patch };
        });
    }, [values.entidad_id, findEntidadById, explicitlyModifiedKeys, resolvedDataSig, isSaving]);

    const lastContactSepSig = useRef(null);
    useEffect(() => {
        if (apiMode !== "private" || !values.entidad_id || !contactosSeparados.length) return;
        const sig = String(values.entidad_id);
        if (lastContactSepSig.current === sig) return;
        lastContactSepSig.current = sig;

        // Si ya hay un entidadcontacto_id guardado (p.ej. heredado de la coordinación),
        // usamos ese contacto exacto en vez de descartar el match — de lo contrario
        // el id queda seteado pero nombre/email/teléfono nunca se rellenan.
        const savedId = values.entidadcontacto_id ? String(values.entidadcontacto_id) : "";
        let contact = savedId
            ? contactosSeparados.find((c) => String(c.entidadcontacto_id) === savedId)
            : null;

        if (!contact && !savedId) {
            const nombreRef = (values.entidad_contacto_nombre || "").toLowerCase().trim();
            const emailRef = (values.entidad_contacto_email || "").toLowerCase().trim();
            if (nombreRef || emailRef) {
                contact = contactosSeparados.find((c) => {
                    const cn = (c.entidadcontacto_nombre || "").toLowerCase().trim();
                    const ce = (c.entidadcontacto_email || "").toLowerCase().trim();
                    return (nombreRef && cn === nombreRef) || (emailRef && ce === emailRef);
                });
            }
        }

        if (!contact) contact = contactosSeparados[0];
        if (!contact) return;

        setValues((prev) => {
            const patch = { entidadcontacto_id: String(contact.entidadcontacto_id) };
            if (!explicitlyModifiedKeys.has("entidad_contacto_nombre")) {
                patch.entidad_contacto_nombre = contact.entidadcontacto_nombre || prev.entidad_contacto_nombre;
            }
            if (!explicitlyModifiedKeys.has("entidad_contacto_email")) {
                patch.entidad_contacto_email = contact.entidadcontacto_email || prev.entidad_contacto_email;
            }
            if (!explicitlyModifiedKeys.has("entidad_contacto_telefono")) {
                patch.entidad_contacto_telefono = contact.entidadcontacto_telefono || prev.entidad_contacto_telefono;
            }
            if (!explicitlyModifiedKeys.has("_contacto_tipo_list")) {
                patch._contacto_tipo_list = extractContactoTipoList(contact);
            }
            baselineRef.current = { ...baselineRef.current, ...patch };
            return { ...prev, ...patch };
        });
    }, [apiMode, values.entidad_id, values.entidadcontacto_id, values.entidad_contacto_nombre, values.entidad_contacto_email, contactosSeparados, explicitlyModifiedKeys]);

    const lastDireccionSepSig = useRef(null);
    useEffect(() => {
        if (apiMode !== "private" || !values.entidad_id || !direccionesSeparadas.length) return;
        const sig = String(values.entidad_id);
        if (lastDireccionSepSig.current === sig) return;
        lastDireccionSepSig.current = sig;
        if (values.direccion_recoleccion) return;

        const direccion = direccionesSeparadas.find((d) => Number(d.cod_tipo) === 145) || direccionesSeparadas[0];
        if (!direccion) return;

        setValues((prev) => {
            if (prev.direccion_recoleccion) return prev;
            const patch = { direccion_recoleccion: direccion.direccion || "" };
            if (!prev.direccion_recoleccion_pais && direccion.cod_pais) patch.direccion_recoleccion_pais = String(direccion.cod_pais);
            if (!prev.direccion_recoleccion_depto && direccion.cod_depto) patch.direccion_recoleccion_depto = String(direccion.cod_depto);
            if (!prev.direccion_recoleccion_muni && direccion.cod_muni) patch.direccion_recoleccion_muni = String(direccion.cod_muni);
            baselineRef.current = { ...baselineRef.current, ...patch };
            return { ...prev, ...patch };
        });
    }, [apiMode, values.entidad_id, values.direccion_recoleccion, direccionesSeparadas]);

    const lastIdentSepSig = useRef(null);
    useEffect(() => {
        if (apiMode !== "private" || !values.entidad_id || !identificacionesSeparadas.length) return;
        const sig = String(values.entidad_id);
        if (lastIdentSepSig.current === sig) return;
        lastIdentSepSig.current = sig;
        if (values.entidad_nit) return;

        const nitRecord = identificacionesSeparadas.find(
            (i) => String(i.nom_identificacion || "").toLowerCase() === "nit",
        );
        if (!nitRecord?.entidadidentificacion_numero) return;

        setValues((prev) => {
            if (prev.entidad_nit) return prev;
            const patch = { entidad_nit: nitRecord.entidadidentificacion_numero };
            baselineRef.current = { ...baselineRef.current, ...patch };
            return { ...prev, ...patch };
        });
    }, [apiMode, values.entidad_id, values.entidad_nit, identificacionesSeparadas]);

    const handleEntidadCreada = useCallback((optionEntidad) => {
        // Entidad temporal sin entidad_id (público y privado): sus datos base
        // viajan en los propios campos del formulario (entidad_pais/ciudad/
        // industria) para que se detecten como modificados y se guarden en la
        // carta. El backend la crea al procesar actualizar-json-link (público)
        // o useCommitPendingChanges la crea/relaciona con el cliente al
        // confirmar "Crear Coordinación" (privado/CTS) — ver createEntidadConSubrecords.
        setValues((prev) => ({
            ...prev,
            entidad_id: "",
            entidad_nombre: optionEntidad.entidad_nombre || "",
            entidad_pais: optionEntidad.cod_pais != null ? String(optionEntidad.cod_pais) : "",
            direccion_recoleccion_ciudad: optionEntidad.cod_ciudad != null ? String(optionEntidad.cod_ciudad) : "",
            entidad_industria: optionEntidad.cod_industria != null ? String(optionEntidad.cod_industria) : "",
            // Entidad nueva: no tiene contactos guardados, así que el
            // contacto también arranca en modo "nuevo" (campos libres).
            entidadcontacto_id: "",
            entidad_contacto_nombre: "",
            entidad_contacto_email: "",
            entidad_contacto_telefono: "",
            _contacto_tipo_list: [],
        }));
        setOpenCrearEntidad(false);
        setModoNuevaEntidad(true);
        setModoNuevoContacto(true);
    }, []);

    const handleDireccionCreada = useCallback((nuevaDireccion) => {
        if (nuevaDireccion) {
            setValues((prev) => ({ ...prev, direccion_recoleccion: nuevaDireccion }));
        }
        setOpenCrearDireccion(false);
    }, []);

    const handleIdentCreada = useCallback((identData) => {
        if (identData?.valor) {
            setValues((prev) => ({ ...prev, entidad_nit: identData.valor }));
        }
        setOpenCrearIdent(false);
    }, []);

    const entityOptions = useMemo(() => {
        const opciones = entidades
            .filter((ent) => ent.entidad_id && resolveEntidadNombre(ent))
            .map((ent) => ({ value: ent.entidad_id, label: resolveEntidadNombre(ent) }));

        // Garantizar que el id seleccionado (de resolvedData o de lista-coordinacion
        // vía selectedEntidadId) siempre tenga una opción visible en el dropdown,
        // aunque su tipo_relacion / entidad_clasificacion no matchee los aliases.
        // En modo "nueva entidad" NO se inyecta nada: el selector debe quedar
        // vacío (sin ninguna opción marcada), aunque `selectedEntidadId` siga
        // apuntando a la entidad que estaba elegida antes de crear la nueva.
        const idsParaInyectar = modoNuevaEntidad
            ? []
            : [values.entidad_id, selectedEntidadId].filter(
                (id) => id !== undefined && id !== null && id !== "",
            );
        for (const id of idsParaInyectar) {
            if (opciones.some((opt) => String(opt.value) === String(id))) continue;
            const ent = findEntidadById(id);
            const nombre = resolveEntidadNombre(ent);
            if (nombre) {
                opciones.unshift({ value: ent.entidad_id, label: nombre });
            }
        }

        return opciones;
    }, [entidades, values.entidad_id, selectedEntidadId, findEntidadById, modoNuevaEntidad]);

    // Cuando el cliente no tiene ninguna entidad relacionada (shipper o
    // consignatario) que ofrecer en el selector, no tiene sentido mostrar un
    // dropdown vacío: se fuerza el modo "nueva entidad" (y por lo tanto
    // "nuevo contacto") para que el cliente capture los datos directo.
    const sinEntidadesDisponibles = !entidadesRelLoading && entityOptions.length === 0;
    const forzarNuevaEntidad = modoNuevaEntidad || sinEntidadesDisponibles;

    const contactoOptions = useMemo(() => {
        const entidadActual = findEntidadById(values.entidad_id);
        let contacts = entidadActual?.data_contactos || [];
        // private mode: useFetchEntidadContacto returns complete data; data_contactos
        // from the related-entities endpoint may have empty name/email/phone fields.
        if (apiMode === "private" && contactosSeparados.length > 0) {
            contacts = contactosSeparados;
        } else if (contacts.length === 0 && contactosSeparados.length > 0) {
            contacts = contactosSeparados;
        }
        if (contacts.length > 0) {
            return contacts.map((c) => ({
                value: String(c.entidadcontacto_id),
                label: `Nombre: ${c.entidadcontacto_nombre || "-"}  |  Email: ${c.entidadcontacto_email || "-"}  |  Teléfono: ${c.entidadcontacto_telefono || "-"}`,
                nombre: c.entidadcontacto_nombre,
                email: c.entidadcontacto_email,
                telefono: c.entidadcontacto_telefono,
            }));
        }
        if (!values.entidadcontacto_id) return [];
        return [{
            value: String(values.entidadcontacto_id),
            label: `Nombre: ${values.entidad_contacto_nombre || "-"}  |  Email: ${values.entidad_contacto_email || "-"}  |  Teléfono: ${values.entidad_contacto_telefono || "-"}`,
            nombre: values.entidad_contacto_nombre,
            email: values.entidad_contacto_email,
            telefono: values.entidad_contacto_telefono,
        }];
    }, [findEntidadById, values.entidad_id, values.entidadcontacto_id, values.entidad_contacto_nombre, values.entidad_contacto_email, values.entidad_contacto_telefono, contactosSeparados]);

    // Igual que con la entidad: si la entidad elegida no tiene ningún contacto
    // que ofrecer, no tiene sentido mostrar un selector vacío — se fuerza el
    // modo "nuevo contacto" para que el cliente capture uno directo.
    const sinContactosDisponibles = Boolean(values.entidad_id) && contactoOptions.length === 0;
    const forzarNuevoContacto = modoNuevoContacto || forzarNuevaEntidad || sinContactosDisponibles;

    const codPaisInfo = values.entidad_pais;
    const { data: ciudadesData = [] } = apiMode === "private"
        ? useFetchCiudades({ cod_pais: codPaisInfo })
        : useFetchCiudadesPublico(codPaisInfo);
    const ciudadOptions = useMemo(
        () => ciudadesData.map((c) => ({ value: c.cod_ciudad, label: c.nombre_ciudad })),
        [ciudadesData],
    );

    const codPaisDir = values.direccion_recoleccion_pais;
    const { data: departamentosData = [] } = apiMode === "private"
        ? useFetchDepartamentos({ cod_pais: codPaisDir }, { enabled: Boolean(codPaisDir) })
        : useFetchDepartamentosPublico(codPaisDir);
    const departamentoOptions = useMemo(
        () => departamentosData.map((d) => ({ value: d.cod_depto, label: d.nombre_depto })),
        [departamentosData],
    );

    const codDepto = values.direccion_recoleccion_depto;
    const { data: municipiosData = [] } = apiMode === "private"
        ? useFetchMunicipios({ cod_depto: codDepto }, { enabled: Boolean(codDepto) })
        : useFetchMunicipiosPublico(codDepto);
    const municipioOptions = useMemo(
        () => municipiosData.map((m) => ({ value: m.cod_muni, label: m.nombre_muni })),
        [municipiosData],
    );

    // El maestro (dirección guardada en BD) puede pertenecer a un país/departamento
    // distinto al que el cliente tiene seleccionado ahora mismo (p.ej. cambió de
    // Guatemala a Luxemburgo). `departamentoOptions`/`municipioOptions` de arriba
    // están filtrados por la selección ACTUAL, así que no sirven para resolver el
    // label del valor "antes" del panel de comparación — se necesita un catálogo
    // adicional, scopeado al país/departamento del maestro.
    const rawEntidadActual = useMemo(() => findEntidadById(values.entidad_id), [findEntidadById, values.entidad_id]);

    // Fuentes "separadas" (privado): más confiables que los sub-arreglos del
    // snapshot de recuperar-datos-entidad-relacionada (pueden venir vacíos/
    // desactualizados — ver comentario en contactoOptions más abajo).
    const masterContactoSeparado = useMemo(() => {
        if (apiMode !== "private" || contactosSeparados.length === 0) return null;
        return contactosSeparados.find((c) => String(c.entidadcontacto_id) === String(values.entidadcontacto_id)) || contactosSeparados[0];
    }, [apiMode, contactosSeparados, values.entidadcontacto_id]);

    const masterDireccionSeparada = useMemo(() => {
        if (apiMode !== "private" || direccionesSeparadas.length === 0) return null;
        return direccionesSeparadas.find((d) => Number(d.cod_tipo) === 145) || direccionesSeparadas[0];
    }, [apiMode, direccionesSeparadas]);

    const masterNitSeparado = useMemo(() => {
        if (apiMode !== "private" || identificacionesSeparadas.length === 0) return null;
        const found = identificacionesSeparadas.find((i) => String(i.nom_identificacion || "").toLowerCase() === "nit");
        return found ? (found.entidadidentificacion_numero ?? "") : "";
    }, [apiMode, identificacionesSeparadas]);

    const masterAddrFromRaw = useMemo(
        () => (rawEntidadActual?.data_direcciones || []).find((d) => Number(d.cod_tipo) === 145) || null,
        [rawEntidadActual],
    );
    const masterAddr = masterDireccionSeparada || masterAddrFromRaw;
    const masterCodPais = masterAddr?.cod_pais ?? "";
    const masterCodDepto = masterAddr?.cod_depto ?? "";

    const { data: masterDepartamentosData = [] } = apiMode === "private"
        ? useFetchDepartamentos({ cod_pais: masterCodPais }, { enabled: Boolean(masterCodPais) && masterCodPais !== codPaisDir })
        : useFetchDepartamentosPublico(masterCodPais !== codPaisDir ? masterCodPais : undefined);
    const masterDepartamentoOptions = useMemo(
        () => masterDepartamentosData.map((d) => ({ value: d.cod_depto, label: d.nombre_depto })),
        [masterDepartamentosData],
    );

    const { data: masterMunicipiosData = [] } = apiMode === "private"
        ? useFetchMunicipios({ cod_depto: masterCodDepto }, { enabled: Boolean(masterCodDepto) && masterCodDepto !== codDepto })
        : useFetchMunicipiosPublico(masterCodDepto !== codDepto ? masterCodDepto : undefined);
    const masterMunicipioOptions = useMemo(
        () => masterMunicipiosData.map((m) => ({ value: m.cod_muni, label: m.nombre_muni })),
        [masterMunicipiosData],
    );

    // Tercer catálogo scopeado al entidad_pais (clasificación de la entidad).
    // Cuando el cliente cambió el departamento de la dirección al país de la
    // entidad, codPaisDir (dirección actual) puede no coincidir con ese país,
    // dejando el código del cliente sin resolver. Fetchar los dptos del país de
    // la entidad garantiza resolución en ese caso habitual.
    const codPaisEntidad = values.entidad_pais;
    const { data: entidadPaisDepartamentosData = [] } = apiMode === "private"
        ? useFetchDepartamentos(
            { cod_pais: codPaisEntidad },
            { enabled: Boolean(codPaisEntidad) && codPaisEntidad !== codPaisDir && codPaisEntidad !== masterCodPais },
        )
        : useFetchDepartamentosPublico(
            codPaisEntidad !== codPaisDir && codPaisEntidad !== masterCodPais ? codPaisEntidad : undefined,
        );
    const entidadPaisDepartamentoOptions = useMemo(
        () => entidadPaisDepartamentosData.map((d) => ({ value: d.cod_depto, label: d.nombre_depto })),
        [entidadPaisDepartamentosData],
    );

    // Catálogos combinados (selección actual + maestro + entidad_pais) para
    // resolver labels en el panel "Cambios del cliente", donde antes/después
    // pueden pertenecer a países/departamentos distintos.
    const departamentoOptionsParaComparar = useMemo(
        () => [...departamentoOptions, ...masterDepartamentoOptions, ...entidadPaisDepartamentoOptions],
        [departamentoOptions, masterDepartamentoOptions, entidadPaisDepartamentoOptions],
    );
    const municipioOptionsParaComparar = useMemo(
        () => [...municipioOptions, ...masterMunicipioOptions],
        [municipioOptions, masterMunicipioOptions],
    );

    // Resolver nombre → código para departamento / municipio. País ya se
    // resuelve en `resolvedData`; depto y muni no, así que cuando el valor
    // inicial llega como nombre (no aparece en las opciones del select) lo
    // buscamos por label y reescribimos con el código correspondiente para
    // que el select muestre la selección guardada.
    useEffect(() => {
        const deptoActual = values.direccion_recoleccion_depto;
        if (deptoActual && departamentoOptions.length) {
            const esCodigo = departamentoOptions.some(
                (d) => String(d.value) === String(deptoActual),
            );
            if (!esCodigo) {
                const match = departamentoOptions.find(
                    (d) => d.label?.toLowerCase() === String(deptoActual).toLowerCase(),
                );
                if (match) {
                    setValues((prev) => ({
                        ...prev,
                        direccion_recoleccion_depto: String(match.value),
                    }));
                }
            }
        }
    }, [departamentoOptions, values.direccion_recoleccion_depto]);

    useEffect(() => {
        const muniActual = values.direccion_recoleccion_muni;
        if (muniActual && municipioOptions.length) {
            const esCodigo = municipioOptions.some(
                (m) => String(m.value) === String(muniActual),
            );
            if (!esCodigo) {
                const match = municipioOptions.find(
                    (m) => m.label?.toLowerCase() === String(muniActual).toLowerCase(),
                );
                if (match) {
                    setValues((prev) => ({
                        ...prev,
                        direccion_recoleccion_muni: String(match.value),
                    }));
                }
            }
        }
    }, [municipioOptions, values.direccion_recoleccion_muni]);

    const { data: industriasData = [] } = apiMode === "private"
        ? useFetchIndustrias()
        : useFetchIndustriasPublico();
    const industriaOptions = useMemo(
        () => industriasData.map((i) => ({ value: i.cod_industria, label: i.nom_industria_es })),
        [industriasData],
    );

    const { data: tiposContactoRaw = [] } = apiMode === "private"
        ? useFetchTipos({ tipo_tabla: "ENTIDAD_CONTACTOS" })
        : useFetchTiposPublico("ENTIDAD_CONTACTOS");
    const tiposContactoOptions = useMemo(
        () => tiposContactoRaw.map((t) => ({ value: t.cod_tipo ?? t.codTipo, label: t.nom_tipo ?? t.nomTipo })),
        [tiposContactoRaw],
    );

    // Panel "Cambios del cliente": compara el maestro (BD, recuperar-datos-entidad-
    // relacionada) contra lo que el cliente envió en la carta (`data._modificados`).
    const separatedMaster = useMemo(
        () => ({ contacto: masterContactoSeparado, direccion: masterDireccionSeparada, nit: masterNitSeparado }),
        [masterContactoSeparado, masterDireccionSeparada, masterNitSeparado],
    );

    const cambiosClienteRows = useMemo(
        () => buildCambiosClienteRows({
            modificados: data?._modificados,
            rawEntidad: rawEntidadActual,
            values,
            sectionInfo: config.sectionLabel || config.title || "Información",
            catalogs: {
                paises: paisOptions,
                ciudades: ciudadOptions,
                departamentos: departamentoOptionsParaComparar,
                municipios: municipioOptionsParaComparar,
                industrias: industriaOptions,
                tiposContacto: tiposContactoOptions,
            },
            separated: separatedMaster,
        }),
        [data, rawEntidadActual, values, config.sectionLabel, config.title, paisOptions, ciudadOptions, departamentoOptionsParaComparar, municipioOptionsParaComparar, industriaOptions, tiposContactoOptions, separatedMaster],
    );

    const nuevoEntityAction = useMemo(() => ({
        visible: config.hideNuevoEntidad ? modoNuevaEntidad : true,
        enabled: true,
        nombre: modoNuevaEntidad ? "Cancelar" : "Nuevo",
        icono: modoNuevaEntidad ? "c-cerrar" : "c-suma",
        onClick: () => {
            if (modoNuevaEntidad) {
                setModoNuevaEntidad(false);
                setModoNuevoContacto(false);
                setValues((prev) => ({
                    ...prev,
                    entidad_id: "",
                    entidad_nombre: "",
                    entidad_pais: "",
                    entidad_industria: "",
                    direccion_recoleccion: "",
                    direccion_recoleccion_pais: "",
                    direccion_recoleccion_ciudad: "",
                    direccion_recoleccion_depto: "",
                    direccion_recoleccion_muni: "",
                    entidadcontacto_id: "",
                    entidad_contacto_nombre: "",
                    entidad_contacto_email: "",
                    entidad_contacto_telefono: "",
                    _contacto_tipo_list: [],
                    entidad_nit: "",
                }));
                return;
            }
            // Al iniciar "Nuevo" limpiar de inmediato TODOS los campos heredados de
            // la entidad que estuviera elegida (no solo entidad_id/contacto): si
            // dejamos país/ciudad/industria/dirección/país-depto-muni/NIT con el
            // valor de la entidad anterior, esos campos quedan también en
            // `baselineRef.current` (los fijó el auto-relleno al seleccionarla) —
            // si el cliente no llega a cambiarlos (p.ej. la entidad nueva resulta
            // tener el mismo país), `getModifiedFields` no detecta ninguna
            // diferencia y esos valores nunca entran en `_modificados`, así que se
            // pierden al guardar aunque se vean rellenos en pantalla. Limpiar y
            // resetear la línea base junto con `values` obliga a que cualquier
            // dato de la entidad nueva se capture como modificado de verdad.
            const camposLimpios = {
                entidad_id: "",
                entidad_nombre: "",
                entidad_pais: "",
                entidad_industria: "",
                direccion_recoleccion: "",
                direccion_recoleccion_pais: "",
                direccion_recoleccion_ciudad: "",
                direccion_recoleccion_depto: "",
                direccion_recoleccion_muni: "",
                entidadcontacto_id: "",
                entidad_contacto_nombre: "",
                entidad_contacto_email: "",
                entidad_contacto_telefono: "",
                _contacto_tipo_list: [],
                entidad_nit: "",
            };
            baselineRef.current = { ...baselineRef.current, ...camposLimpios };
            setValues((prev) => ({ ...prev, ...camposLimpios }));
            setOpenCrearEntidad(true);
        },
    }), [modoNuevaEntidad, config.hideNuevoEntidad]);

    // Si la entidad (Shipper/Consignatario) es nueva, todavía no tiene contactos
    // guardados: el contacto debe quedar forzado en modo "nuevo" y no se puede
    // cancelar de vuelta al selector (no habría nada que seleccionar).
    const nuevoContactoAction = useMemo(() => ({
        visible: true,
        enabled: !forzarNuevaEntidad,
        nombre: forzarNuevoContacto ? "Cancelar" : "Nuevo",
        icono: forzarNuevoContacto ? "c-cerrar" : "c-suma",
        onClick: () => {
            if (forzarNuevaEntidad) return;
            setModoNuevoContacto((prev) => !prev);
            setValues((prev) => ({
                ...prev,
                entidadcontacto_id: "",
                entidad_contacto_nombre: "",
                entidad_contacto_email: "",
                entidad_contacto_telefono: "",
                _contacto_tipo_list: [],
            }));
        },
    }), [forzarNuevoContacto, forzarNuevaEntidad]);

    const nuevoIdentAction = useMemo(() => ({
        visible: true, enabled: true, nombre: "Nuevo", icono: "c-suma",
        onClick: () => setOpenCrearIdent(true),
    }), []);

    const fieldConfig = useMemo(() => ({
        ...FORM_CONFIG,
        title: config.title,
        sectionLabel: config.sectionLabel,
        hideIdentificacion: config.hideIdentificacion,
        hiddenFields: config.hiddenFields,
    }), [config.title, config.sectionLabel, config.hideIdentificacion, config.hiddenFields]);

    // Los campos de país/ciudad/industria (Información), país/departamento/municipio
    // (Dirección) y tipo(s) de contacto normalmente vienen ocultos: se autocompletan
    // desde el maestro de la entidad seleccionada y no aportan nada si ya hay una
    // entidad elegida. Pero al crear una entidad NUEVA no existe ese maestro, así
    // que sin esos campos el cliente no tiene forma de capturarlos — se muestran
    // solo mientras `forzarNuevaEntidad` esté activo.
    const effectiveHiddenFields = useMemo(() => {
        if (!forzarNuevaEntidad || !config.hiddenFields?.size) return config.hiddenFields;
        const visibleEnNueva = new Set([
            "entidad_pais",
            "direccion_recoleccion_ciudad",
            "entidad_industria",
            "direccion_recoleccion_pais",
            "direccion_recoleccion_depto",
            "direccion_recoleccion_muni",
            "_contacto_tipo_list",
        ]);
        const next = new Set(config.hiddenFields);
        visibleEnNueva.forEach((key) => next.delete(key));
        return next;
    }, [config.hiddenFields, forzarNuevaEntidad]);

    const formFields = useMemo(() => {
        const raw = buildEntidadPublicFields({
            config: fieldConfig,
            entityOptions,
            paisOptions,
            ciudadOptions,
            departamentoOptions,
            municipioOptions,
            industriaOptions,
            contactoOptions,
            tiposContactoOptions,
            nuevoEntityAction,
            nuevoContactoAction,
            nuevoIdentAction,
            disableEntitySelector: disableEntitySelector || sinEntidadesDisponibles,
            modoNuevoContacto: forzarNuevoContacto,
            modoNuevaEntidad: forzarNuevaEntidad,
            selectedEntidadId: values.entidad_id,
            selectedContactoId: values.entidadcontacto_id,
            hiddenFields: effectiveHiddenFields,
        });
        const withRequired = raw.map((f) => ({ ...f, required: REQUIRED_FIELDS.has(f.key) || f.required }));
        if (!readOnly) return withRequired;
        return withRequired
            .filter((f) => f.type !== "button")
            .map((f) => ({ ...f, readOnly: true }));
    }, [fieldConfig, entityOptions, paisOptions, ciudadOptions, departamentoOptions, municipioOptions, industriaOptions, contactoOptions, tiposContactoOptions, nuevoEntityAction, nuevoContactoAction, nuevoIdentAction, disableEntitySelector, sinEntidadesDisponibles, forzarNuevoContacto, forzarNuevaEntidad, values.entidad_id, values.entidadcontacto_id, effectiveHiddenFields, readOnly]);

    const handleFieldChange = useCallback((key, value) => {
        if (key === FORM_CONFIG.entityField) {
            const ent = findEntidadById(value);
            const contact = ent?.data_contactos?.[0] || null;
            const addr = (ent?.data_direcciones || []).find((d) => Number(d.cod_tipo) === 145) || null;
            const nit = (ent?.data_identificaciones || []).find(
                (i) => String(i.nom_identificacion || "").toLowerCase() === "nit",
            )?.entidadidentificacio_numero || "";
            const codPais = ent?.cod_pais == null ? "" : String(ent.cod_pais);
            const codCiudad = ent?.cod_ciudad == null ? "" : String(ent.cod_ciudad);
            const codIndustria = ent?.cod_industria == null ? "" : String(ent.cod_industria);
            const codDepto = addr?.cod_depto == null ? "" : String(addr.cod_depto);
            const codMuni = addr?.cod_muni == null ? "" : String(addr.cod_muni);
            const satellitePatch = {
                entidad_nombre: resolveEntidadNombre(ent),
                entidad_pais: codPais,
                entidad_industria: codIndustria,
                direccion_recoleccion_pais: codPais,
                direccion_recoleccion_ciudad: codCiudad,
                direccion_recoleccion_depto: codDepto,
                direccion_recoleccion_muni: codMuni,
                entidadcontacto_id: contact ? String(contact.entidadcontacto_id) : "",
                entidad_contacto_nombre: contact?.entidadcontacto_nombre || "",
                entidad_contacto_email: contact?.entidadcontacto_email || "",
                entidad_contacto_telefono: contact?.entidadcontacto_telefono || "",
                _contacto_tipo_list: extractContactoTipoList(contact),
                direccion_recoleccion: addr?.entidaddireccion_direccion || "",
                entidad_nit: nit,
            };
            // Estos campos son los defaults del maestro de la entidad recién
            // seleccionada, no ediciones manuales: no deben contar como "modificados".
            baselineRef.current = { ...baselineRef.current, ...satellitePatch };
            return satellitePatch;
        }
        if (key === FORM_CONFIG.contactIdField) {
            const entidadActual = findEntidadById(values.entidad_id);
            const allContacts = entidadActual?.data_contactos?.length
                ? entidadActual.data_contactos
                : contactosSeparados;
            const fullContact = allContacts.find(
                (c) => String(c.entidadcontacto_id) === String(value),
            ) || null;
            const contact = contactoOptions.find((c) => String(c.value) === String(value));
            if (contact) {
                return {
                    [FORM_CONFIG.contactField]: contact.nombre,
                    [FORM_CONFIG.phoneField]: contact.telefono,
                    [FORM_CONFIG.emailField]: contact.email,
                    _contacto_tipo_list: extractContactoTipoList(fullContact),
                };
            }
        }
        if (key === FORM_CONFIG.paisField) {
            return {
                [FORM_CONFIG.ciudadField]: "",
                [FORM_CONFIG.addressCountryField]: value,
                [FORM_CONFIG.addressDeptoField]: "",
                [FORM_CONFIG.addressMuniField]: "",
            };
        }
        if (key === FORM_CONFIG.addressCountryField) {
            return {
                [FORM_CONFIG.addressDeptoField]: "",
                [FORM_CONFIG.addressMuniField]: "",
            };
        }
        if (key === FORM_CONFIG.addressDeptoField) {
            return { [FORM_CONFIG.addressMuniField]: "" };
        }
        return {};
    }, [findEntidadById, contactoOptions, contactosSeparados, values.entidad_id]);

    const handleValuesChange = useCallback((nextValues) => {
        setValues((prev) => ({ ...prev, ...nextValues }));
    }, []);

    const initValues = useMemo(
        () => buildInitialValues(
            { ...(resolvedData || {}), entidad_id: pickEntidadIdFromData(resolvedData, selectedEntidadId) },
            config,
        ),
        [resolvedData, config, selectedEntidadId],
    );

    // Comparar contra `baselineRef` (initValues + auto-rellenos del maestro aplicados
    // hasta ahora), no contra `initValues` a secas: nombre/país/industria/contacto/NIT
    // casi siempre llegan a `data` vacíos (solo se persiste lo que el cliente modificó
    // explícitamente) y se completan vía auto-relleno. Comparar contra `initValues`
    // los marca como "cambio pendiente" para siempre, dejando el indicador de guardado
    // en "Sin guardar" aunque ya no haya nada que guardar.
    const hasChanges = useMemo(
        () => Object.keys(initValues).some((k) => String(values[k] ?? "") !== String(baselineRef.current[k] ?? "")),
        [values, initValues],
    );

    const isValid = useMemo(() => areRequiredFieldsFilled(formFields, values), [formFields, values]);

    const onValidityChangeRef = useRef(onValidityChange);
    onValidityChangeRef.current = onValidityChange;
    const lastValiditySig = useRef(null);
    useEffect(() => {
        if (typeof onValidityChangeRef.current !== "function") return;
        let next;
        if (isValid && !hasChanges) {
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
    }, [isValid, hasChanges]);

    const lastReportedSig = useRef(null);
    useEffect(() => {
        if (typeof onValuesChange !== "function") return;
        // Se compara contra baselineRef (initValues + auto-rellenos del maestro), no
        // contra initValues a secas, para no marcar como "modificado por el cliente"
        // un campo que simplemente heredó el valor del maestro al seleccionar la entidad.
        const modificados = unionModificados(data?._modificados, getModifiedFields(baselineRef.current, values));
        const sig = JSON.stringify({ v: values, m: modificados });
        if (lastReportedSig.current === sig) return;
        lastReportedSig.current = sig;
        // _tipoEntidad viaja junto a los valores para que buildEntidadRelacionada
        // (public/page.jsx) sepa el rol (shipper/consignatario) al construir el
        // registro de una entidad nueva sin entidad_id.
        onValuesChange({ ...values, _modificados: modificados, _tipoEntidad: config.tipo });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values, data, onValuesChange]);

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (readOnly) {
        return (
            <Box sx={{ display: "flex", gap: 3, alignItems: { xs: "stretch", md: "flex-start" }, flexDirection: { xs: "column", md: "row" }, flexWrap: "wrap" }}>
                <Box sx={{ flex: "1 1 560px", minWidth: 0 }}>
                    <EntidadFormHeader title={config.title} />
                    <FormularioAlternativo
                        title={config.title}
                        fields={formFields}
                        initialValues={values}
                        showSubmitButton={false}
                        hideHeader
                        variant="modern"
                    />
                </Box>

                {cambiosClienteRows.length > 0 && (
                    <Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
                        <EntidadComparePanel
                            titulo={config.title}
                            showEntity={false}
                            readOnly
                            rows={cambiosClienteRows}
                        />
                    </Box>
                )}
            </Box>
        );
    }

    return (
        <>
            <BannerInformativo
                titulo="Aún no se ha guardado"
                mensaje="Complete los datos obligatorios para guardar."
                severidad="info"
                ocultar={isValid && !hasChanges}
            />
            <Box sx={{ display: "flex", gap: 3, alignItems: { xs: "stretch", md: "flex-start" }, flexDirection: { xs: "column", md: "row" }, flexWrap: "wrap" }}>
                <Box sx={{ flex: "1 1 560px", minWidth: 0 }}>
                    <EntidadPublicForm
                        title={config.title}
                        fields={formFields}
                        initialValues={values}
                        onValuesChange={handleValuesChange}
                        onFieldChange={handleFieldChange}
                        onSave={onSave}
                        isSaving={isSaving}
                        disabled={!isValid}
                        hideHeader
                    />
                </Box>

                {apiMode !== "public" && cambiosClienteRows.length > 0 && (
                    <Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
                        <EntidadComparePanel
                            titulo={config.title}
                            showEntity={false}
                            readOnly
                            rows={cambiosClienteRows}
                        />
                    </Box>
                )}
            </Box>

            <DialogComponent
                titulo={config.dialogs.entidad}
                openDialog={openCrearEntidad}
                handleClose={() => setOpenCrearEntidad(false)}
                width="fit-content"
                height="fit-content"
            >
                <NuevaEntidad
                    id="new"
                    tipo={config.tipo}
                    cliente={{ nombre: "" }}
                    catalogos={{}}
                    mode="create"
                    initialData={null}
                    hidePaisesAsociados
                    apiMode={apiMode}
                    onCreate={handleEntidadCreada}
                />
            </DialogComponent>

            <DialogComponent
                titulo={config.dialogs.direccion}
                openDialog={openCrearDireccion}
                handleClose={() => setOpenCrearDireccion(false)}
                width="50vw"
                height="auto"
            >
                <NuevaDireccionEntidad
                    entidad_id={values.entidad_id || null}
                    tipo={config.tipo}
                    reConsultar={handleDireccionCreada}
                />
            </DialogComponent>

            <DialogComponent
                titulo={config.dialogs.ident}
                openDialog={openCrearIdent}
                handleClose={() => setOpenCrearIdent(false)}
                width="50vw"
                height="auto"
            >
                <NuevaIdentificacionEntidad
                    identificacion="NIT"
                    entidadId={values.entidad_id || null}
                    codIdentificacion={config.nitCodIdentificacion}
                    readOnly
                    onSubmit={handleIdentCreada}
                />
            </DialogComponent>
        </>
    );
};

EntidadPublicFormSection.propTypes = {
    config: PropTypes.shape({
        title: PropTypes.string.isRequired,
        sectionLabel: PropTypes.string,
        aliases: PropTypes.instanceOf(Set).isRequired,
        tipo: PropTypes.number.isRequired,
        nitCodIdentificacion: PropTypes.number.isRequired,
        addressDataKey: PropTypes.string.isRequired,
        phoneDataKey: PropTypes.string.isRequired,
        hiddenFields: PropTypes.instanceOf(Set),
        dialogs: PropTypes.shape({
            entidad: PropTypes.string.isRequired,
            direccion: PropTypes.string.isRequired,
            contacto: PropTypes.string.isRequired,
            ident: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
    data: PropTypes.object,
    isLoading: PropTypes.bool,
    onValidityChange: PropTypes.func,
    onValuesChange: PropTypes.func,
    onSave: PropTypes.func,
    isSaving: PropTypes.bool,
    cliInfo: PropTypes.object,
    selectedEntidadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    apiMode: PropTypes.oneOf(["public", "private"]),
    disableEntitySelector: PropTypes.bool,
};

export default EntidadPublicFormSection;
