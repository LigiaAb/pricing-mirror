import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useQueryClient } from "@tanstack/react-query";
import { Box, CircularProgress } from "@mui/material";
import {
	useFetchDatosEntidad,
	useFetchDatosEntidadPublico,
	useFetchEntidades,
	useFetchPaises,
	useFetchPaisesPublico,
} from "@/hooks/Bpm";
import { EntidadPublicForm, renderContactoOption } from "@/pages/Embarques/components/Entidades/entidadFormUI";
import FormularioAlternativo, { ModernFormHeader } from "@/components/bpm/Formularios/FormularioAlternativo";
import EntidadComparePanel from "@/pages/Embarques/components/Entidades/EntidadComparePanel";
import BannerInformativo from "@/pages/Embarques/components/banner";
import DialogComponent from "@/components/Dialog/DialogComponent";
import NuevoContactoEntidad from "@/pages/Embarques/components/Entidades/modalEntidad/nuevoContactoEntidad";
import { areRequiredFieldsFilled, getModifiedFields, unionModificados } from "./validation";

const REQUIRED_KEYS = new Set(["entidad_id", "cliente", "numero"]);

// Campos comparables del panel "Datos del cliente". Los que tienen `catalog`
// guardan códigos y necesitan resolverse a su etiqueta legible (igual que en
// Shipper/Consignatario); el resto ya es texto legible directo.
const CAMBIOS_DEFS = [
	{ key: "cliente", label: "Nombre", section: "Información" },
	{ key: "direccionFiscal", label: "Dirección Fiscal", section: "Dirección Fiscal" },
	{ key: "clienteContacto", label: "Nombre Contacto", section: "Contacto" },
	{ key: "clienteContactoEmail", label: "Email", section: "Contacto" },
	{ key: "clienteContactoTelefono", label: "Teléfono", section: "Contacto" },
	{ key: "numero", label: "NIT", section: "Identificación" },
];

const resolveCatalogLabel = (rawValue, options) => {
	if (rawValue === undefined || rawValue === null || rawValue === "") return "";
	const findLabel = (v) => {
		const found = (options || []).find((opt) => String(opt.value) === String(v));
		return found ? (found.label ?? String(v)) : String(v);
	};
	return Array.isArray(rawValue) ? rawValue.map(findLabel).join(", ") : findLabel(rawValue);
};

const normalizeCompareValue = (v) => {
	if (Array.isArray(v)) return [...v].map(String).sort((a, b) => a.localeCompare(b)).join(",");
	return String(v ?? "");
};

// Construye las filas de comparación (maestro/BD → valor enviado por el
// cliente) para los campos listados en `_modificadosCliente`.
const buildCambiosClienteRows = (modificados, baseValues, values, catalogs = {}) => {
	const mods = Array.isArray(modificados) ? modificados : [];
	if (mods.length === 0) return [];

	return CAMBIOS_DEFS
		.filter((def) => mods.includes(def.key))
		.map((def) => {
			const currentValue = def.key === "_contacto_tipo_list"
				? (baseValues[def.key] || [])
				: (baseValues[def.key] ?? "");
			const clienteValue = def.key === "_contacto_tipo_list"
				? (values[def.key] || [])
				: (values[def.key] ?? "");
			const formatLabel = (value) => (def.catalog && catalogs[def.catalog]
				? resolveCatalogLabel(value, catalogs[def.catalog])
				: (Array.isArray(value) ? value.join(", ") : value));
			return {
				configKey: def.key,
				label: def.label,
				section: def.section,
				currentValue,
				currentLabel: formatLabel(currentValue),
				clienteValue,
				clienteLabel: formatLabel(clienteValue),
				modificado: true,
				iguales: normalizeCompareValue(currentValue) === normalizeCompareValue(clienteValue),
			};
		})
		.filter((row) => !row.iguales);
};

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

