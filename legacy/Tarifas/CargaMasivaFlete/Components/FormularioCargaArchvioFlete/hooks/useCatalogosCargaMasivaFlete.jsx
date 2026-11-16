import { useState, useEffect } from 'react';
import { api } from '../../../../../../api';
import { CODS_ESTADOS } from '../../../../../../constants/estados';

const useCatalogosCargaMasivaFlete = ({
	empresas,
	centrosCostos,
	rubros,
}) => {
	const ensureArray = (val) => Array.isArray(val) ? val : [];
	const [catalogos, setCatalogos] = useState({
		empresas: ensureArray(empresas),
		centrosCostos: ensureArray(centrosCostos),
		rubros: ensureArray(rubros),
	});
	const [isLoading, setIsLoading] = useState(false);


	const obtenerEmpresas = async (empresasProvistas = []) => {
		if (empresasProvistas.length) return empresasProvistas;
		const baseApiURL = '/api/appweb/listaempresas';
		const response = await api.get(baseApiURL, { params: { cod_estado: CODS_ESTADOS.ACTIVO } });
		let empresas = response.data.data;
		empresas = empresas.map(e => ({ ...e, label: e.nombre_emp, value: e.cod_empresa }));
		return empresas;
	};


	const obtenerCentrosCostos = async (centrosCostosProvistos = []) => {
		if (centrosCostosProvistos.length) return centrosCostosProvistos;
		const baseApiURL = '/api/appweb/listacentrocosto';
		const response = await api.get(baseApiURL);
		let centrosCostos = response.data.data;
		centrosCostos = centrosCostos.map(e => ({ ...e, label: e.nombre_cc, value: e.cod_cc }));
		return centrosCostos;
	};


	const obtenerRubros = async (rubrosProvistos = []) => {
		if (rubrosProvistos.length) return rubrosProvistos;
		const baseApiURL = '/api/appweb/lista-rubros';
		const response = await api.get(baseApiURL);
		let rubros = response.data.data;
		rubros = rubros.map(r => ({ ...r, label: r.nombre, value: r.cod_rubro }));
		return rubros;
	};

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const [empresas, centrosCostos, rubros] = await Promise.all([
					obtenerEmpresas(catalogos.empresas),
					obtenerCentrosCostos(catalogos.centrosCostos),
					obtenerRubros(catalogos.rubros)
				]);

				setCatalogos({
					empresas,
					centrosCostos,
					rubros
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

export default useCatalogosCargaMasivaFlete;
