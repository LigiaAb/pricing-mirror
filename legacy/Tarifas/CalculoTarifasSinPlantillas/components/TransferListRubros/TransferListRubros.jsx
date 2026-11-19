import React, { useEffect, useState } from 'react';
import { Box, Tooltip, IconButton, Icon } from '@mui/material';
import PropTypes from 'prop-types';
import { api } from '../../../../../api';
import TransferListsComponent from '../../../../Lists/TransferListsComponent';
import DialogComponent from '../../../../Dialog/DialogComponent';
import FormularioCriterios from '../FormularioCriterios/FormularioCriterios';
import { CODS_ESTADOS } from '../../../../../constants/estados';
import { set } from 'date-fns';

const TransferListRubros = ({
	rubrosSeleccionables = [],
	onRubrosGuardados = () => {},
	catalogos = {
		rubros: []
	},
	readonly = false
}) => {
    const enabled = true;
    const { rubros: catalogoRubros = [] } = catalogos;

	const [rubrosDisponibles, setRubrosDisponibles] = useState([]);
	const [rubrosSeleccionados, setRubrosSeleccionados] = useState([]);
	const [isOpenDialogCriterios, setIsOpenDialogCriterios] = useState(false);

	useEffect(() => {
		const rubrosActivos = catalogoRubros.filter(r => r.cod_estado === CODS_ESTADOS.ACTIVO);
		const rubrosConFormato = rubrosActivos.map(r => ({ 
			...r,
			label: r.nombre,
			value: r.cod_rubro,
			wasInitiallyAssigned: false
		}));
		setRubrosDisponibles(rubrosConFormato);
	}, [catalogoRubros])


	const handleGuardarRubros = async (rubrosDisponibles, rubrosSeleccionados) => {
		const rubrosPorAsignar = rubrosSeleccionados.filter(r => !r.wasInitiallyAssigned);
		const idsRubrosPorAsignar = rubrosPorAsignar.map(r => r.cod_rubro);
		const rubrosPorDesasignar = rubrosDisponibles.filter(r => r.wasInitiallyAssigned);
		const idsRubrosPorDesasignar = rubrosPorDesasignar.map(r => r.cod_rubro);
		// const baseApiURL = '/api/appweb/asignacion-masiva-grupos-rubros';
		// await api.post(baseApiURL, {
		// 	cod_grupo_rubro: grupo.cod_grupo_rubro,
		// 	asignaciones: idsRubrosPorAsignar,
		// 	anuladas: idsRubrosPorDesasignar
		// });
		onRubrosGuardados(rubrosPorAsignar);
	};
	

	return (
		<Box display={'flex'} flexDirection='row' gap={2}>
			<TransferListsComponent
				size={12}
				tituloListaPrincipal='Rubros Disponibles'
				listaPrincipal={rubrosSeleccionables}
				tituloListaSecundaria='Rubros Seleccionados'
				listaSecundaria={rubrosSeleccionados}
				objectLabel='label'
				objectValue='value'
				propFiltro={['nombre']}
				guardarListas={handleGuardarRubros}
				permitirPasarTodos={true}
				readonly={false}
				mostrarBotonGuardar={true}
			/>
		</Box>
	);
};


TransferListRubros.propTypes = {
	rubrosSeleccionables: PropTypes.array,
	onRubrosGuardados: PropTypes.func,
	catalogos: PropTypes.shape({
		rubros: PropTypes.array
	}),
	readonly: PropTypes.bool
};


export default TransferListRubros;