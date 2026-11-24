import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, CircularProgress, Button, Typography } from "@mui/material";
import TablaCargasEditable from "@/components/bpm/tablas/tablaCargasEdit";
import ModalCargas from "@/components/bpm/modal/modalCargas";
import CalculadoraCargas from "@/pages/Embarques/components/calculadoraCargas";
import { areCargaRowsValid, getCamposFaltantesCarga } from "./validation";
import { useFetchPaises, useFetchPaisesPublico, useFetchTipos, useFetchTiposV2, useFetchRelacionTipo, useFetchRelacionTipoPublicV2 } from "@/hooks/Bpm";
import BannerInformativo from "@/pages/Embarques/components/banner";
import { getFactorCmPorUnidadMedida } from "@/components/bpm/modal/modalCargas";

const createEmptyRow = () => ({
	embCargaId: null,
	rubroId: null,
	paisOrigenId: "",
	descripcion: "",
	valor: "",
	tipoEmbalaje: "",
	partidaArancelaria: "",
	regimenAduanal: "",
	definitivoGeneral: "N",
	cantidad: "",
	volumenTotal: "",
	pesoTotal: "",
	largo: "",
	alto: "",
	ancho: "",
	unidadMedida: "",
	unidadPeso: "",
	cw: "",
});

const computeVolumenFromDims = ({ largo, alto, ancho, cantidad, factorCm = 1 }) => {
	const toNumber = (v) => {
		const n = Number.parseFloat(v);
		return Number.isFinite(n) ? n : Number.NaN;
	};
	const l = toNumber(largo);
	const a = toNumber(alto);
	const an = toNumber(ancho);
	const c = toNumber(cantidad);
	const f = toNumber(factorCm);
	const factor = Number.isFinite(f) && f > 0 ? f : 1;
	if ([l, a, an, c].some((v) => Number.isNaN(v) || v <= 0)) return 0;
	// IATA: dimensiones en cm, resultado en kg volumétrico. Si la carga
	// trae otra unidad (pies, pulgadas, metros), se multiplica por el
	// factor de conversión correspondiente antes de aplicar la fórmula.
	const lCm = l * factor;
	const aCm = a * factor;
	const anCm = an * factor;
	const volumetricoUnitario = (lCm * aCm * anCm) / 6000;
	return Number((volumetricoUnitario * c).toFixed(3));
};

