import React from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import FormularioAlternativo, { ModernFormHeader } from "@/components/bpm/Formularios/FormularioAlternativo";
import FormularioConGuardar from "../secciones/formularioConGuardar";

// Icono + subtítulo de cabecera por rol — mismo lenguaje visual que StepperNav
// (icon chip + texto), solo para las dos entidades públicas (Shipper/Consignatario).
const ENTITY_HEADER_META = {
  Shipper: { icon: "c-camion", subtitle: "Datos de quien despacha y entrega la mercadería." },
  Consignatario: { icon: "c-entregar", subtitle: "Datos de quien recibe la mercadería en destino." },
};

const EntidadFormHeader = ({ title }) => {
  const meta = ENTITY_HEADER_META[title] || { icon: "c-usuario", subtitle: "Complete la información solicitada." };
  return <ModernFormHeader icon={meta.icon} title={title} subtitle={meta.subtitle} />;
};

EntidadFormHeader.propTypes = {
  title: PropTypes.string,
};

export { EntidadFormHeader };

export const renderContactoOption = (props, option) => {
    const { key, ...rest } = props;
    return (
        <Box component="li" key={key} {...rest} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start !important", py: 1, gap: 0.25 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Nombre: {option.nombre || "-"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Email: {option.email || "-"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Teléfono: {option.telefono || "-"}
            </Typography>
        </Box>
    );
};

export const buildEntidadFields = ({
    config,
    entityOptions,
    selectedEntityId,
    selectedContactId,
    nuevoEntityAction,
    nuevoContactoAction,
    contactoOptions,
    paisOptions = [],
    departamentoOptions = [],
    municipioOptions = [],
    ciudadOptions = [],
    industriaOptions = [],
    tiposContactoOptions = [],
    modoNuevo = false,
    hiddenFields = HIDDEN_FIELD_DEFAULTS,
}) => {
    const camposHabilitados = Boolean(selectedEntityId) || modoNuevo;
    const baseFields = [
        ...(config.topSpacer ? [{
            key: "__top_spacer__",
            type: "spacer",
            colSpan: "span 12",
            height: 52,
        }] : []),
        {
            key: config.entityField,
            label: `Seleccionar ${config.title}`,
            type: "select",
            required: true,
            colSpan: "span 10",
            options: entityOptions,
        },
        {
            key: "__btn_nueva_entidad__",
            type: "button",
            colSpan: "span 2",
            action: nuevoEntityAction,
        },
        {
            key: "__section_shipper__",
            type: "section",
            label: config.sectionLabel || config.title,
            icon: "c-empresa",
            colSpan: "span 12",
        },
        {
            key: config.nombreField || config.entityField,
            label: "Nombre",
            type: "text",
            required: true,
            colSpan: "span 12",
            readOnly: !camposHabilitados,
        },
        ...(config.paisField ? [{
            key: config.paisField,
            label: "País",
            type: "select",
            colSpan: "span 4",
            options: paisOptions,
            readOnly: !camposHabilitados,
        }] : []),
        {
            key: config.ciudadField,
            label: "Ciudad",
            type: "select",
            colSpan: "span 4",
            options: ciudadOptions,
            readOnly: !camposHabilitados,
        },
        {
            key: config.industriaField,
            label: "Industria",
            type: "select",
            colSpan: "span 4",
            options: industriaOptions,
            readOnly: !camposHabilitados,
        },
        {
            key: "__section_direccion__",
            type: "section",
            label: "Dirección",
            icon: "c-mapa-ubicacion",
            colSpan: "span 12",
        },
        {
            key: config.addressField,
            label: "Dirección de Recolección",
            type: "text",
            colSpan: "span 12",
            required: true,
            readOnly: !camposHabilitados,
        },
        {
            key: config.addressCountryField,
            label: "País",
            type: "select",
            colSpan: "span 4",
            options: paisOptions,
            required: true,
            readOnly: !camposHabilitados,
        },
        {
            key: config.addressDeptoField,
            label: "Departamento",
            type: "select",
            colSpan: "span 4",
            options: departamentoOptions,
            required: true,
            readOnly: !camposHabilitados,
        },
        {
            key: config.addressMuniField,
            label: "Municipio",
            type: "select",
            colSpan: "span 4",
            options: municipioOptions,
            readOnly: !camposHabilitados,
        },
        {
            key: "__section_contacto__",
            type: "section",
            label: "Contacto",
            icon: "c-telefono",
            colSpan: "span 12",
        },
        ...(modoNuevo ? [] : [
            {
                key: config.contactIdField,
                label: "Seleccionar Contacto",
                type: "select",
                colSpan: "span 10",
                options: contactoOptions,
                renderOption: renderContactoOption,
                readOnly: !camposHabilitados,
                required: true,
            },
            {
                key: "__btn_nuevo_contacto__",
                type: "button",
                colSpan: "span 2",
                action: nuevoContactoAction,
            },
        ]),
        {
            key: "_contacto_tipo_list",
            label: "Tipo(s) de Contacto",
            type: "checkboxes",
            icon: "c-lista-checkbox",
            options: tiposContactoOptions,
            required: modoNuevo,
            colSpan: "span 12",
        },
        {
            key: config.contactField,
            label: "Nombre Contacto",
            type: "text",
            colSpan: "span 4",
            readOnly: !camposHabilitados && !selectedContactId,
        },
        {
            key: config.emailField,
            label: "Email",
            type: "email",
            colSpan: "span 4",
            readOnly: !camposHabilitados && !selectedContactId,
        },
        {
            key: config.phoneField,
            label: "Teléfono",
            type: "text",
            colSpan: "span 4",
            readOnly: !camposHabilitados && !selectedContactId,
        },
        {
            key: "__section_identificacion__",
            type: "section",
            label: "Identificación",
            icon: "c-documento",
            colSpan: "span 12",
        },
        {
            key: config.identNumeroField,
            label: "NIT",
            type: "text",
            colSpan: "span 6",
            required: config.identRequired !== false,
            readOnly: !camposHabilitados,
        },
    ];

    return hiddenFields.size ? baseFields.filter((f) => !hiddenFields.has(f.key)) : baseFields;
};

