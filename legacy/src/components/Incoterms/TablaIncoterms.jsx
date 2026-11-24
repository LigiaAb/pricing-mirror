import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types';
import { Box } from '@mui/material'
import { api } from '../../api';;
import { encryptId } from '../../api/encryptDecrypt';
import moment from 'moment/moment'
import TablaComponent from '../../components/Tabla/TablaComponent';
import ActionAlertComponent from '../../components/Dialog/ActionAlertComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';
import { CODS_ESTADOS, COLORES_ESTADOS } from '../../constants/estados';

const TablaIncoterms = ({ 
	catalogos 
}) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { permisosArray } = useObtenerOpcionesAcciones();
   const { estados } = catalogos;

    let item = permisosArray.find((i) => i.nom_opcion === 'Lista');
    const accionesDeTabla = {
        view: item?.acciones.some((i) => i.cod_accion === 1),
        delete: item?.acciones.some((i) => i.cod_accion === 4 || 5)
    };
	//console.log('array', permisosArray);
	//console.log('permisos',item?.acciones.map(a => a.cod_accion) );
	//console.log('acciones',item?.acciones.filter(a => a.cod_accion === 5) );

	const botonesDeTabla = {};
	if (item?.acciones.some((i) => i.cod_accion === 3)) {
		botonesDeTabla.add = { label: 'nuevo', color: 'primary', onClick: () => navigate(encryptId('new')) };
	};

    const [incoterms, setIncoterms] = useState([]);
    const incotermPorAnularRef = useRef(null);
    const [isOpenConfirmacionAnulacion, setIsOpenConfirmacionAnulacion] = useState(false);


	const incotermsConFomatoTabla = incoterms.map(incoterm => {
		const estado = estados.find(e => e.cod_estado === incoterm.cod_estado);
		return {
			...incoterm,
			nombreEstado: estado?.estado_desc,
			accionesDeTabla,
			propiedadesDeTabla: {
				nombreEstado: {
					color: COLORES_ESTADOS[incoterm.cod_estado]
				}
			}
		};
	}, [incoterms, estados]);


    const columnas = useMemo(() => [
        {
            label: 'Codigo',
            campo: 'codigo',
            name: 'codigo'
        },
        {
            label: 'Nombre',
            campo: 'nombre',
            name: 'nombre'
        },
        {
            label: 'Nombre en Inglés',
            campo: 'nombre_eng',
            name: 'nombre_eng'
        },
        {
            label: 'Descripción',
            campo: 'descripcion',
            name: 'descripcion'
        },
    ], []);

	
	const obtenerIncoterms = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-incoterm';
        const response = await api.get(baseApiURL);
        const incoterms = response.data.data;
        setIncoterms(incoterms);
	}, []);


    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerIncoterms(),
        ]).then(() => {
            dispatch(apagarCarga());
        });
    }, [dispatch, obtenerIncoterms]);


	const anularIncoterm = async () => {
		let baseApiURL = '/api/appweb/eliminar-incoterm';
		const incotermPorAnular = incotermPorAnularRef.current;
		
		const response = await api.post(baseApiURL, {
			//incoterm_id: incotermPorAnular.incoterm_id,
			//cod_estado: CODS_ESTADOS.INACTIVO
			...incotermPorAnular,
			cod_estado: CODS_ESTADOS.INACTIVO
		});
		if (!response.data.data.success) return;

		baseApiURL = '/api/appweb/lista-incoterm';
		const responseIncoterms = await api.get(baseApiURL);
		const incoterms = responseIncoterms.data.data;

		setIncoterms(incoterms);
	};


	const handleAnulacionIncoterm = (incoterm) => {
        incotermPorAnularRef.current = incoterm;
        setIsOpenConfirmacionAnulacion(true);
    };


	return (
		<Box display='flex' flexDirection='column' p={1} m={0} gap={2}>
			<TablaComponent
				titulo='Incoterms'	
				id='incoterm_id'
				encabezado={columnas}
				datos={incotermsConFomatoTabla}
				botones={botonesDeTabla}
				eventosDeTabla={{
					view: ({ id: incoterm_id }) => navigate(encryptId(incoterm_id)),
					delete: ({ content: incoterm }) => handleAnulacionIncoterm(incoterm)
				}}
			/>

			<ActionAlertComponent
				tipo='error'
				content='¿Esta seguro que desea eliminar el registro?'
				openDialog={isOpenConfirmacionAnulacion}
				aceptar={() => {
					anularIncoterm();
					setIsOpenConfirmacionAnulacion(false);
				}}
				cancelar={() => {
					setIsOpenConfirmacionAnulacion(false);
					incotermPorAnularRef.current = null;
				}}
				handleClose={() => {
					setIsOpenConfirmacionAnulacion(false);
					incotermPorAnularRef.current = null;
				}}
			/>
		</Box>
	);
};


TablaIncoterms.propTypes = {
	catalogos: PropTypes.object.isRequired
};


export default TablaIncoterms;