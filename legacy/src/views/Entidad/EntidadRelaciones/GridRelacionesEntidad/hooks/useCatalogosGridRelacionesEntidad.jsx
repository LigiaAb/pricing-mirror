
import { useState, useEffect } from 'react';
import { api } from '../../../../../api';

const useCatalogosGridRelacionesEntidad = ({
	tiposRelacionEntidad = [],
	estados = []
}) => {
	const ensureArray = (val) => Array.isArray(val) ? val : [];
	const [catalogos, setCatalogos] = useState({
		tiposRelacionEntidad: ensureArray(tiposRelacionEntidad),
		estados: ensureArray(estados)
	});
	const [isLoading, setIsLoading] = useState(false);


	const obtenerTiposRelacionEntidad = async (tiposRelacionEntidadProvistos) => {
		if (tiposRelacionEntidadProvistos.length) return tiposRelacionEntidadProvistos;
		const baseApiURL = '/api/appweb/lista-tipo';
		const response = await api.get(baseApiURL, { params: { tipo_tabla: 'ENTIDAD_RELACION' } });
		let tiposRelacionEntidad = response.data.data;
		tiposRelacionEntidad = tiposRelacionEntidad.map(e => ({ ...e, label: e.nom_tipo, value: e.cod_tipo }));
		return tiposRelacionEntidad;
	};


	const obtenerEstados = async (estadosProvistos) => {
		if (estadosProvistos.length) return estadosProvistos;
		const baseApiURL = '/api/appweb/listaestados';
		const response = await api.get(baseApiURL);
		let estados = response.data.data;
		estados = estados.map(e => ({ ...e, label: e.estado_desc, value: e.cod_estado }));
		return estados;
	};


	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const [tiposRelacionEntidad, estados] = await Promise.all([
					obtenerTiposRelacionEntidad(catalogos.tiposRelacionEntidad),
					obtenerEstados(catalogos.estados)
				]);

				setCatalogos({
					tiposRelacionEntidad,
					estados
				});
			} catch (error) {
				console.log(error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);



	return {
		...catalogos,
		isLoading,
	};
};

export default useCatalogosGridRelacionesEntidad;
