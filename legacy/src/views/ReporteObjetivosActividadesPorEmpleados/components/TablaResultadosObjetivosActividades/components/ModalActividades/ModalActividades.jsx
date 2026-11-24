import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { api } from '../../../../../../api';
import DialogComponent from '../../../../../../components/Dialog/DialogComponent';
import { TablaActividades } from '../../../../../Actividades/TablaActividades';
import { useDispatch } from 'react-redux';
import { encenderCarga, apagarCarga } from '../../../../../../store/slices/status/statusSlice';
import { useFetchAllEntidades } from '../../../../../../hooks/Fetch/useFetchEntidades';
import { CODS_ESTADOS } from '../../../../../../constants/estados';
import { encryptId } from '../../../../../../api/encryptDecrypt';


const ModalActividades = ({
	isOpen,
	setIsOpen,
	actividades = []
}) => {
	const dispatch = useDispatch();

	const [isLoading, setIsLoading] = useState(false);
	const [catalogos, setCatalogos] = useState({
		tiposActividad: [],
		empleados: [],
		estados: []
	});

	const { data } = useFetchAllEntidades(
		['catalogoEntidades'], 
		{ cod_estado: CODS_ESTADOS.ACTIVO }, 
		{}, 
		['CLIENTE', 'PRE-CLIENTE']
	);
	const catalogoEntidades = data?.data || [];


	const obtenerTiposActividad = useCallback(async () => {
		const baseApiURL = '/api/appweb/lista-tipo';
		const response = await api.get(baseApiURL, {  params: { tipo_tabla: 'ACTIVIDAD' } });
		let tiposActividad = response.data.data;
		tiposActividad = tiposActividad.map(e => ({ ...e, label: e.nom_tipo, value: e.cod_tipo }));
		return tiposActividad;
	}, []);


	const obtenerEmpleados = useCallback(async () => {
		const baseApiURL = 'api/appweb/listaemp-usu-puesto';
		const response = await api.get(baseApiURL);
		let empleados = response.data.data;
		empleados = empleados.map(e => ({ ...e, label: e.nom_empleado, value: e.cod_empleado}));
		return empleados;
	}, []);

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        let estados = response.data.data;
        estados = estados.map(e => ({ ...e, label: e.estado_desc, value: e.cod_estado }));
        return estados;
    }, []);


	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			dispatch(encenderCarga());

			try {
				const [tiposActividad, empleados, estados] = await Promise.all([
					obtenerTiposActividad(),
					obtenerEmpleados(),
					obtenerEstados()
				]);

				setCatalogos({
					tiposActividad,
					empleados,
					estados
				});
			} catch (error) {
				console.error('Error al obtener datos:', error);
			} finally {
				setIsLoading(false);
				dispatch(apagarCarga());
			}
		};

		fetchData();
	}, [dispatch, obtenerTiposActividad, obtenerEmpleados, obtenerEstados]);


	const actividadConFormatoTabla = actividades.map(actividad => {
		const tipoActividad = catalogos.tiposActividad?.find(t => t.cod_tipo === actividad.cod_tipo);
		const asesor = catalogos.empleados?.find(e => e.cod_usuario === actividad.cod_asesor);
		const cliente = catalogoEntidades.find(e => e.entidad_id === actividad.entidad_id);
		const estado = catalogos.estados?.find(e => e.cod_estado === actividad.cod_estado);
		return {
			...actividad,
			nom_tipo: tipoActividad.nom_tipo,
			asesor: `${asesor.nom_empleado} ${asesor.apellido_emp}`,
			fecha_programada_locale: new Date(actividad.fecha_programada).toLocaleString(),
			cliente_desc: cliente?.entidad_nombre,
			estado_desc: estado.estado_desc,
			url: `/crm/calendario/actividad/${encryptId(actividad.cod_actividad)}`,
			accionesDeTabla: {
				go: true
			},
		};
	});

	
	return (
		<DialogComponent
			titulo='Actividades'
			openDialog={isOpen}
			handleClose={() => setIsOpen(false)}
			width='80vw'
			height='85vh'
		>
			<TablaActividades
				datos={actividadConFormatoTabla}
				reportes={true}
				catalogos={{
					...catalogos,
					entidades: catalogoEntidades
				}}
			/>
		</DialogComponent>
	);
};


ModalActividades.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	actividades: PropTypes.array
};


export default ModalActividades;
