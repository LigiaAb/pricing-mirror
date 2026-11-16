import { useCallback } from 'react';
import { api } from '../../../../../api';
import { dummyCarriers } from '../dummy/carriers';
import { tiposSeguimientoDummy } from '../dummy/tiposSeguimiento';

const CODS_ESTADOS = {
	ACTIVO: 1
};

const useFetchersCatalogosCotizacion = () => {
	const obtenerRubros = useCallback(async (rubrosProvistos = []) => {
		if (rubrosProvistos.length) return rubrosProvistos;
		const baseApiURL = '/api/appweb/lista-rubros';
		const response = await api.get(baseApiURL);
		let rubros = response.data.data;
		rubros = rubros.map(r => ({ ...r, label: r.nombre, value: r.cod_rubro }));
		return rubros;
	}, []);
	

	const obtenerEmpresas = useCallback(async (empresasProvistas = []) => {
		if (empresasProvistas.length) return empresasProvistas;
		const baseApiURL = '/api/appweb/listaempresas';
		const response = await api.get(baseApiURL, { params: { cod_estado: CODS_ESTADOS.ACTIVO } });
		let empresas = response.data.data;
		empresas = empresas.map(e => ({ ...e, label: e.nombre_emp, value: e.cod_empresa }));
		return empresas;
	}, []);


	const obtenerCentrosCostos = useCallback(async (centrosCostosProvistos = []) => {
		if (centrosCostosProvistos.length) return centrosCostosProvistos;
		const baseApiURL = '/api/appweb/listacentrocosto';
		const response = await api.get(baseApiURL);
		let centrosCostos = response.data.data;
		centrosCostos = centrosCostos.map(e => ({ ...e, label: e.nombre_cc, value: e.cod_cc }));
		return centrosCostos;
	}, []);


	const obtenerTiposTransporte = useCallback(async (tiposTransporteProvistos = []) => {
		if (tiposTransporteProvistos.length) return tiposTransporteProvistos;
		const baseApiURL = '/api/appweb/lista-tipo';
		const response = await api.get(baseApiURL, { params: { tipo_tabla: 'TRANSPORTE' } });
		let tiposTransporte = response.data.data;
		tiposTransporte = tiposTransporte.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
		return tiposTransporte;
	}, []);


	const obtenerTiposServicio = useCallback(async (tiposServicioProvistos = []) => {
		if (tiposServicioProvistos.length) return tiposServicioProvistos;
		const baseApiURL = '/api/appweb/lista-relacion-tipo';
		const response = await api.get(baseApiURL, { params: { tipo_tabla: 'SERVICIO' } });
		let tiposServicio = response.data.data;
		tiposServicio = tiposServicio.map(t => ({ ...t, label: t.tipo_desc, value: t.cod_tipo }));
		return tiposServicio;
	}, []);


	const obtenerTiposAplicacion = useCallback(async (tiposAplicacionProvistos = []) => {
		if (tiposAplicacionProvistos.length) return tiposAplicacionProvistos;
		const baseApiURL = '/api/appweb/lista-relacion-tipo';
		const response = await api.get(baseApiURL, { params: { tipo_tabla: 'APLICACION' } });
		let tiposAplicacion = response.data.data;
		tiposAplicacion = tiposAplicacion.map(t => ({ ...t, label: t.tipo_desc, value: t.cod_tipo }));
		return tiposAplicacion;
	}, []);


	const obtenerTiposCalculo = useCallback(async (tiposCalculoProvistos = []) => {
		if (tiposCalculoProvistos.length) return tiposCalculoProvistos;
		const baseApiURL = '/api/appweb/lista-relacion-tipo';
		const response = await api.get(baseApiURL, { params: { tipo_tabla: 'CALCULO' } });
		let tiposMetodo = response.data.data;
		tiposMetodo = tiposMetodo.map(t => ({ ...t, label: t.tipo_desc, value: t.cod_tipo }));
		return tiposMetodo;
	}, []);


	const obtenerTiposCarga = useCallback(async (tiposCargaProvistos = []) => {
		if (tiposCargaProvistos.length) return tiposCargaProvistos;
		const baseApiURL = '/api/appweb/lista-tipo';
		const response = await api.get(baseApiURL, { params: { tipo_tabla: 'TIPO_CARGA' } });
		let tiposCarga = response.data.data;
		tiposCarga = tiposCarga.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
		return tiposCarga;
	}, []);


	const obtenerClasificacionesCarga = useCallback(async (clasificacionesCargaProvistas = []) => {
		if (clasificacionesCargaProvistas.length) return clasificacionesCargaProvistas;
		const baseApiURL = '/api/appweb/lista-tipo';
		const response = await api.get(baseApiURL, { params: { tipo_tabla: 'CLASIFICACION_CARGA' } });
		let clasificacionesCarga = response.data.data;
		clasificacionesCarga = clasificacionesCarga.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
		return clasificacionesCarga;
	}, []);


	const obtenerIncoterms = useCallback(async (incotermsProvistos = []) => {
		if (incotermsProvistos.length > 0) return incotermsProvistos;
		const baseApiURL = '/api/appweb/lista-incoterm';
		const response = await api.get(baseApiURL);
		let incoterms = response.data.data;
		incoterms = incoterms.map(i => ({ ...i, label: `${i.codigo} - ${i.nombre_eng} (${i.nombre})`, value: i.incoterm_id }));
		return incoterms;
	}, []);


	const obtenerTiposPago = useCallback(async (tiposPagoProvistos = []) => {
		if (tiposPagoProvistos.length) return tiposPagoProvistos;
		const baseApiURL = '/api/appweb/lista-tipo';
		const response = await api.get(baseApiURL, { params: { tipo_tabla: 'PAGO' } });
		let tiposPago = response.data.data;
		tiposPago = tiposPago.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
		return tiposPago;
	}, []);


	const obtenerEstados = useCallback(async (estadosProvistos = []) => {
		if (estadosProvistos.length > 0) return estadosProvistos;
		const baseApiURL = '/api/appweb/listaestados';
		const response = await api.get(baseApiURL);
		let estados = response.data.data;
		estados = estados.map(e => ({ ...e, label: e.estado_desc, value: e.cod_estado }));
		return estados;
	}, []);


	const obtenerTipos = useCallback(async (tiposProvistos = {}) => {
		// const tieneTipos = Object.values(tiposProvistos).every(val => Array.isArray(val) && val.length > 0);
		// if (tieneTipos) return tiposProvistos;

		const obtenerTiposURL = '/api/appweb/lista-tipo';
		const responseTipos = await api.get(obtenerTiposURL);
		let tipos = responseTipos.data.data;
		tipos = tipos
				.filter(t => ['SERVICIO', 'TRANSPORTE', 'APLICACION', 'CALCULO', 'TARIFA', 'METODO', 'TIPO_CARGA', 'CLASIFICACION_CARGA', 'PAGO'].includes(t.tipo_tabla))
				.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));

		const obtenerRelacionesTiposURL = '/api/appweb/lista-relacion-tipo'
		const responseRealcionesTipos = await api.get(obtenerRelacionesTiposURL);
		const relacionesTipos = responseRealcionesTipos.data.data;

		for (let tipo of tipos) {
			tipo.codsTiposPadres = relacionesTipos.filter(rt => rt.cod_tipo === tipo.cod_tipo).map(rt => rt.cod_tipo_padre);
		}

		// Tipos Agrupados por su Tipo de Tabla
		tipos = tipos.reduce((tipos, tipo) => {
			if (!tipos[tipo.tipo_tabla]) {
				tipos[tipo.tipo_tabla] = [];
			}
			tipos[tipo.tipo_tabla].push(tipo);
			return tipos;
		}, {});
		return tipos;
	}, []);


	const obtenerTiposMetodo = useCallback(async (tiposMetodoProvistos = []) => {
		if (tiposMetodoProvistos.length) return tiposMetodoProvistos;
		const baseApiURL = '/api/appweb/lista-tipo';
		const response = await api.get(baseApiURL, { params: { tipo_tabla: 'METODO' } });
		let tiposMetodo = response.data.data;
		tiposMetodo = tiposMetodo.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
		return tiposMetodo;
	}, []);


	const obtenerCommodities = useCallback(async (commoditiesProvistos = []) => {
		if (commoditiesProvistos.length > 0) return commoditiesProvistos;
		const baseApiURL = '/api/appweb/lista-commodities';
		const response = await api.get(baseApiURL);
		let commodities = response.data.data;
		commodities = commodities.map(c => ({ ...c, label: c.nombre, value: c.cod_commodity }));
		return commodities;
	}, []);


	const obtenerPaises = useCallback(async (paisesProvistos) => {
		if (paisesProvistos.length) return paisesProvistos;
		const baseApiURL = '/api/appweb/listapaises';
		const response = await api.get(baseApiURL);
		let paises = response.data.data;
		paises = paises.map(p => ({ ...p, label: p.nombre_pais, value: p.cod_pais }));
		return paises;
	}, []);


	const obtenerTiposPuntoEnlace = useCallback(async (tiposPuntoEnlaceProvistos) => {
		if (tiposPuntoEnlaceProvistos.length) return tiposPuntoEnlaceProvistos;
		const baseApiURL = '/api/appweb/lista-tipo';
		const response = await api.get(baseApiURL, { params: { tipo_tabla: 'PUNTO_ENLACE' } });
		let tiposPuntoEnlace = response.data.data;
		tiposPuntoEnlace = tiposPuntoEnlace.map(tpe => ({ ...tpe, label: tpe.nom_tipo, value: tpe.cod_tipo }));
		return tiposPuntoEnlace;
	}, []);


	const obtenerPuntosEnlace = useCallback(async (puntosEnlaceProvistos) => {
		if (puntosEnlaceProvistos.length) return puntosEnlaceProvistos;
		const baseApiURL = '/api/appweb/lista-punto_enlace';
		const response = await api.get(baseApiURL);
		let puntosEnlace = response.data.data;
		puntosEnlace = puntosEnlace.map(pe => ({ ...pe, label: pe.nombre, value: pe.cod_puntoenlace }));
		return puntosEnlace;
	}, []);


	const obtenerMonedas = useCallback(async (monedasProvistas = []) => {
		if (monedasProvistas.length) return monedasProvistas;
		const baseApiURL = '/api/appweb/lista-moneda';
		const response = await api.get(baseApiURL);
		let monedas = response.data.data;
		monedas = monedas.map(m => ({ ...m, label: m.nom_moneda, value: m.cod_moneda }));
		return monedas;
	}, []);


	const obtenerCarriers = useCallback(async (carriersProvistos = []) => {
		if (carriersProvistos.length) return carriersProvistos;
		// const baseApiURL = '/api/appweb/lista-carrier';
		// const response = await api.get(baseApiURL);
		// let carriers = response.data.data;
		let carriers = dummyCarriers;
		carriers = carriers.map(c => ({ ...c, label: c.nombre, value: c.cod_carrier }));
		return carriers;
	}, []);


	const obtenerTiposSeguimiento = useCallback(async (tiposSeguimientoProvistos = []) => {
		if (tiposSeguimientoProvistos.length) return tiposSeguimientoProvistos;
		// const baseApiURL = '/api/appweb/lista-tipo-seguimiento';
		// const response = await api.get(baseApiURL);
		// let tiposSeguimiento = response.data.data;
		let tiposSeguimiento = tiposSeguimientoDummy;
		tiposSeguimiento = tiposSeguimiento.map(ts => ({ ...ts, label: ts.nom_tipo, value: ts.cod_tipo }));
		return tiposSeguimiento;
	}, []);


	return {
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
		obtenerEstados,
		obtenerTipos,
		obtenerTiposMetodo,
		obtenerCommodities,
		obtenerPaises,
		obtenerTiposPuntoEnlace,
		obtenerPuntosEnlace,
		obtenerMonedas,
		obtenerCarriers,
		obtenerTiposSeguimiento
	};
};


export default useFetchersCatalogosCotizacion;