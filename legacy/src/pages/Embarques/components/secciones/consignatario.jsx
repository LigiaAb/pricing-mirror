import React, { useMemo } from "react";
import PropTypes from "prop-types";
import EntidadFormSection from "../Entidades/entidadFormSection";

const CONSIGNATARIO_CONFIG = {
	title: "Consignatario",
	sectionLabel: "Información",
	relationType: "consignatario",
	relacionTipoDescripcion: "CONSIGNATARIO",
	relationTypeAliases: ["CONSIGNATARIO", "CONSIGNEE", "DESTINATARIO"],
	entityField: "cons_entidad",
	nombreField: "consignatario_nombre",
	addressField: "cons_direccion",
	addressCountryField: "cons_direccion_pais",
	addressZonaField: "cons_direccion_zona",
	addressKmField: "cons_direccion_km",
	addressCiudadField: "cons_direccion_ciudad",
	addressDeptoField: "cons_direccion_depto",
	paisField: "consignatario_pais",
	ciudadField: "consignatario_ciudad",
	industriaField: "consignatario_industria",
	addressMuniField: "cons_direccion_muni",
	contactField: "cons_contacto",
	contactIdField: "cons_contacto_id",
	phoneField: "cons_telefono",
	emailField: "cons_email",
	identTributariaField: "cons_identificacion_tributaria",
	identNumeroField: "cons_identificacion_numero",
	identRequired: false,
	entityDialogOpenLabel: "Crear Entidad (Consignatario)",
	addressDialogCreateTitle: "Crear Dirección (Consignatario)",
	addressDialogEditTitle: "Editar Dirección (Consignatario)",
	contactDialogCreateTitle: "Nuevo Contacto (Consignatario)",
	contactDialogEditTitle: "Editar Contacto (Consignatario)",
	identDialogCreateTitle: "Agregar NIT (Consignatario)",
	identDialogEditTitle: "Editar NIT (Consignatario)",
	nuevaEntidadTipo: 156,
	nitCodIdentificacion: 49,
	prefillEntityKeys: ["entidadIdConsignatario", "entidad_id_consignatario", "ENTIDAD_ID_CONSIGNATARIO"],
	prefillAddressKeys: ["cons_direccion", "CONS_DIRECCION", "consignDireccion"],
	prefillContactKeys: ["cons_contacto", "CONS_CONTACTO", "entidad_contacto_nombre", "ENTIDAD_CONTACTO_NOMBRE"],
	prefillContactIdKeys: ["contacto_id_consignatario", "CONTACTO_ID_CONSIGNATARIO", "contactoIdConsignatario"],
	prefillPhoneKeys: ["cons_telefono", "CONS_TELEFONO", "entidad_contacto_telefono", "ENTIDAD_CONTACTO_TELEFONO"],
	prefillEmailKeys: ["cons_email", "CONS_EMAIL", "entidad_contacto_email", "ENTIDAD_CONTACTO_EMAIL"],
	initialValues: {
		cons_entidad: "",
		consignatario_nombre: "",
		cons_direccion: "",
		cons_direccion_pais: "",
		cons_direccion_zona: "",
		cons_direccion_km: "",
		cons_direccion_ciudad: "",
		cons_direccion_depto: "",
		cons_direccion_muni: "",
		cons_contacto: "",
		cons_contacto_id: "",
		cons_telefono: "",
		cons_email: "",
		cons_identificacion_tributaria: "",
		cons_identificacion_numero: "",
		consignatario_pais: "",
		consignatario_ciudad: "",
		consignatario_industria: "",
	},
	savePayload: (selectedEntityId, selectedEntityObj, values) => ({
		cod_entidad_consignatario: selectedEntityId ? Number(selectedEntityId) : null,
		entidad_consignatario_nombre: values?.consignatario_nombre || selectedEntityObj?.entidad_nombre || null,
		contacto_id_consignatario: values?.cons_contacto_id ? Number(values.cons_contacto_id) : null,
	}),
};

const ConsignatarioSection = ({ embarque_id, embarqueData, clienteData, onValidityChange, onValuesChange, onLoadingChange, onSaveSuccess }) => {
	const config = useMemo(() => ({ ...CONSIGNATARIO_CONFIG }), []);

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

ConsignatarioSection.propTypes = {
	embarque_id: PropTypes.number,
	embarqueData: PropTypes.object,
	clienteData: PropTypes.object,
	onValidityChange: PropTypes.func,
	onValuesChange: PropTypes.func,
	onLoadingChange: PropTypes.func,
	onSaveSuccess: PropTypes.func,
};

export default ConsignatarioSection;
