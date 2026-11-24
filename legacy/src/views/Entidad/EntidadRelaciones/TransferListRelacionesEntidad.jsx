import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import TransferListsComponent from '../../../components/Lists/TransferListsComponent';
import { CODS_ESTADOS } from '../../../constants/estados';
import { useFetchAllEntidades } from '../../../hooks/useFetchCatalog';


const TransferListRelacionesEntidad = ({
	entidad,
	onRelacionesGuardadas = () => {},
	catalogos = {
	},
	readonly = false
}) => {
	const { data } = useFetchAllEntidades(
		['catalogoEntidades'], 
		{ cod_estado: CODS_ESTADOS.ACTIVO }, 
		{}, 
		[entidad.entidad_clasificacion]
	);
	const catalogoEntidades = data?.data || [];

	const [entidadesDisponibles, setEntidadesDisponibles] = useState([]);
	const [entidadesSeleccionadas, setEntidadesSeleccionadas] = useState([]);

	// useEffect(() => {
	// 	// setEntidadesDisponibles(catalogoEntidades);
	// }, [catalogoEntidades])


	const handleGuardarRelaciones = async (entidadesDisponibles, entidadesSeleccionadas) => {
		// const relacionesPorAsignar = entidadesSeleccionadas.filter(e => !e.wasInitiallyAssigned);
		// const idsRelacionesPorAsignar = relacionesPorAsignar.map(e => e.cod_relacion);
		// const relacionesPorDesasignar = entidadesDisponibles.filter(e => e.wasInitiallyAssigned);
		// const idsRelacionesPorDesasignar = relacionesPorDesasignar.map(e => e.cod_relacion);

		// onRelacionesGuardadas(relacionesPorAsignar);
	};


	return (
		<Box display={'flex'} flexDirection='row' gap={2}>
			<TransferListsComponent
				size={12}
				tituloListaPrincipal='Entidades Disponibles'
				listaPrincipal={entidadesDisponibles}
				tituloListaSecundaria='Entidades Seleccionadas'
				listaSecundaria={entidadesSeleccionadas}
				objectLabel='label'
				objectValue='value'
				propFiltro={['nombre']}
				guardarListas={handleGuardarRelaciones}
				permitirPasarTodos={true}
				readonly={false}
				mostrarBotonGuardar={true}
			/>
		</Box>
	);
};


TransferListRelacionesEntidad.propTypes = {
	entidad: PropTypes.entidad,
	entidadesRelacionadas: PropTypes.array,
	onRelacionesGuardadas: PropTypes.func,
	catalogos: PropTypes.shape({
		relaciones: PropTypes.array
	}),
	readonly: PropTypes.bool
};


export default TransferListRelacionesEntidad
