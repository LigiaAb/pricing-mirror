import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../api';
import TablaAgrupacionesRubros from '../../../views/Tarifas/AgrupacionesRubros/TablaAgrupacionesRubros/TablaAgrupacionesRubros';
import { useDispatch } from 'react-redux';
import { encenderCarga, apagarCarga } from '../../../store/slices/status/statusSlice';


const ListaAgrupacionesRubros = () => {
    const dispatch = useDispatch();

    const [catalogos, setCatalogos] = useState({
        empresas: [],
        centrosCostos: [],
        tiposTransporte: [],
        tiposServicio: [],
        rubros: [],
        estados: []
    });


    const obtenerEmpresas = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaempresas';
        const response = await api.get(baseApiURL);
        let empresas = response.data.data;
        empresas = empresas.map(e => ({ ...e, label: e.nombre_emp, value: e.cod_empresa }));
        return empresas;
    }, []);

    const obtenerCentrosCostos = useCallback(async () => {
        const baseApiURL = '/api/appweb/listacentrocosto';
        const response = await api.get(baseApiURL);
        let centrosCostos = response.data.data;
        centrosCostos = centrosCostos.map(e => ({ ...e, label: e.nombre_cc, value: e.cod_cc }));
        return centrosCostos;
    }, []);

    const obtenerTiposPorTabla = useCallback(async () => {
        const obtenerTiposPorTablaURL = '/api/appweb/lista-tipo';
        const responseTipos = await api.get(obtenerTiposPorTablaURL);
        let tipos = responseTipos.data.data;
        tipos = tipos
                .filter(t => ['TRANSPORTE', 'SERVICIO'].includes(t.tipo_tabla))
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

    const obtenerRubros = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-rubros';
        const response = await api.get(baseApiURL);
        let rubros = response.data.data;
        rubros = rubros.map(r => ({ ...r, label: r.nombre, value: r.cod_rubro }));
        return rubros;
    }, []);

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
                const [empresas, centrosCostos, tiposPorTabla, rubros, estados] = await Promise.all([
                    obtenerEmpresas(),
                    obtenerCentrosCostos(),
                    obtenerTiposPorTabla(),
                    obtenerRubros(),
                    obtenerEstados(),
                ]);

                setCatalogos({
                    empresas,
                    centrosCostos,
                    tiposTransporte: tiposPorTabla.TRANSPORTE,
                    tiposServicio: tiposPorTabla.SERVICIO,
                    rubros,
                    estados
                });
            } catch (error) {
                console.error('Error al obtener los datos iniciales:', error);
            } finally {
                dispatch(apagarCarga());
            }
        };

        obtenerDatosIniciales();
    }, [dispatch, obtenerEmpresas, obtenerCentrosCostos, obtenerTiposPorTabla, obtenerRubros, obtenerEstados]);


    return (
        <TablaAgrupacionesRubros
            catalogos={catalogos}
        />
    );
};


export default ListaAgrupacionesRubros;