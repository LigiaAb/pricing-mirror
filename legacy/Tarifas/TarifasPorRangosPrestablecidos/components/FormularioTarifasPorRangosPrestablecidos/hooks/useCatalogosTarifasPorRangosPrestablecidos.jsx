
import { useState, useEffect } from 'react';
import { api } from '../../../../../../api';

const useCatalogosTarifasPorRangosPrestablecidos = ({
	paises = [],
	tiposPuntoEnlace = [],
	puntosEnlace = [],
}) => {

	const ensureArray = (val) => Array.isArray(val) ? val : [];
	const [catalogos, setCatalogos] = useState({
		paises: ensureArray(paises),
		tiposPuntoEnlace: ensureArray(tiposPuntoEnlace),
		puntosEnlace: ensureArray(puntosEnlace),
	});

	const [isLoading, setIsLoading] = useState(false);


	const obtenerPaises = async (paisesProvistos) => {
		if (paisesProvistos.length) return paisesProvistos;
        const baseApiURL = '/api/appweb/listapaises';
        const response = await api.get(baseApiURL);
        let paises = response.data.data;
        paises = paises.map(p => ({ ...p, label: p.nombre_pais, value: p.cod_pais }));
        return paises;
	};

	
	const obtenerTiposPuntoEnlace = async (tiposPuntoEnlaceProvistos) => {
		if (tiposPuntoEnlaceProvistos.length) return tiposPuntoEnlaceProvistos;
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL, { params: { tipo_tabla: 'PUNTO_ENLACE' } });
        let tiposPuntoEnlace = response.data.data;
        tiposPuntoEnlace = tiposPuntoEnlace.map(tpe => ({ ...tpe, label: tpe.nom_tipo, value: tpe.cod_tipo }));
        return tiposPuntoEnlace;
	};


	const obtenerPuntosEnlace = async (puntosEnlaceProvistos) => {
		if (puntosEnlaceProvistos.length) return puntosEnlaceProvistos;
		const baseApiURL = '/api/appweb/lista-punto_enlace';
		const response = await api.get(baseApiURL);
		let puntosEnlace = response.data.data;
		puntosEnlace = puntosEnlace.map(pe => ({ ...pe, label: pe.nombre, value: pe.cod_puntoenlace }));
		return puntosEnlace;
	};


	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const [paises, tiposPuntoEnlace, puntosEnlace] = await Promise.all([
					obtenerPaises(catalogos.paises),
					obtenerTiposPuntoEnlace(catalogos.tiposPuntoEnlace),
					obtenerPuntosEnlace(catalogos.puntosEnlace)
				]);

				setCatalogos({
					paises,
					tiposPuntoEnlace,
					puntosEnlace
				});
			} catch (error) {
				console.error('Error fetching catalogos:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	
	return {
		...catalogos,
		isLoading
	};
};


export default useCatalogosTarifasPorRangosPrestablecidos;