import React from "react";
import PropTypes from "prop-types";
import EntidadPublicFormSection from "@/pages/Embarques/components/Entidades/entidadPublicFormSection";

const SHIPPER_CONFIG = {
    title: "Shipper",
    sectionLabel: "Información",
    aliases: new Set(["SHIPPER", "CONSIGNOR", "REMITENTE", "EXPORTADOR", "CLIENTE"]),
    tipo: 155,
    nitCodIdentificacion: 46,
    addressDataKey: "direccionRecoleccion",
    phoneDataKey: "telefono",
    hideIdentificacion: false,
    hiddenFields: new Set([]),
    hideNuevoEntidad: true,
    dialogs: {
        entidad: "Crear Entidad (Shipper)",
        direccion: "Nueva Dirección (Shipper)",
        contacto: "Nuevo Contacto (Shipper)",
        ident: "Agregar NIT (Shipper)",
    },
};

const ShipperPublicas = ({
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
        config={SHIPPER_CONFIG}
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

ShipperPublicas.propTypes = {
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

export default ShipperPublicas;