// Códigos de tipo de contacto del contacto seleccionado (mismo formato que
// Shipper/Consignatario): `data_entidad_contacto_tipo` puede llegar como JSON
// string o array directo.
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
 * Sección de Facturación pública. A diferencia de shipper / consignatario, toda
 * la información (entidad, contacto, dirección fiscal y NIT) proviene de
 * `recuperar-datos-entidad`: la entidad cliente la fija la coordinación
 * (`selectedEntidadId` = coordinacion.entidadIdCli) y el contacto preseleccionado
 * sale de `contactoIdCliente` (coordinacion.contactoIdCliente).
 */
const FacturacionPublica = ({
	data = {},
	isLoading = false,
	onValidityChange = null,
	onValuesChange = null,
	onSave = null,
	isSaving = false,
	cliInfo = null,
	selectedEntidadId = null,
	contactoIdCliente = null,
	apiMode = "public",
}) => {
	const isPublic = apiMode !== "private";
	// Entidad cliente: la elegida en la coordinación; cae al token público.
	const entidadId = pick(selectedEntidadId, cliInfo?.entidad_id) || null;

	const queryClient = useQueryClient();
	const [openCrearContacto, setOpenCrearContacto] = useState(false);

	const readOnly = true;

	const publicQuery = useFetchDatosEntidadPublico(
		{ entidad_id: entidadId },
		{ enabled: isPublic && Boolean(entidadId) },
	);

	// En privado, `recuperar-datos-entidad` filtra por `cod_tipo` (default 3 = CLIENTE).
	// La entidad de facturación que eligió el cliente en el público puede no estar
	// clasificada como CLIENTE (p.ej. un Pre-Cliente, cod_tipo 5), en cuyo caso la
	// consulta con cod_tipo 3 vuelve vacía y el formulario se queda sin datos. Mismo
	// patrón de detección que ya usa el componente legado (secciones/facturacion.jsx).
	const { data: clienteEntidades = [], isSuccess: clienteQueryDone } = useFetchEntidades(
		{ tipo_entidad: "CLIENTE", entidad_id: entidadId },
		{ enabled: !isPublic && Boolean(entidadId) },
	);
	const esPreCliente = clienteQueryDone && clienteEntidades.length === 0;
	const codTipoCliente = clienteEntidades?.[0]?.cod_tipo ?? (esPreCliente ? 5 : 3);

	const privateQuery = useFetchDatosEntidad(
		{ entidad_id: entidadId, cod_tipo: codTipoCliente },
		{ enabled: !isPublic && Boolean(entidadId) && clienteQueryDone },
	);
	const { data: entidadData, isLoading: entidadLoading } = isPublic ? publicQuery : privateQuery;

	const { data: paisesData = [] } = isPublic ? useFetchPaisesPublico() : useFetchPaises();
	const paisOptions = useMemo(
		() => paisesData.map((p) => ({ value: String(p.cod_pais), label: p.nombre_pais })),
		[paisesData],
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

	// Valores base: al ser el formulario de solo lectura, siempre reflejan el
	// maestro de `recuperar-datos-entidad` (mismo dato que `entityMasterValues`),
	// nunca lo guardado previamente por el cliente en `data` — que puede quedar
	// desactualizado respecto al maestro.
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
			entidad_id: String(pick(entity?.entidad_id, selectedEntidadId, data?.entidad_id) || ""),
			cliente: entity?.entidad_nombre || "",
			entidadcontacto_id: contacto ? String(contacto.entidadcontacto_id) : "",
			clienteContacto: contacto?.entidadcontacto_nombre || "",
			clienteContactoEmail: contacto?.entidadcontacto_email || "",
			clienteContactoTelefono: contacto?.entidadcontacto_telefono || "",
			direccionFiscal: direccion?.entidaddireccion_direccion || "",
			numero: nit?.entidadidentificacio_numero || "",
		};
	}, [entidadData, data, selectedEntidadId, contactoIdCliente]);

	// Valores maestro (solo BD, sin overrides del cliente): a diferencia de
	// `baseValues`, ignora `data` para que el panel de comparación pueda seguir
	// mostrando el cambio del cliente aunque ya se haya guardado.
	const entityMasterValues = useMemo(() => {
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
			cliente: entity?.entidad_nombre || "",
			direccionFiscal: direccion?.entidaddireccion_direccion || "",
			clienteContacto: contacto?.entidadcontacto_nombre || "",
			clienteContactoEmail: contacto?.entidadcontacto_email || "",
			clienteContactoTelefono: contacto?.entidadcontacto_telefono || "",
			numero: nit?.entidadidentificacio_numero || "",
		};
	}, [entidadData, contactoIdCliente]);

	const [values, setValues] = useState(baseValues);

	// Re-sincroniza cuando llegan los datos de la entidad o cambian los guardados.
	const baseSig = useMemo(() => JSON.stringify(baseValues), [baseValues]);
	const lastBaseSig = useRef(null);
	useEffect(() => {
		if (lastBaseSig.current === baseSig) return;
		lastBaseSig.current = baseSig;
		setValues(baseValues);
	}, [baseSig, baseValues]);



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
		queryClient.invalidateQueries({ queryKey: ["datos-entidad-publico"] });
		queryClient.invalidateQueries({ queryKey: ["datos-entidad"] });
	}, [queryClient]);

	const nuevoContactoAction = useMemo(() => ({
		visible: true, enabled: true, nombre: "Nuevo", icono: "c-suma",
		onClick: () => setOpenCrearContacto(true),
	}), []);

	const fields = useMemo(() => {
		const raw = [
			{ key: "__sec_info__", type: "section", label: "Información", colSpan: "span 12" },
			{ key: "cliente", label: "Nombre", type: "text", colSpan: "span 12", readOnly: readOnly },
			{ key: "__sec_dir__", type: "section", label: "Dirección Fiscal", colSpan: "span 12" },
			{ key: "direccionFiscal", label: "Dirección Fiscal", type: "textarea", rows: 2, colSpan: "span 12", readOnly: readOnly },
			{ key: "__sec_con__", type: "section", label: "Contacto", colSpan: "span 12" },
			{ key: "entidadcontacto_id", label: "Seleccionar Contacto", type: "select", colSpan: "span 12", options: contactoOptions, renderOption: renderContactoOption, readOnly: readOnly },
			{ key: "clienteContacto", label: "Nombre Contacto", type: "text", colSpan: { sm: "span 12", md: "span 4" }, readOnly: readOnly },
			{ key: "clienteContactoEmail", label: "Email", type: "email", colSpan: { sm: "span 12", md: "span 4" }, readOnly: readOnly },
			{ key: "clienteContactoTelefono", label: "Teléfono", type: "text", colSpan: { sm: "span 12", md: "span 4" }, readOnly: readOnly },
			{ key: "__sec_nit__", type: "section", label: "Identificación", colSpan: "span 12" },
			{ key: "numero", label: "NIT", type: "text", colSpan: "span 12", readOnly: readOnly },
		];
		return raw.filter((f) => readOnly ? f.key !== "__btn_nuevo_contacto__" : true).map((f) => ({ ...f, required: REQUIRED_KEYS.has(f.key) || f.required }));
	}, [contactoOptions, readOnly]);

	const handleFieldChange = useCallback((key, value) => {
		if (key === "entidad_id") {
			const entity = (entidadData?.data_entidad || []).find((e) => String(e.entidad_id) === String(value));
			return {
				cliente: entity?.entidad_nombre || "",
			};
		}
		if (key === "entidadcontacto_id") {
			const c = contactoOptions.find((o) => o.value === String(value));
			return {
				clienteContacto: c?.nombre || "",
				clienteContactoEmail: c?.email || "",
				clienteContactoTelefono: c?.telefono || "",
			};
		}
		return {};
	}, [entidadData, contactoOptions]);

	const handleValuesChange = useCallback((next) => {
		setValues((prev) => ({ ...prev, ...next }));
	}, []);

	const isValid = useMemo(() => areRequiredFieldsFilled(fields, values), [fields, values]);
	const hasChanges = useMemo(
		() => Object.keys(baseValues).some((k) => String(values[k] ?? "") !== String(baseValues[k] ?? "")),
		[values, baseValues],
	);

	const compareCatalogs = useMemo(() => ({
		paises: paisOptions,
	}), [paisOptions]);

	// Panel "Datos del cliente": compara el maestro (recuperar-datos-entidad)
	// contra lo que el cliente ya guardó (`data._modificadosCliente`).
	const cambiosClienteRows = useMemo(
		() => buildCambiosClienteRows(data?._modificadosCliente, entityMasterValues, values, compareCatalogs),
		[data, entityMasterValues, values, compareCatalogs],
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

	const lastReportedSig = useRef(null);
	useEffect(() => {
		if (typeof onValuesChange !== "function") return;
		// Persistimos siempre entidad_id (entidad de facturación elegida) además de
		// los campos que el cliente haya modificado.
		const modificados = unionModificados(
			unionModificados(data?._modificadosCliente, getModifiedFields(baseValues, values)),
			values.entidad_id ? ["entidad_id"] : [],
		);
		const cliente = { ...values, _modificados: modificados };
		const sig = JSON.stringify(cliente);
		if (lastReportedSig.current === sig) return;
		lastReportedSig.current = sig;
		onValuesChange({ cliente });
	}, [values, baseValues, data, onValuesChange]);

	if (isLoading || entidadLoading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
				<CircularProgress size={24} />
			</Box>
		);
	}

	return (
		<>
			<BannerInformativo
				ocultar={!esPreCliente}
				severidad="error"
				titulo="Pre-cliente pendiente"
				mensaje="El pre-cliente debe convertirse en cliente."
			/>
			{!readOnly && (
				<BannerInformativo
					titulo="Aún no se ha guardado"
					mensaje="Complete los datos obligatorios para guardar."
					severidad="info"
					ocultar={isValid && !hasChanges}
				/>
			)}
			<Box sx={{ display: "flex", gap: 3, alignItems: { xs: "stretch", md: "flex-start" }, flexDirection: { xs: "column", md: "row" }, flexWrap: "wrap" }}>
				<Box sx={{ flex: "1 1 560px", minWidth: 0 }}>
					{/* Mismo maxWidth+mx:"auto" que FormularioConGuardar variant="modern" usa para
						Shipper/Consignatario/Detalles: sin esto el título quedaba pegado al borde
						izquierdo mientras las demás secciones lo muestran centrado con ese ancho. */}
					<Box sx={{ width: "100%", maxWidth: { xs: "100%", md: 720 }, mx: "auto" }}>
						<ModernFormHeader icon="c-documento" title="Facturación" subtitle="Datos de facturación del cliente." />
						{readOnly ? (
							<FormularioAlternativo
								title="Facturación - Información"
								fields={fields}
								initialValues={values}
								showSubmitButton={false}
								hideHeader
								variant="modern"
							/>
						) : (
							<EntidadPublicForm
								title="Facturación - Información"
								fields={fields}
								initialValues={values}
								onValuesChange={handleValuesChange}
								onFieldChange={handleFieldChange}
								onSave={onSave}
								isSaving={isSaving}
								disabled={!isValid}
								hideHeader
							/>
						)}
					</Box>
				</Box>

				{!readOnly && cambiosClienteRows.length > 0 && (
					<Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
						<EntidadComparePanel
							titulo="Facturación"
							showEntity={false}
							readOnly
							rows={cambiosClienteRows}
						/>
					</Box>
				)}
			</Box>

			{!readOnly && (
				<DialogComponent
					titulo="Nuevo Contacto (Facturación)"
					openDialog={openCrearContacto}
					handleClose={() => setOpenCrearContacto(false)}
					width="50vw"
					height="auto"
				>
					<NuevoContactoEntidad
						entidadId={values.entidad_id || null}
						onSubmit={handleContactoCreada}
					/>
				</DialogComponent>
			)}
		</>
	);
};

FacturacionPublica.propTypes = {
	readOnly: PropTypes.bool,
	data: PropTypes.object,
	isLoading: PropTypes.bool,
	onValidityChange: PropTypes.func,
	onValuesChange: PropTypes.func,
	onSave: PropTypes.func,
	isSaving: PropTypes.bool,
	cliInfo: PropTypes.object,
	selectedEntidadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	contactoIdCliente: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	apiMode: PropTypes.oneOf(["public", "private"]),
};

export default FacturacionPublica;
