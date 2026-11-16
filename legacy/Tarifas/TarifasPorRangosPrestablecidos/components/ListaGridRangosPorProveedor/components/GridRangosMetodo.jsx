
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { api } from '../../../../../../api';
import PropTypes from 'prop-types';
import EditableDataGridComponent from '../../../../../../components/Tabla/EditableDataGridComponent';
import useObtenerOpcionesAcciones from '../../../../../../hooks/useObtenerOpcionesAcciones';
import LoaderComponent from '../../../../../../components/Loader/LoaderComponent';
import { apagarCarga, encenderCarga } from '../../../../../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';

const GridRangosMetodo = ({
	cod_metodo,
	catalogos = {
		estados: [],
	}
}) => {
    cod_metodo = +cod_metodo;
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();
    const { estados } = catalogos;

	const [listaAProcesar, setListaAProcesar] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

	const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };

    const obtenerAccionesSegunPermisos = () => {
        let item = permisosArray.find((i) => i.nom_opcion === 'Lista');
        return {
          ...permisosBase,
          agregar: item?.acciones.some((i) => i.cod_accion === 3),
          editar: item?.acciones.some((i) => i.cod_accion === 2),
          guardar: item?.acciones.some((i) => i.cod_accion === 2),
          eliminar: item?.acciones.some((i) => i.cod_accion === 5),
        };
    };

    const filasConFormatoUI = listaAProcesar.map(nombreRubro => {
        const estado = nombreRubro.estado || estados.find(e => e.cod_estado === nombreRubro.cod_estado);
        return {
            ...nombreRubro,
            estado
        };
    });



	return (
		<Box>
			Grid Rangos de Metodo
		</Box>
	);
};


GridRangosMetodo.propTypes = {
	cod_metodo: PropTypes.isRequired,
	catalogos: PropTypes.object.isRequired
};


export default GridRangosMetodo;
