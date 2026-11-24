import React, { useMemo } from "react";
import PropTypes from "prop-types";
import EntidadFormSection from "../Entidades/entidadFormSection";

const SHIPPER_CONFIG = {
	title: "Shipper",
	sectionLabel: "Información",
	relationType: "shipper",
	relacionTipoDescripcion: "SHIPPER",
	relationTypeAliases: ["SHIPPER", "CONSIGNOR", "REMITENTE", "EXPORTADOR", "CLIENTE"],
	entityField: "entidad",
	nombreField: "shipper_nombre",
	addressField: "direccion_recoleccion",
	addressCountryField: "direccion_recoleccion_pais",
	addressZonaField: "direccion_recoleccion_zona",
	addressKmField: "direccion_recoleccion_km",
	addressCiudadField: "direccion_recoleccion_ciudad",
	addressDeptoField: "direccion_recoleccion_depto",
	paisField: "shipper_pais",
	ciudadField: "shipper_ciudad",
	industriaField: "shipper_industria",
	addressMuniField: "direccion_recoleccion_muni",
	contactField: "contacto",
	contactIdField: "contacto_id",
	phoneField: "telefono",
	emailField: "email",
	identTributariaField: "identificacion_tributaria",
	identNumeroField: "identificacion_numero",
	entityDialogOpenLabel: "Crear Entidad",
	addressDialogCreateTitle: "Crear Dirección (Shipper)",
	addressDialogEditTitle: "Editar Dirección (Shipper)",
	contactDialogCreateTitle: "Nuevo Contacto (Shipper)",
	contactDialogEditTitle: "Editar Contacto (Shipper)",
	identDialogCreateTitle: "Agregar NIT",
	identDialogEditTitle: "Editar NIT",
	nuevaEntidadTipo: 155,
	nitCodIdentificacion: 46,
	prefillEntityKeys: ["entidadIdShipper", "entidad_id_shipper", "ENTIDAD_ID_SHIPPER"],
	prefillAddressKeys: ["direccion_recoleccion", "DIRECCION_RECOLECCION", "sitioRecoleccion", "shipperDireccion"],
	prefillContactKeys: ["contacto", "CONTACTO", "entidad_contacto_nombre", "ENTIDAD_CONTACTO_NOMBRE"],
	prefillContactIdKeys: ["contacto_id_shipper", "CONTACTO_ID_SHIPPER", "contactoIdShipper"],
	prefillPhoneKeys: ["telefono", "TELEFONO", "entidad_contacto_telefono", "ENTIDAD_CONTACTO_TELEFONO"],
	prefillEmailKeys: ["email", "EMAIL", "entidad_contacto_email", "ENTIDAD_CONTACTO_EMAIL"],
	hideNuevoEntidad: true,
	hidePaisesAsociados: true,
	identRequired: false,
	initialValues: {
		entidad: "",
		shipper_nombre: "",
		direccion_recoleccion: "",
		direccion_recoleccion_pais: "",
		direccion_recoleccion_zona: "",
		direccion_recoleccion_km: "",
		direccion_recoleccion_ciudad: "",
		direccion_recoleccion_depto: "",
		direccion_recoleccion_muni: "",
		contacto: "",
		contacto_id: "",
		telefono: "",
		email: "",
		identificacion_tributaria: "",
		identificacion_numero: "",
		shipper_pais: "",
		shipper_ciudad: "",
		shipper_industria: "",
	},
	savePayload: (selectedEntityId, selectedEntityObj, values) => ({
		cod_entidad_shipper: selectedEntityId ? Number(selectedEntityId) : null,
		entidad_shipper_nombre: values?.shipper_nombre || selectedEntityObj?.entidad_nombre || null,
		contacto_id_shipper: values?.contacto_id ? Number(values.contacto_id) : null,
	}),
};

const ShipperSection = ({ embarque_id, embarqueData, clienteData, onValidityChange, onValuesChange, onLoadingChange, onSaveSuccess }) => {
	const config = useMemo(() => ({ ...SHIPPER_CONFIG }), []);

	return (
		<EntidadFormSection
			config={config}
			embarque_id={embarque_id}
			embarqueData={embarqueData}
			clienteData={clienteData}
			onValidityChange={onValidityChange}
			onValuesChange={onValuesChange}
			onLoadingChange={onLoadingChange}
			onSaveSuccess={onSaveSuccess}
		/>
	);
};

ShipperSection.propTypes = {
	embarque_id: PropTypes.number,
	embarqueData: PropTypes.object,
	clienteData: PropTypes.object,
	onValidityChange: PropTypes.func,
	onValuesChange: PropTypes.func,
	onLoadingChange: PropTypes.func,
	onSaveSuccess: PropTypes.func,
};

export default ShipperSection;