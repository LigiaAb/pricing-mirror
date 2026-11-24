import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Icon } from '@mui/material';
import { api } from '../../api';
import { decryptId } from '../../api/encryptDecrypt';
import TabComponent from '../../components/Tabs/TabComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import FormularioIncoterm from '../../components/Incoterms/FormularioIncoterm';
import { useDispatch } from 'react-redux';
import { encenderCarga, apagarCarga } from '../../store/slices/status/statusSlice';


const VistaIncoterm = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { encryptedId } = useParams();
    const [incoterm_id, setCodIncoterm] = useState(decryptId(encryptedId));
    const { catalogoArray: opcionesIncoterms } = useObtenerOpcionesAcciones();

    const isItCreating = incoterm_id === 'new';
    const isItEditing = !isItCreating;

    const [incoterm, setIncoterm] = useState(null);
    const [catalogos, setCatalogos] = useState({
        estados: []
    });

	const obtenerIncoterm = useCallback(async () => {
		const baseApiURL = '/api/appweb/lista-incoterm';
		const response = await api.get(baseApiURL, { params: { incoterm_id } });
		const incoterm = response.data.data[0] || null;
		return incoterm;
	}, [incoterm_id]);

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        let estados = response.data.data;
        estados = estados.map(e => ({ ...e, label: e.estado_desc, value: e.cod_estado }));
        return estados;
    }, []);


	useEffect(() => {
		const obtenerDatosIniciales = async () => {
			dispatch(encenderCarga());
			try {
				const [estados] = await Promise.all([
					obtenerEstados(),
				]);
				
				setCatalogos({
					estados
				});

				if (isItEditing) {
					const incoterm = await obtenerIncoterm();
					setIncoterm(incoterm);
				}
			} catch (error) {
				console.error(error);
			} finally {
				dispatch(apagarCarga());
			}
		};

		obtenerDatosIniciales();
	}, [dispatch, isItEditing, obtenerIncoterm, obtenerEstados]);


	const opcionesIncotermsConFormato = opcionesIncoterms?.map((o) => {
		const opcionConFormato = {
			...o,
			id: o.cod_opcion,
			label: o.nom_opcion,
			icono: o.ico_opcion,
			disabled: isItCreating && o.nom_opcion !== 'Información',
		};
	
		let content;
		switch (o.nom_opcion) {
			case 'Información':
				content = (
					<FormularioIncoterm
						defaultValues={isItEditing ? incoterm : null}
						isItCreating={isItCreating}
						onIncotermCreado={incoterm => setCodIncoterm(incoterm.incoterm_id)}
						onIncotermEditado={incoterm => setIncoterm(incoterm)}
						catalogos={catalogos}
					/>
				)
				break;
			default:
				content = <></>
				break;
		}
		opcionConFormato.content = content;
	
		return opcionConFormato;
	}).filter((o) => o.nivel_opcion === 'I');

	const codigoOpcionInicial = opcionesIncotermsConFormato[0]?.id || null;


	return (
		<Box>
			<Button color='primary' sx={{ mb: 2 }} onClick={() => navigate(-1)}>
				<Icon className='c-derecha-arriba-izquierda' sx={{mr: 2}}/>
				Regresar a la lista
			</Button>
			
			<TabComponent
				opciones={opcionesIncotermsConFormato}
				tabInicial={codigoOpcionInicial}
			/>
		</Box>
	);
};


export default VistaIncoterm;