const CargasPublicas = ({ data = [], isLoading = false, onValidityChange = null, onValuesChange = null, onSave = null, isSaving = false, jsonCarta: jsonCartaProp = null, cliInfo: cliInfoProp = null, onActualizarJson = null, onSaveSuccess = null, apiMode = "public" }) => {
	const readOnly = apiMode === "private";
	const paisesPrivate = useFetchPaises({}, { enabled: apiMode === "private" });
	const paisesPublic = useFetchPaisesPublico();
	const tiposPrivate = useFetchTipos({ tipo_tabla: "embalaje" }, { enabled: apiMode === "private" });
	const tiposPublic = useFetchTiposV2("embalaje");
	const regimenAduanalPrivate = useFetchTipos({ tipo_tabla: "REGIMEN_ADUANAL" }, { enabled: apiMode === "private" });
	const regimenAduanalPublic = useFetchTiposV2("REGIMEN_ADUANAL");
	// Catálogo de tipos de unidad de medida para dimensiones (largo/alto/ancho).
	// Origen: lista-relacion-tipo?tipo_tabla=coordinacion_carga&cod_tipo_padre=296.
	const unidadesMedidaPrivate = useFetchRelacionTipo(
		{ tipo_tabla: "coordinacion_carga", cod_tipo_padre: 296 },
		{ enabled: apiMode === "private" },
	);
	const unidadesMedidaPublic = useFetchRelacionTipoPublicV2(
		{ tipo_tabla: "coordinacion_carga", cod_tipo_padre: 296 },
		{ enabled: apiMode !== "private" },
	);

	const { data: paises = [], isLoading: isLoadingPaises } = apiMode === "private"
		? paisesPrivate
		: paisesPublic;
	const { data: tiposEmbalaje = [], isLoading: isLoadingTiposEmbalaje } = apiMode === "private"
		? tiposPrivate
		: tiposPublic;
	const { data: regimenAduanalOptions = [], isLoading: isLoadingRegimenAduanal } = apiMode === "private"
		? regimenAduanalPrivate
		: regimenAduanalPublic;
	const { data: unidadesMedida = [], isLoading: isLoadingUnidadesMedida } = apiMode === "private"
		? unidadesMedidaPrivate
		: unidadesMedidaPublic;

	const [filas, setFilas] = useState([]);
	// Refleja ediciones locales aún no persistidas. No usar embCargaId/temp ids
	// como proxy: en el flujo público las cargas viven en un JSON, así que
	// embCargaId siempre es null aunque la fila ya esté guardada.
	const [isDirty, setIsDirty] = useState(false);
	const [calculatorOpen, setCalculatorOpen] = useState(false);
	const [calculatorContext, setCalculatorContext] = useState({ rowIndex: null, initialValues: {}, newRowSetter: null });
	const [nuevaCargaOpen, setNuevaCargaOpen] = useState(false);
	const [nuevaCargaRow, setNuevaCargaRow] = useState(null);

	const camposModal = useMemo(() => {
		return [
			{
				id: "paisOrigenId", label: "País Origen *", type: "select", required: true,
				options: paises.map((p) => ({ value: p.cod_pais, label: p.nombre_pais })),
				valueOption: "value", labelOption: "label",
				loading: isLoadingPaises,
			},
			{ id: "descripcion", label: "Descripción *", required: true, multiline: false },
			{ id: "valor", label: "Valor declarado *", type: "number", required: true, min: 0.01 },
			{
				id: "tipoEmbalaje", label: "Tipo Embalaje *", type: "select", required: true,
				options: tiposEmbalaje.map((t) => ({ value: t.value, label: t.label })),
				valueOption: "value", labelOption: "label",
				loading: isLoadingTiposEmbalaje,
			},
			{
				id: "partidaArancelaria", label: "Partida Arancelaria *", type: "text", required: true,
				inputProps: { maxLength: 10 }, multiline: false,
			},
			{
				id: "regimenAduanal", label: "Régimen Aduanal *", type: "select", required: true,
				options: regimenAduanalOptions.map((t) => ({ value: t.value, label: t.label })),
				valueOption: "value", labelOption: "label",
				loading: isLoadingRegimenAduanal,
			},
			{ id: "cantidad", label: "# Bultos *", type: "number", required: true, min: 1, inputProps: { step: 1 } },
			{ id: "pesoTotal", label: "Peso (kg) *", type: "number", required: true, min: 0.001 },
			{ id: "largo", label: "Largo *", type: "number", required: true, min: 0.1 },
			{ id: "alto", label: "Alto *", type: "number", required: true, min: 0.1 },
			{ id: "ancho", label: "Ancho *", type: "number", required: true, min: 0.1 },
			{
				id: "unidadMedida", label: "Unidad de medida *", type: "select", required: true,
				// El valor guardado en la carga (TIPO_ID_UNIDAD_MEDIDA /
				// tipo_id_unidad_medida) es el `cod_tipo` del registro de
				// lista-relacion-tipo, no su `cod_relacion_tipo`. Si usamos
				// `cod_relacion_tipo` (u.value) como valor de la option, el
				// Autocomplete del modal no encuentra la opción guardada al
				// editar y muestra el id crudo como label. Por eso mapeamos el
				// value de la option a `cod_tipo` (codTipo en el hook público,
				// cod_tipo en el privado).
				options: unidadesMedida.map((u) => ({
					value: u.codTipo ?? u.cod_tipo ?? u.value,
					label: u.label,
				})),
				valueOption: "value", labelOption: "label",
				loading: isLoadingUnidadesMedida,
			},
			{ id: "volumenTotal", label: "Peso volumétrico (kg)", type: "number", editable: false },
			{ id: "cw", label: "CW (kg)", type: "number", editable: false },
		];
	}, [tiposEmbalaje, regimenAduanalOptions, isLoadingRegimenAduanal, paises, unidadesMedida, isLoadingUnidadesMedida]);

	// Normalizar datos de la API (admite claves PascalCase y camelCase)
	useEffect(() => {
		if (!Array.isArray(data) || data.length === 0) {
			setFilas([]);
			return;
		}

		const mapped = data.map((c, idx) => {
			const unidadMedidaRaw = c.unidadMedida ?? c.tipoUnidadMedidaId ?? c.tipo_id_unidad_medida ?? c.TIPO_ID_UNIDAD_MEDIDA ?? "";
			const factorCm = getFactorCmPorUnidadMedida(unidadMedidaRaw, unidadesMedida);
			return {
				embCargaId: c.embCargaId ?? c.EMB_CARGA_ID ?? c.id ?? c.ID ?? null,
				rubroId: c.rubroId ?? c.RUBRO_ID ?? null,
				paisOrigenId: c.paisOrigenId ?? c.PaisOrigen ?? c.PAIS_ID_ORIGEN ?? c.COD_PAIS_ORIGEN_CARGA ?? c.PAIS_ID_ORIGEN_CARGA ?? "",
				descripcion: c.descripcion ?? c.Descripcion ?? c.descripcionCarga ?? c.DESCRIPCION_CARGA ?? "",
				valor: c.valor ?? c.Valor ?? c.VALOR ?? "",
				tipoEmbalaje: c.tipoEmbalaje ?? c.TipoEmbalaje ?? c.codTipoEmbalaje ?? c.TIPO_EMBALAJE ?? "",
				partidaArancelaria: c.partidaArancelaria ?? c.PartidaArancelaria ?? c.PARTIDA_ARANCELARIA ?? "",
				regimenAduanal: c.regimenAduanal ?? c.RegimenAduanal ?? c.REGIMEN_ADUANAL ?? "",
				definitivoGeneral:
					String(c.definitivoGeneral ?? c.DefinitivoGeneral ?? c.DEFINITIVO_GENERAL ?? "N").toUpperCase() === "S"
						? "S"
						: "N",
				cantidad: c.cantidad ?? c.Cantidad ?? c.bultos ?? c.BULTOS ?? "",
				largo: c.largo ?? c.Largo ?? c.LARGO ?? c.largo_cm ?? "",
				alto: c.alto ?? c.Alto ?? c.ALTO ?? c.alto_cm ?? "",
				ancho: c.ancho ?? c.Ancho ?? c.ANCHO ?? c.ancho_cm ?? "",
				volumenTotal: (() => {
					const existingVol = Number(c.volumenTotal ?? c.VolumenTotal ?? c.volumen ?? c.metrosCubicos ?? 0);
					const computedVol = computeVolumenFromDims({
						largo: c.largo ?? c.LARGO ?? c.largo_cm ?? 0,
						alto: c.alto ?? c.ALTO ?? c.alto_cm ?? 0,
						ancho: c.ancho ?? c.ANCHO ?? c.ancho_cm ?? 0,
						cantidad: c.cantidad ?? c.Cantidad ?? c.bultos ?? c.BULTOS ?? 0,
						factorCm,
					});
					if (existingVol > 0) return existingVol;
					return computedVol;
				})(),
				pesoTotal: c.pesoTotal ?? c.PesoTotal ?? c.peso ?? c.PESO ?? "",
				cw: c.cw ?? c.CW ?? "",
				unidadMedida: String(unidadMedidaRaw ?? ""),
				unidadPeso: String(c.unidadPeso ?? c.tipoUnidadMedidaId ?? c.tipo_id_unidad_medida ?? c.TIPO_ID_UNIDAD_MEDIDA ?? ""),
				_gridId: c.embCargaId ?? c.EMB_CARGA_ID ?? `temp_id_${idx}`,
			};
		});

		setFilas((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
			return mapped;
		});
	}, [data, unidadesMedida]);

	useEffect(() => {
		if (typeof onValidityChange === "function") {
			const valid = areCargaRowsValid(filas);
			let validityStatus;
			if (valid) {
				validityStatus = isDirty && !readOnly ? "pending" : true;
			} else {
				validityStatus = false;
			}
			onValidityChange(validityStatus);
		}
		if (typeof onValuesChange === "function") {
			onValuesChange(filas);
		}
	}, [filas, isDirty, onValidityChange, onValuesChange, readOnly]);

	const totalCW = useMemo(
		() => filas.reduce((s, it) => s + (Number.parseFloat(it.cw) || 0), 0),
		[filas],
	);

	const normalizeVal = (val) => {
		if (val && typeof val === "object" && !Array.isArray(val)) {
			if ("value" in val) return val.value;
		}
		return val;
	};

	const round2 = (n) => {
		if (n === null || n === undefined || n === "") return n;
		const num = Number(n);
		return Number.isNaN(num) ? n : Number.parseFloat(num.toFixed(2));
	};

	const iataRoundKg = (value) => {
		const n = Number(value);
		if (!Number.isFinite(n) || n <= 0) return 0;
		return Math.ceil(n);
	};

	const computeCWFromRow = (row) => {
		const peso = Number(row.pesoTotal);
		const vol = Number(row.volumenTotal);
		if (!Number.isFinite(peso) || !Number.isFinite(vol) || (peso <= 0 && vol <= 0)) return 0;
		const pesoIATA = iataRoundKg(peso);
		const volumenIATA = iataRoundKg(vol);
		return Number(Math.max(pesoIATA, volumenIATA).toFixed(3));
	};

	const updateFila = (idx, field, value) => {
		const valToStore = value && typeof value === "object" && !Array.isArray(value) ? value : normalizeVal(value);
		setIsDirty(true);
		setFilas((prev) =>
			prev.map((fila, i) => {
				if (i !== idx) return fila;
				const updatedFila = { ...fila, [field]: valToStore };
				if (["largo", "alto", "ancho", "cantidad", "unidadMedida"].includes(field)) {
					const factorCm = getFactorCmPorUnidadMedida(updatedFila.unidadMedida, unidadesMedida);
					const volumenCalculado = computeVolumenFromDims({ ...updatedFila, factorCm });
					updatedFila.volumenTotal = volumenCalculado > 0 ? round2(volumenCalculado) : "";
				}
				updatedFila.cw = computeCWFromRow(updatedFila);
				return updatedFila;
			}),
		);
	};

	const removeFila = (idx) => {
		setIsDirty(true);
		setFilas((prev) => prev.filter((_, i) => i !== idx));
	};

	const addFila = (nueva = null) => {
		if (nueva && typeof nueva !== "object") return;
		const fila = { ...createEmptyRow() };
		if (nueva && typeof nueva === "object") {
			Object.keys(nueva).forEach((k) => {
				if (k === "definitivoGeneralBool") {
					fila.definitivoGeneral = nueva[k] ? "S" : "N";
				} else {
					fila[k] = normalizeVal(nueva[k]);
				}
			});
			delete fila.definitivoGeneralBool;
		}
		setIsDirty(true);
		setFilas((prev) => [...prev, fila]);
	};

	const handleOpenCalculator = (rowOrIndex) => {
		let index = null;
		let initialValues = {};
		let newRowSetter = null;

		if (typeof rowOrIndex === "number") {
			index = rowOrIndex;
		} else if (typeof rowOrIndex === "object") {
			initialValues = {
				cantidad: rowOrIndex.cantidad,
				volumenTotal: rowOrIndex.volumenTotal,
				pesoTotal: rowOrIndex.pesoTotal,
				largo: rowOrIndex.largo,
				alto: rowOrIndex.alto,
				ancho: rowOrIndex.ancho,
			};
			if (rowOrIndex.__isNewRow && typeof rowOrIndex.__setNewRow === "function") {
				newRowSetter = rowOrIndex.__setNewRow;
			}
			if (rowOrIndex._index !== undefined && rowOrIndex._index !== null) {
				index = rowOrIndex._index;
			} else {
				index = filas.findIndex(
					(f) => f._gridId === rowOrIndex._gridId || f.embCargaId === rowOrIndex.embCargaId,
				);
			}
		}

		if (typeof index === "number" && index >= 0) {
			initialValues = {
				cantidad: filas[index]?.cantidad,
				volumenTotal: filas[index]?.volumenTotal,
				pesoTotal: filas[index]?.pesoTotal,
				largo: filas[index]?.largo,
				alto: filas[index]?.alto,
				ancho: filas[index]?.ancho,
			};
		}

		setCalculatorContext({
			rowIndex: typeof index === "number" && index >= 0 ? index : null,
			initialValues,
			newRowSetter,
		});
		setCalculatorOpen(true);
	};

	const handleApplyCalculator = ({ pesoTotal, volumenTotal, cantidad, largo, alto, ancho }) => {
		const cantidadRedondeada = cantidad === undefined ? cantidad : round2(cantidad);
		const volumenRedondeado = round2(volumenTotal);
		const pesoRedondeado = round2(pesoTotal);
		const dims = {};
		if (largo !== undefined) dims.largo = round2(largo);
		if (alto !== undefined) dims.alto = round2(alto);
		if (ancho !== undefined) dims.ancho = round2(ancho);

		if (typeof calculatorContext.newRowSetter === "function") {
			calculatorContext.newRowSetter((prev) => ({
				...prev,
				cantidad: cantidadRedondeada ?? prev.cantidad,
				volumenTotal: volumenRedondeado,
				pesoTotal: pesoRedondeado,
				...dims,
			}));
		} else if (calculatorContext.rowIndex !== null) {
			const idx = calculatorContext.rowIndex;
			updateFila(idx, "pesoTotal", pesoRedondeado);
			updateFila(idx, "volumenTotal", volumenRedondeado);
			if (cantidad !== undefined) updateFila(idx, "cantidad", cantidadRedondeada);
			if (dims.largo !== undefined) updateFila(idx, "largo", dims.largo);
			if (dims.alto !== undefined) updateFila(idx, "alto", dims.alto);
			if (dims.ancho !== undefined) {
				updateFila(idx, "ancho", dims.ancho);
			}
			setFilas((prev) => prev.map((fila, i) => (i === idx ? { ...fila, cw: computeCWFromRow(fila) } : fila)));
		}
	};

	const getNormalizedDraft = (draft) => {
		const normalized = {};
		for (const key of Object.keys(draft)) {
			if (key.startsWith("_")) continue;
			if (key === "definitivoGeneralBool") {
				normalized.definitivoGeneral = draft[key] ? "S" : "N";
			} else {
				normalized[key] = normalizeVal(draft[key]);
			}
		}
		return normalized;
	};

	const handleRowSave = async (draft, index) => {
		if (!draft) return;
		const normalized = getNormalizedDraft(draft);
		const filasActualizadas = filas.map((f, i) => (i === index ? { ...f, ...normalized } : f));

		if (typeof onActualizarJson === "function" && jsonCartaProp) {
			const json_data = {
				...(jsonCartaProp || {}),
				"lista-coordinacion-carga": filasActualizadas,
			};
			try {
				await onActualizarJson({
					json_data,
					token_interaccion: cliInfoProp?.token_interaccion,
					version_app: cliInfoProp?.version_app || "0.0.2",
				});
				setIsDirty(false);
				if (typeof onSaveSuccess === "function") {
					onSaveSuccess();
				}
			} catch (error) {
				console.error("Error guardando carga editada:", error);
			}
			return;
		}

		if (typeof onSave === "function") {
			await onSave(filasActualizadas);
			setIsDirty(false);
		}
	};

	const handleSaveNuevaCarga = async (draft) => {
		if (!draft) return;
		const normalized = {};
		for (const key of Object.keys(draft)) {
			if (key === "definitivoGeneralBool") {
				normalized.definitivoGeneral = draft[key] ? "S" : "N";
			} else {
				normalized[key] = normalizeVal(draft[key]);
			}
		}
		const cargasCompletas = [...filas, normalized];

		if (typeof onActualizarJson === "function" && jsonCartaProp) {
			const json_data = {
				...(jsonCartaProp || {}),
				"lista-coordinacion-carga": cargasCompletas,
			};
			try {
				await onActualizarJson({
					json_data,
					token_interaccion: cliInfoProp?.token_interaccion,
					version_app: cliInfoProp?.version_app || "0.0.2",
				});
				setIsDirty(false);
				setNuevaCargaOpen(false);
				setNuevaCargaRow(null);
				if (typeof onSaveSuccess === "function") {
					onSaveSuccess();
				}
				return;
			} catch (error) {
				console.error("Error guardando nueva carga:", error);
				return;
			}
		}

		if (typeof onSave === "function") {
			await onSave(cargasCompletas);
			setIsDirty(false);
			setNuevaCargaOpen(false);
			setNuevaCargaRow(null);
		}
	};

	if (isLoading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
				<CircularProgress size={24} />
			</Box>
		);
	}

	if (readOnly) {
		return (
			<Box sx={{ width: "100%", minWidth: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
				<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
					<Typography variant="body2">
						CW total: <strong>{Number(totalCW).toFixed(2)} kg</strong>
					</Typography>
				</Box>
				<TablaCargasEditable
					filas={filas}
					isLoadingPaises={isLoadingPaises}
					paises={paises}
					regimenAduanalOptions={regimenAduanalOptions}
					updateFila={updateFila}
					removeFila={removeFila}
					addFila={addFila}
					hideUnidadVolumetrica={true}
					tiposEmbalaje={tiposEmbalaje}
					isLoadingTiposEmbalaje={isLoadingTiposEmbalaje}
					unidadesMedida={unidadesMedida}
					isLoadingUnidadesMedida={isLoadingUnidadesMedida}
					columnasVisibles={["_estado", "descripcion", "cw"]}
					getCamposFaltantes={getCamposFaltantesCarga}
					readOnly
				/>
			</Box>
		);
	}

	return (
		<Box sx={{ width: "100%", minWidth: 0 }}>
			<BannerInformativo
				titulo="Datos incompletos"
				mensaje="Complete los campos obligatorios antes de continuar."
				severidad="warning"
				ocultar={filas.length === 0 || areCargaRowsValid(filas)}
			/>
			<Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
				<Button variant="outlined" disabled={isLoadingPaises} onClick={() => { setNuevaCargaRow(null); setNuevaCargaOpen(true); }}>
					{isLoadingPaises ? "Cargando..." : "Añadir carga"}
				</Button>
			</Box>
			<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
				<Typography variant="body2">
					CW total: <strong>{Number(totalCW).toFixed(2)} kg</strong>
				</Typography>
			</Box>
			<Box sx={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch", minWidth: 0 }}>
				<TablaCargasEditable
					filas={filas}
					isLoadingPaises={isLoadingPaises}
					paises={paises}
					regimenAduanalOptions={regimenAduanalOptions}
					updateFila={updateFila}
					removeFila={removeFila}
					addFila={addFila}
					hideUnidadVolumetrica={true}
					onRowSave={handleRowSave}
					onRowDelete={null}
					onOpenCalculator={handleOpenCalculator}
					tiposEmbalaje={tiposEmbalaje}
					isLoadingTiposEmbalaje={isLoadingTiposEmbalaje}
					unidadesMedida={unidadesMedida}
					isLoadingUnidadesMedida={isLoadingUnidadesMedida}
					columnasVisibles={["_estado", "descripcion", "cw"]}
					getCamposFaltantes={getCamposFaltantesCarga}
				/>
			</Box>
			<ModalCargas
				open={nuevaCargaOpen}
				row={nuevaCargaRow}
				camposModal={camposModal}
				onClose={() => { setNuevaCargaOpen(false); setNuevaCargaRow(null); }}
				onSave={handleSaveNuevaCarga}
				unidadesMedida={unidadesMedida}
			/>
			<CalculadoraCargas
				open={calculatorOpen}
				onClose={() => {
					setCalculatorOpen(false);
					setCalculatorContext({ rowIndex: null, initialValues: {}, newRowSetter: null });
				}}
				onApply={handleApplyCalculator}
				initialValues={calculatorContext.initialValues}
			/>
		</Box>
	);
};

CargasPublicas.propTypes = {
	onSave: PropTypes.func,
	data: PropTypes.arrayOf(PropTypes.object),
	isLoading: PropTypes.bool,
	onValidityChange: PropTypes.func,
	onValuesChange: PropTypes.func,
	isSaving: PropTypes.bool,
	jsonCarta: PropTypes.object,
	cliInfo: PropTypes.object,
	onActualizarJson: PropTypes.func,
	onSaveSuccess: PropTypes.func,
	apiMode: PropTypes.oneOf(["public", "private"]),
};

export default CargasPublicas;
