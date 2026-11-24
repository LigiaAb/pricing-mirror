import { useState, useRef, useEffect, useCallback, useMemo} from 'react';
import { Box, Button, Typography, Icon } from '@mui/material';
import { api } from '../../../api';
import FormularioTarifasPorRangosPrestablecidos from './components/FormularioTarifasPorRangosPrestablecidos/FormularioTarifasPorRangosPrestablecidos';
import AcordeonComponent from '../../../components/AcordeonComponent/AcordeonComponent';
import TabComponent from '../../../components/Tabs/TabComponent';
import obtenerTarifasConRutas from './services/obtenerTarifasConRutas';
import ListaGridRangosPorPorveedor from './components/ListaGridRangosPorProveedor/ListaGridRangosPorPorveedor';
import LoaderComponent from '../../../components/Loader/LoaderComponent';


const TarifasPorRangosPrestablecidos = () => {
	const formularioFiltroTarifasPorRangosRef = useRef(null)
	const [isAcordeonFiltroTarifasExpanded, setIsAcordeonFiltroTarifasExpanded] = useState(true);
	const [isLoadingRangosPorRubros, setIsLoadingRangosPorRubros] = useState(false);
	const [tarifas, setTarifas] = useState([]);

	const [rubros, setRubros] = useState([]);

	const tarifasPorCodRubros = tarifas.reduce((acc, tarifa) => {
		const key = +tarifa.cod_rubro;
		if (!acc[key]) {
			acc[key] = [];
		}
		acc[key].push(tarifa);
		return acc;
	}, {});



	const opcionesTarifas = useMemo(() => {
		return Object.keys(tarifasPorCodRubros).map(codRubro => {
			const tarifasDelRubro = tarifasPorCodRubros[codRubro];
			const rubro = rubros.find(r => r.cod_rubro === +codRubro);
			return {
				id: codRubro,
				label: rubro?.label,
				content: (
					<ListaGridRangosPorPorveedor
						tarifasConRutas={tarifasDelRubro}
					/>
				),
				disabled: false,
			};
		});
	}, [tarifasPorCodRubros, rubros]);


	const handleFiltrado = async (filtros) => {
		const tarifasConRutas = await obtenerTarifasConRutas(filtros);
		setTarifas(tarifasConRutas);
	};


	const obtenerRubros = useCallback(async (rubrosProvistos = []) => {
        if (rubrosProvistos.length) return rubrosProvistos;
        const baseApiURL = '/api/appweb/lista-rubros';
        const response = await api.get(baseApiURL);
        let rubros = response.data.data;
        rubros = rubros.map(r => ({ ...r, label: r.nombre, value: r.cod_rubro }));
        return rubros;
    }, []);


	useEffect(() => {
		const fetchData = async () => {
			try {
				const rubros = await obtenerRubros();
				setRubros(rubros);
			} catch (error) {
				console.error('Error fetching tarifas:', error);
			}
		};

		fetchData();
	}, [obtenerRubros]);


	return (
		<Box display='flex' flexDirection='column' gap={3}>
			<AcordeonComponent
				expandido={isAcordeonFiltroTarifasExpanded}
				expandir={() => setIsAcordeonFiltroTarifasExpanded(!isAcordeonFiltroTarifasExpanded)}
				titulo={
					<Box display='flex' justifyContent='space-between' p={0.8} width={'100%'}>
						<Typography variant='h6'>Filtros de Grupos de Tarifas</Typography>
						<Icon className={isAcordeonFiltroTarifasExpanded ? 'c-arriba-simple' : 'c-abajo-simple'} />
					</Box>
				}
				cuerpo={
					<Box display='flex' flexDirection='column' gap={1}>
						<FormularioTarifasPorRangosPrestablecidos
							ref={formularioFiltroTarifasPorRangosRef}
							usarAccionesPrestablecidas={false}
							isItCreating={false}
							inputsToHide={['servicio_interno']}
							onSubmit={handleFiltrado}
						/>


						<Button
							variant='contained'
							color='primary'
							onClick={async () => {
								setIsLoadingRangosPorRubros(true);
								await formularioFiltroTarifasPorRangosRef?.current.submit();
								setIsLoadingRangosPorRubros(false);
							}}
							sx={{
								width: 'fit-content',
								alignSelf: 'flex-end',

							}}
						>
							Filtrar
						</Button>
					</Box>
				}
			/>

			{
				isLoadingRangosPorRubros ? (
					<Box display='flex' justifyContent='center' alignItems='center' height='100px'>
						<LoaderComponent sx={{ position: 'block' }} texto='Cargando...' />
					</Box>
				) : (
					<>
						{
							tarifas.length === 0 ? (
								<Typography variant='h6' color='textSecondary' align='center'>
									No se encontraron datos con los filtros aplicados.
								</Typography>
							) : (
								<Box sx={{ width: '100%' }}>
									<TabComponent
										opciones={opcionesTarifas}
									/>
								</Box>
							)
						}
					</>

				)
			}
		</Box>
	);
};

export default TarifasPorRangosPrestablecidos;
