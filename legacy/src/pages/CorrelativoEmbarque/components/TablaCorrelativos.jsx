import { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, IconButton, Icon } from "@mui/material";
import LoaderComponent from "../../../components/Loader/LoaderComponent";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import { useFetchCorrelativoGuias } from "../../../hooks/Bpm";

const TablaCorrelativos = ({ datos: datosProp = undefined, titulo = "Correlativos", isLoading: isLoadingProp = false, onView = () => { }, onEdit = () => { }, onDelete = () => { }, tipoFilter = null, acciones: accionesProp = {}, ocultarColumnas = [], filtrarInicialNull = false, filtrarInicialNoNull = false, onSelection = () => { }, checkboxSelection = false }) => {
	const [selectedTipo, setSelectedTipo] = useState(() => {
		if (Array.isArray(tipoFilter)) return 'ALL';
		return tipoFilter ?? '';
	});

	useEffect(() => {
		if (Array.isArray(tipoFilter)) setSelectedTipo('ALL');
		else setSelectedTipo(tipoFilter ?? '');
	}, [tipoFilter]);

	const tipoOptions = Array.isArray(tipoFilter) ? Array.from(new Set(tipoFilter.map((v) => String(v).toUpperCase().trim()))) : null;

	// Solo hacer fetch si datosProp es undefined (no pasado), no si es array vacío
	const shouldFetch = datosProp === undefined;
	const { data: datosApi = [], isLoading: isLoadingHook, refetch } = useFetchCorrelativoGuias({ enabled: shouldFetch });
	const loading = isLoadingProp || (shouldFetch && isLoadingHook);

	const datos = useMemo(() => {
		// Si se pasó datosProp (incluso array vacío), usar solo eso
		let base;
		if (datosProp === undefined) {
			base = datosApi;
		} else {
			base = datosProp;
		}
		let mapped = (Array.isArray(base) ? base : []).map((i) => ({

			...i,
			id: i.correlativoId,
			correlativoFecha: i.correlativoFecha ? new Date(i.correlativoFecha) : null,
			correlativoFechaVencimiento: i.correlativoFechaVencimiento ? new Date(i.correlativoFechaVencimiento) : null,
			replicarAnual: i.replicarAnual ? (String(i.replicarAnual).toUpperCase() === "S") : false,
		}));

		let effectiveFilterValues = null;
		if (Array.isArray(tipoFilter)) {
			if (selectedTipo && selectedTipo !== 'ALL') {
				effectiveFilterValues = [String(selectedTipo).toUpperCase().trim()];
			} else {
				effectiveFilterValues = tipoOptions;
			}
		} else if (tipoFilter) {
			effectiveFilterValues = [String(tipoFilter).toUpperCase().trim()];
		}

		if (effectiveFilterValues) {
			const filterValues = Array.isArray(effectiveFilterValues)
				? effectiveFilterValues.map((v) => String(v).toUpperCase().trim())
				: [String(effectiveFilterValues).toUpperCase().trim()];
			mapped = mapped.filter((it) => {
				const t = (it.tipoDescripcion || it.nomTipo || it.tipo || it.tipo_descripcion || "").toString().toUpperCase().trim();
				return filterValues.includes(t);
			});
		}
		if (filtrarInicialNull) {
			mapped = mapped.filter((m) => {
				const inicial = m.correlativoInicial ?? m.correlativo_inicial ?? m.CORRELATIVO_INICIAL ?? m.CORRELATIVOINICIAL;
				return inicial === null || inicial === undefined;
			});
		}

		if (filtrarInicialNoNull) {
			mapped = mapped.filter((m) => {
				const inicial = m.correlativoInicial ?? m.correlativo_inicial ?? m.CORRELATIVO_INICIAL ?? m.CORRELATIVOINICIAL;
				return inicial !== null && inicial !== undefined && `${inicial}`.trim() !== "";
			});
		}

		return mapped;
	}, [datosProp, datosApi, tipoFilter, filtrarInicialNull, filtrarInicialNoNull, selectedTipo, tipoOptions]);

	const columnas = useMemo(() => {
		return [
			{ field: "correlativoId", headerName: "ID", width: 65 },
			{ field: "correlativoCodigo", headerName: "Código", width: 150 },
			{ field: "correlativoTabla", headerName: "Tabla", width: 200 },
			{ field: "correlativoSerie", headerName: "Serie", width: 80 },
			{ field: "entidadNombre", headerName: "Entidad", width: 180 },
			{ field: "correlativoActual", headerName: "Actual", width: 100, type: "number" },
			{ field: "correlativoInicial", headerName: "Inicial", width: 100, type: "number" },
			{ field: "correlativoFinal", headerName: "Final", width: 100, type: "number" },
			{ field: "cencodNombre", headerName: "Centro Costo", width: 130 },
			{ field: "empresaNombre", headerName: "Empresa", width: 140 },
			{ field: "tipoDescripcion", headerName: "Tipo", width: 100 },
			{ field: "estadoDescripcion", headerName: "Estado", width: 100 },
			{ field: "correlativoFechaVencimiento", headerName: "Vencimiento", width: 100, type: "date" },
			{ field: "replicarAnual", headerName: "Replicar Anual", width: 120, type: "checkbox" },
			{ field: "cantidadSalto", headerName: "Salto", width: 60, type: "number" },
		].filter(c => !ocultarColumnas.includes(c.field));
	}, [ocultarColumnas]);

	const acciones = useMemo(() => {
		const defaults = { ver: true, editar: false, eliminar: false, copiar: false, pegar: false, guardar: false, agregar: false };
		return { ...defaults, ...accionesProp };
	}, [accionesProp]);
	const handleView = (row) => {
		if (typeof onView === "function") {
			onView(row);
		} else if (typeof onEdit === "function") {
			onEdit(row);
		}
	};

	const handleEdit = (row) => {
		if (typeof onEdit === "function") {
			onEdit(row);
		} else if (typeof onView === "function") {
			onView(row);
		}
	};

	const handleDelete = ({ row }) => {
		onDelete(row);
	};

	const [selectedRows, setSelectedRows] = useState([]);

	useEffect(() => {
		if (typeof onSelection === "function") onSelection(selectedRows);
	}, [selectedRows, onSelection]);

	const handleSelectionModelChange = (ids) => {
		const arr = Array.isArray(ids) ? ids : [ids];
		const rowsSelected = datos.filter((d) => arr.includes(d.correlativoId));
		setSelectedRows(rowsSelected);
	};

	return (
		<Box sx={{ p: 1 }}>
			<Typography variant="h6" sx={{ mb: 1 }}>
				{titulo}
			</Typography>
			{Array.isArray(tipoFilter) && tipoOptions && (
				<Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
					<FormControl size="small" sx={{ minWidth: 160 }}>
						<InputLabel id="tipoFilterLabel">Tipo</InputLabel>
						<Select
							labelId="tipoFilterLabel"
							id="tipoFilter"
							value={selectedTipo}
							label="Tipo"
							onChange={(e) => setSelectedTipo(e.target.value)}
						>
							<MenuItem value={'ALL'}>Todos</MenuItem>
							{tipoOptions.map((opt) => (
								<MenuItem key={opt} value={opt}>{opt}</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
			)}
			<Paper variant="outlined" sx={{ p: 1, position: 'relative' }}>
				<Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
					<IconButton
						aria-label="Refrescar"
						onClick={() => refetch?.()}
						disabled={!shouldFetch || loading}
					>
						<Icon className="c-actualizar" />
					</IconButton>
				</Box>
				{loading && datos.length === 0 ? (
					<LoaderComponent open mostrarTexto={false} />) : (
					<EditableDataGridComponent
						idKey="correlativoId"
						encabezados={columnas}
						datos={datos}
						acciones={acciones}
						onEdditRow={(r) => handleEdit(r?.row || r)}
						checkboxSelection={checkboxSelection}
						onSelectionModelChange={handleSelectionModelChange}
						onDeleteRow={handleDelete}
						filaSeleccionada={(row) => handleView(row)}
						botones={{}}
					/>
				)}
			</Paper>
		</Box>
	);
};

TablaCorrelativos.propTypes = {
	datos: PropTypes.array,
	titulo: PropTypes.string,
	isLoading: PropTypes.bool,
	onEdit: PropTypes.func,
	acciones: PropTypes.object,
	onView: PropTypes.func,
	onDelete: PropTypes.func,
	tipoFilter: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
	ocultarColumnas: PropTypes.arrayOf(PropTypes.string),
	filtrarInicialNull: PropTypes.bool,
	filtrarInicialNoNull: PropTypes.bool,
	onSelection: PropTypes.func,
	checkboxSelection: PropTypes.bool,
};

export default TablaCorrelativos;
