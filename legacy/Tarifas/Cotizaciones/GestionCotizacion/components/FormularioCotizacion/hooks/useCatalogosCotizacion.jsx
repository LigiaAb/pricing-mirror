import { useState, useEffect } from 'react';
import useFetchersCatalogosCotizacion from './useFetchersCatalogosCotizacion';
import { useFetchAllEntidades } from '../../../../../hooks/Fetch/useFetchEntidades';
import { CODS_ESTADOS } from '../../../../../constants/estados';
import { CODS_TIPOS_ENTIDAD, NOMBRES_TIPOS_ENTIDAD } from '../../../../../constants/tiposEntidades';


const useCatalogosCotizacion = ({
		empresas = [],
        centrosCostos = [],
        rubros = [],
        tiposServicio = [],
        tiposTransporte = [],
        tiposAplicacion = [],
        proveedores = [],
        tiposCalculo = [],
        estados = [],
        tiposTarifa = [],
        tiposMetodo = [],
        tiposCarga = [],
        clasificacionesCarga = [],
        incoterms = [],
        tiposPago = [],
		paises = [],
		tiposPuntoEnlace = [],
		puntosEnlace = [],
		monedas = [],
		carriers = [],
		tiposSeguimiento = []
}) => {
    const {
		obtenerRubros,
		obtenerEmpresas,
		obtenerCentrosCostos,
		obtenerTiposTransporte,
		obtenerTiposServicio,
		obtenerTiposAplicacion,
		obtenerTiposCalculo,
		obtenerTiposCarga,
		obtenerClasificacionesCarga,
		obtenerIncoterms,
		obtenerTiposPago,
		obtenerPaises,
		obtenerTiposPuntoEnlace,
		obtenerPuntosEnlace,
		obtenerMonedas,
		obtenerCarriers,
		obtenerTiposSeguimiento
    } = useFetchersCatalogosCotizacion();

	const ensureArray = (val) => Array.isArray(val) ? val : [];
	const [catalogos, setCatalogos] = useState({
		empresas: ensureArray(empresas),
		centrosCostos: ensureArray(centrosCostos),
		rubros: ensureArray(rubros),
		tiposServicio: ensureArray(tiposServicio),
		tiposTransporte: ensureArray(tiposTransporte),
		tiposAplicacion: ensureArray(tiposAplicacion),
		proveedores: ensureArray(proveedores),
		tiposCalculo: ensureArray(tiposCalculo),
		estados: ensureArray(estados),
		tiposTarifa: ensureArray(tiposTarifa),
		tiposMetodo: ensureArray(tiposMetodo),
		tiposCarga: ensureArray(tiposCarga),
		clasificacionesCarga: ensureArray(clasificacionesCarga),
		incoterms: ensureArray(incoterms),
		tiposPago: ensureArray(tiposPago),
		paises: ensureArray(paises),
		tiposPuntoEnlace: ensureArray(tiposPuntoEnlace),
		puntosEnlace: ensureArray(puntosEnlace),
		monedas: ensureArray(monedas),
		carriers: ensureArray(carriers),
		tiposSeguimiento: ensureArray(tiposSeguimiento)
	});

	const { data: dataProveedores, isLoading: isLoadingProveedores } = useFetchAllEntidades(
		['proveedores'], 
		{ cod_estado: CODS_ESTADOS.ACTIVO }, 
		{}, 
		[NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_PROVEEDOR], NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR]],
	);

	const { data: dataClientes, isLoading: isLoadingClientes } = useFetchAllEntidades(
		['clientes'], 
		{ cod_estado: CODS_ESTADOS.ACTIVO }, 
		{}, 
		[NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_CLIENTE], NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE]],
	);


	const [isLoading, setIsLoading] = useState(false);


	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const [empresas, centrosCostos, rubros, tiposTransporte, tiposServicio, tiposAplicacion, tiposCalculo, tiposCarga, clasificacionesCarga, tiposPago, incoterms, paises, tiposPuntoEnlace, puntosEnlace, monedas, carriers, tiposSeguimiento] = await Promise.all([
					obtenerEmpresas(catalogos.empresas),
					obtenerCentrosCostos(catalogos.centrosCostos),
					obtenerRubros(catalogos.rubros),
					obtenerTiposTransporte(catalogos.tiposTransporte),
					obtenerTiposServicio(catalogos.tiposServicio),
					obtenerTiposAplicacion(catalogos.tiposAplicacion),
					obtenerTiposCalculo(catalogos.tiposCalculo),
					obtenerTiposCarga(catalogos.tiposCarga),
					obtenerClasificacionesCarga(catalogos.clasificacionesCarga),
					obtenerTiposPago(catalogos.tiposPago),
					obtenerIncoterms(catalogos.incoterms),
					obtenerPaises(catalogos.paises),
					obtenerTiposPuntoEnlace(catalogos.tiposPuntoEnlace),
					obtenerPuntosEnlace(catalogos.puntosEnlace),
					obtenerMonedas(catalogos.monedas),
					obtenerCarriers(catalogos.carriers),
					obtenerTiposSeguimiento(catalogos.tiposSeguimiento)
				]);


				setCatalogos(prev  => ({ 
					...prev,
					empresas, 
					centrosCostos,
					rubros,
					incoterms,
					estados,
					tiposServicio: tiposServicio,
					tiposTransporte: tiposTransporte,
					tiposAplicacion: tiposAplicacion,
					tiposCalculo: tiposCalculo,
					tiposTarifa: tiposTransporte,
					tiposMetodo: tiposMetodo,
					tiposCarga: tiposCarga,
					clasificacionesCarga: clasificacionesCarga,
					tiposPago: tiposPago,
					paises,
					tiposPuntoEnlace,
					puntosEnlace,
					monedas,
					carriers,
					tiposSeguimiento
				}));
			} catch (error) {
				console.error('Error al cargar los catálogos de tarifas:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	useEffect(() => {
		const catalogoProveedores = dataProveedores?.data || [];
		const proveedoresConFormatoUI = catalogoProveedores.map(proveedor => ({
			label: `${proveedor.codigo_entidad} - ${proveedor.entidad_nombre}`,
			value: +proveedor.entidad_id,
			...proveedor
		}));

		setCatalogos(prev => ({
			...prev,
			proveedores: proveedoresConFormatoUI
		}));
	}, [dataProveedores]);
	
	useEffect(() => {
		const catalogoClientes= dataClientes?.data || [];
		const clientesConFormatoUI = catalogoClientes.map(cliente => ({
			label: `${cliente.codigo_entidad} - ${cliente.entidad_nombre}`,
			value: +cliente.entidad_id,
			...cliente
		}));
		
		setCatalogos(prev => ({
			...prev,
			clientes: clientesConFormatoUI
		}));
	}, [dataClientes]);

	return {
		...catalogos,
		isLoading: isLoading || isLoadingProveedores || isLoadingClientes,
		setCatalogos
	};
};


export default useCatalogosCotizacion;