const HIDDEN_FIELD_DEFAULTS = new Set();

export const buildEntidadPublicFields = ({
    config,
    entityOptions = [],
    paisOptions = [],
    ciudadOptions = [],
    departamentoOptions = [],
    municipioOptions = [],
    industriaOptions = [],
    contactoOptions = [],
    tiposContactoOptions = [],
    nuevoEntityAction,
    nuevoContactoAction,
    nuevoIdentAction,
    disableEntitySelector = false,
    modoNuevoContacto = false,
    modoNuevaEntidad = false,
    selectedEntidadId = null,
    selectedContactoId = null,
    hiddenFields = HIDDEN_FIELD_DEFAULTS,
}) => {
    const camposHabilitados = Boolean(selectedEntidadId) || modoNuevaEntidad;
    // Los campos del contacto (tipos/nombre/email/teléfono) solo se habilitan
    // si ya hay un contacto elegido en el selector o si se está capturando uno
    // nuevo: sin eso, no hay nada que editar y deben quedar deshabilitados.
    const contactoHabilitado = camposHabilitados && (modoNuevoContacto || Boolean(selectedContactoId));
    const fields = [
        ...(disableEntitySelector ? [] : [
            {
                key: config.entityField,
                label: `Seleccionar ${config.title}`,
                type: "select",
                required: !modoNuevaEntidad,
                colSpan: "span 10",
                options: entityOptions,
                readOnly: modoNuevaEntidad,
            },
            {
                key: "__btn_nueva_entidad__",
                type: "button",
                colSpan: "span 2",
                action: nuevoEntityAction,
            },
        ]),
        {
            key: "__section_info__",
            type: "section",
            label: config.sectionLabel || config.title,
            icon: "c-empresa",
            colSpan: "span 12",
        },
        {
            key: config.nombreField,
            label: "Nombre",
            type: "text",
            colSpan: "span 12",
            readOnly: !camposHabilitados,
        },
        ...(config.paisField ? [{
            key: config.paisField,
            label: "País",
            type: "select",
            colSpan: "span 4",
            options: paisOptions,
            readOnly: !camposHabilitados,
        }] : []),
        ...(config.ciudadField ? [{
            key: config.ciudadField,
            label: "Ciudad",
            type: "select",
            colSpan: "span 4",
            options: ciudadOptions,
            readOnly: !camposHabilitados,
        }] : []),
        ...(config.industriaField ? [{
            key: config.industriaField,
            label: "Industria",
            type: "select",
            colSpan: "span 4",
            options: industriaOptions,
            readOnly: !camposHabilitados,
        }] : []),
        {
            key: "__section_direccion__",
            type: "section",
            label: "Dirección",
            icon: "c-mapa-ubicacion",
            colSpan: "span 12",
        },
        {
            key: config.addressField,
            label: "Dirección de Recolección",
            type: "textarea",
            rows: 2,
            colSpan: "span 12",
            readOnly: !camposHabilitados,
        },
        ...(config.addressCountryField ? [{
            key: config.addressCountryField,
            label: "País",
            type: "select",
            colSpan: "span 4",
            options: paisOptions,
            readOnly: true,
        }] : []),
        ...(config.addressDeptoField ? [{
            key: config.addressDeptoField,
            label: "Departamento",
            type: "select",
            colSpan: "span 4",
            options: departamentoOptions,
            readOnly: !camposHabilitados,
        }] : []),
        ...(config.addressMuniField ? [{
            key: config.addressMuniField,
            label: "Municipio",
            type: "select",
            colSpan: "span 4",
            options: municipioOptions,
            readOnly: !camposHabilitados,
        }] : []),
        {
            key: "__section_contacto__",
            type: "section",
            label: "Contacto",
            icon: "c-telefono",
            colSpan: "span 12",
        },
        {
            key: config.contactIdField,
            label: "Seleccionar Contacto",
            type: "select",
            colSpan: "span 10",
            options: contactoOptions,
            renderOption: renderContactoOption,
            readOnly: modoNuevoContacto || !camposHabilitados,
        },
        {
            key: "__btn_nuevo_contacto__",
            type: "button",
            colSpan: "span 2",
            action: nuevoContactoAction,
        },
        {
            key: "_contacto_tipo_list",
            label: "Tipo(s) de Contacto",
            type: "checkboxes",
            icon: "c-lista-checkbox",
            options: tiposContactoOptions,
            colSpan: "span 12",
            readOnly: !contactoHabilitado,
        },
        {
            key: config.contactField,
            label: "Nombre Contacto",
            type: "text",
            colSpan: "span 4",
            readOnly: !contactoHabilitado,
        },
        {
            key: config.emailField,
            label: "Email",
            type: "email",
            colSpan: "span 4",
            readOnly: !contactoHabilitado,
        },
        {
            key: config.phoneField,
            label: "Teléfono",
            type: "text",
            colSpan: "span 4",
            readOnly: !contactoHabilitado,
        },
        ...(config.title === "Shipper" ? [{
            key: "telefonoEmergencia",
            label: "Telefono de Emergencia",
            type: "text",
            colSpan: "span 4",
            readOnly: !contactoHabilitado,
        }] : []),
        ...(config.hideIdentificacion ? [] : [
            {
                key: "__section_identificacion__",
                type: "section",
                label: "Identificación",
                icon: "c-documento",
                colSpan: "span 12",
            },
            {
                key: config.identNumeroField,
                label: "NIT",
                type: "text",
                colSpan: "span 12",
                readOnly: !camposHabilitados,
            },
        ]),
    ];

    return hiddenFields.size ? fields.filter((f) => !hiddenFields.has(f.key)) : fields;
};

export const EntidadPublicForm = ({ title, fields, initialValues, onValuesChange, onFieldChange, onSave, isSaving, hideHeader, disabled }) => (
    <FormularioConGuardar onGuardar={onSave} guardando={isSaving} disabled={disabled} variant="modern">
        {hideHeader && <EntidadFormHeader title={title} />}
        <FormularioAlternativo
            title={title}
            fields={fields}
            initialValues={initialValues}
            onValuesChange={onValuesChange}
            onFieldChange={onFieldChange}
            showSubmitButton={false}
            hideHeader={hideHeader}
            variant="modern"
        />
    </FormularioConGuardar>
);

EntidadPublicForm.propTypes = {
    title: PropTypes.string,
    fields: PropTypes.array,
    initialValues: PropTypes.object,
    onValuesChange: PropTypes.func,
    onFieldChange: PropTypes.func,
    onSave: PropTypes.func,
    isSaving: PropTypes.bool,
    hideHeader: PropTypes.bool,
    disabled: PropTypes.bool,
};
