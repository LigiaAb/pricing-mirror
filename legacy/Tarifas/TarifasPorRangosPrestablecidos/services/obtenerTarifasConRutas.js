import { api } from "../../../../api";
import { CODS_ESTADOS } from "../../../../constants/estados";

const CODS_METODOS = {
	RANGO: 101,
};

const CODS_TIPOS_RUTA = {
	ORIGEN: 113,
	DESTINO: 114,
};

const obtenerTarifasConRutas = async (filtros) => {	
	// Obtener las tarifas según los filtros proporcionados
	const getTarifasApiURL = '/api/appweb/lista-servicios';
	const filtrosTarifas = {
		cod_empresa: filtros.cod_empresa,
		cod_cc: filtros.cod_cc,
		cod_tipo_transporte: filtros.cod_tipo_transporte,
		cod_tipo_servicio: filtros.cod_tipo_servicio,
		cod_tipo_aplicacion: filtros.cod_tipo_aplicacion,
		cod_tipo_calculo: filtros.cod_tipo_calculo,
		cod_tipo_carga: filtros.cod_tipo_carga,
		cod_clasificacion_carga: filtros.cod_clasificacion_carga,
		incoterm_id: filtros.incoterm_id,
		cod_tipo_pago: filtros.cod_tipo_pago,
		cod_estado: CODS_ESTADOS.ACTIVO,
	};

	const responseTarifas = await api.get(getTarifasApiURL, { params: filtrosTarifas });
	let tarifas = responseTarifas.data.data;

	// generar peticiones para obtener los metodos de cada tarifa
	const getMetodosTarifasApiURL = '/api/appweb/lista-metodos';
	const peticionesMetodosTarifas = tarifas.map(tarifa => {
		return api.get(getMetodosTarifasApiURL, { params: { cod_servicio: tarifa.cod_servicio, cod_estado: CODS_ESTADOS.ACTIVO } })
	});
	let respuestasMetodosTarifas = await Promise.all(peticionesMetodosTarifas);

	// Filtrar las respuestas para obtener solo aquellas que si tengan un metodo
	respuestasMetodosTarifas = respuestasMetodosTarifas.filter(respuesta => respuesta.data.data.length > 0);
	let metodosTarifas = respuestasMetodosTarifas.map(respuesta => respuesta.data.data[0]).flat();

	// Filtrar los metodos de tarifa para obtener solo aquellos cuyo metodo de calculo a aplicar sea de tipo RANGO
	metodosTarifas = metodosTarifas.filter(metodo => metodo.cod_tipo === CODS_METODOS.RANGO);


	// Para cada metodo de tarifa, obtener las rutas asociadas
	for (const metodoTarifa of metodosTarifas) {	
		const getRutasTarifaApiURL = '/api/appweb/lista-tarifa-ruta';
		const responseRutasTarifa = await api.get(getRutasTarifaApiURL, { params: { cod_metodo: metodoTarifa.cod_metodo, cod_estado: CODS_ESTADOS.ACTIVO } });
		
		// Asignar las rutas obtenidas al metodo correpondiente
		const rutasTarifa = responseRutasTarifa.data.data;
		metodoTarifa.rutas = rutasTarifa;

		// Asignar el metodo obteneido a la tarifa correspondiente
		const tarifa = tarifas.find(t => t.cod_servicio === metodoTarifa.cod_servicio);
		tarifa.metodo = metodoTarifa;
	}

	// Filtrar aquellas tarifas que tengan metodo y en sus rutas tengan el origen y destino proporcionados en los filtros, o que aplicque a todos los destinos
	tarifas = tarifas.filter(tarifa => {
		if (!tarifa.metodo) {
			return false;
		}

		// Verificar que el origen de los filtros coincida con un punto de enlace de la ruta
		const coincideOrigen = tarifa.metodo.rutas.some(ruta => {
			if (filtros.cod_puntoenlace_origen) return ruta.cod_tipo_ruta === CODS_TIPOS_RUTA.ORIGEN && ruta.cod_puntoenlace === filtros.cod_puntoenlace_origen
			return ruta.cod_pais === filtros.cod_pais_origen;
		});

		// Verificar que el destino de los filtros coincida con un punto de enlace de la ruta
		const coincideDestino = tarifa.metodo.rutas.some(ruta => {
			if (filtros.cod_puntoenlace_destino) return ruta.cod_tipo_ruta === CODS_TIPOS_RUTA.DESTINO && ruta.cod_puntoenlace === filtros.cod_puntoenlace_destino
			return ruta.cod_pais === filtros.cod_pais_destino;
		});

	
		if (tarifa.metodo.todos_los_paises) {
			return !coincideOrigen && !coincideDestino;
		} else {
			return coincideOrigen && coincideDestino;
		}
	});

	return tarifas;
};


export default obtenerTarifasConRutas;