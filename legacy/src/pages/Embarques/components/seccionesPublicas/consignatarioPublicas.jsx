import React from "react";
import PropTypes from "prop-types";
import EntidadPublicFormSection from "@/pages/Embarques/components/Entidades/entidadPublicFormSection";

const CONSIGNATARIO_CONFIG = {
    title: "Consignatario",
    sectionLabel: "Información",
    aliases: new Set(["CONSIGNATARIO", "CONSIGNEE", "DESTINATARIO"]),
    tipo: 156,
    nitCodIdentificacion: 49,
    addressDataKey: "direccion",
    phoneDataKey: "telefonos",
    hiddenFields: new Set([]),
    dialogs: {
        entidad: "Crear Entidad (Consignatario)",
        direccion: "Nueva Dirección (Consignatario)",
        contacto: "Nuevo Contacto (Consignatario)",
        ident: "Agregar NIT (Consignatario)",
    },
};

const ConsignatarioPublicas = ({
    data = {},
    isLoading = false,
    onValidityChange = null,
    onValuesChange = null,
    onSave = null,
    isSaving = false,
    cliInfo = null,
    selectedEntidadId = null,
    apiMode = "public",
}) => (
    <EntidadPublicFormSection
        config={CONSIGNATARIO_CONFIG}
        data={data}
        isLoading={isLoading}
        onValidityChange={onValidityChange}
        onValuesChange={onValuesChange}
        onSave={onSave}
        isSaving={isSaving}
        cliInfo={cliInfo}
        selectedEntidadId={selectedEntidadId}
        apiMode={apiMode}
    />
);

ConsignatarioPublicas.propTypes = {
    data: PropTypes.object,
    isLoading: PropTypes.bool,
    onValidityChange: PropTypes.func,
    onValuesChange: PropTypes.func,
    onSave: PropTypes.func,
    isSaving: PropTypes.bool,
    cliInfo: PropTypes.object,
    selectedEntidadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    apiMode: PropTypes.oneOf(["public", "private"]),
};

export default ConsignatarioPublicas;
