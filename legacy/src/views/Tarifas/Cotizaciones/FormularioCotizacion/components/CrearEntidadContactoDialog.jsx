import { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { api } from '../../../../../api';
import DialogComponent from '../../../../../components/Dialog/DialogComponent';
import FormularioCompletoEntidadContactos from '../../../../Entidad/EntidadContactos/FormularioCompletoEntidadContactos';


const CrearEntidadContactoDialog = ({
	isOpen,
	setIsOpen,
	entidad_id,
	onContactoEntidadCreado = () => {}
}) => {
	const [catalogosEntidadConctos, setCatalogosEntidadConctos] = useState({
		empresas: [],
		cencos: [],
		tratamientos: [],
		temperamentos: [],
		tipos: [],
	});


	const obtenerEmpresas = useCallback(async () => {
		const baseApiURL = '/api/appweb/listaempresas';
		const response = await api.get(baseApiURL);
		let empresas = response.data.data;
		empresas = empresas.map(m => ({ ...m, label: m.nombre_emp, value: m.cod_empresa }));
		return empresas;
	}, []);

    const obtenerCentrosCostos = useCallback(async () => {
        const baseApiURL = '/api/appweb/listacentrocosto';
        const response = await api.get(baseApiURL);
        let centrosCostos = response.data.data;
        centrosCostos = centrosCostos.map(e => ({ ...e, label: e.nombre_cc, value: e.cod_cc }));
        return centrosCostos;
    }, []);

	const obtenerTratamientos = useCallback(async () => {
		const baseApiURL = '/api/appweb/lista-tratamiento';
		const response = await api.get(baseApiURL);
		let tratamientos = response.data.data;
		tratamientos = tratamientos.map(t => ({ ...t, label: t.tratamiento_descripcion, value: t.tratamiento_id }));
		return tratamientos;
	}, []);

	const obtenerTemperamentos = useCallback(async () => {
		const baseApiURL = '/api/appweb/lista-temperamento';
		const response = await api.get(baseApiURL);
		let temperamentos = response.data.data;
		temperamentos = temperamentos.map(t => ({ ...t, label: t.temperamento_descripcion, value: t.temperamento_id }));
		return temperamentos;
	}, []);

	const obtenerTipos = useCallback(async () => {
		const baseApiURL = '/api/appweb/lista-tipo';
		const response = await api.get(baseApiURL);
		let tipos = response.data.data;
		tipos = tipos.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
		return tipos;
	}, []);


	useEffect(() => {
		const fetchCatalogos = async () => {
			try {
				const [empresas, cencos, tratamientos, temperamentos, tipos] = await Promise.all([
					obtenerEmpresas(),
					obtenerCentrosCostos(),
					obtenerTratamientos(),
					obtenerTemperamentos(),
					obtenerTipos(),
				]);

				setCatalogosEntidadConctos({
					empresas,
					cencos,
					tratamientos,
					temperamentos,
					tipos
				});
			} catch (error) {
				console.error('Error fetching catalogos:', error);
			}
		};

		fetchCatalogos();
	}, [
		obtenerEmpresas,
		obtenerCentrosCostos,
		obtenerTratamientos,
		obtenerTemperamentos,
		obtenerTipos
	]);


	const handleContactoEntidadCreado = (contacto) => {
		contacto.label = `${contacto.entidadcontacto_nombre} - ${contacto.entidadcontacto_email}`;
		contacto.value = contacto.entidadcontacto_id;
		onContactoEntidadCreado(contacto);
		setIsOpen(false);
	};


	return (
		<DialogComponent
			titulo='Crear Contacto de Entidad'
			openDialog={isOpen}
			handleClose={() => setIsOpen(false)}
			width='80vw'
			height='85vh'
		>
			<FormularioCompletoEntidadContactos
				id='new'
				cliente={{
					entidad_id: entidad_id || null
				}}
				catalogos={catalogosEntidadConctos}
				onCreate={handleContactoEntidadCreado}
			/>
		</DialogComponent>
	);
};


CrearEntidadContactoDialog.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	entidad_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.oneOf([null])]),
	onContactoEntidadCreado: PropTypes.func
};


export default CrearEntidadContactoDialog;
