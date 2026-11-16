import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../api';
import TablaPlantillas from '../../../views/Tarifas/Plantillas/TablaPlantillas/TablaPlantillas';
import { useDispatch } from 'react-redux';
import { encenderCarga, apagarCarga } from '../../../store/slices/status/statusSlice';


const ListaPlantillas = () => {
    const dispatch = useDispatch();

    const [catalogos, setCatalogos] = useState({
        empresas: [],
        centrosCostos: [],
        tiposTransporte: [],
        tiposServicio: [],
        estados: [],
        rubros: [],
        criterios: []
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
        const obtenerTiposURL = '/api/appweb/lista-tipo';
        const responseTipos = await api.get(obtenerTiposURL);
        let tipos = responseTipos.data.data;
        tipos = tipos
                .filter(t => ['TRANSPORTE', 'SERVICIO'].includes(t.tipo_tabla))
                .map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));

        const obtenerRelacionesTiposURL = '/api/appweb/lista-relacion-tipo'
        const responseRealcionesTipos = await api.get(obtenerRelacionesTiposURL);
        const relacionesTipos = responseRealcionesTipos.data.data;

        for (let tipo of tipos) {
            tipo.cod_tipo_padre = relacionesTipos.find(rt => rt.cod_tipo === tipo.cod_tipo)?.cod_tipo_padre || null;
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

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        let estados = response.data.data;
        estados = estados.map(e => ({ ...e, label: e.estado_desc, value: e.cod_estado }));
        return estados;
    }, []);

    const obtenerRubros = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-rubros';
        const response = await api.get(baseApiURL);
        let rubros = response.data.data;
        rubros = rubros.map(r => ({ ...r, label: r.nombre, value: r.cod_rubro }));
        return rubros;
    }, []);

    const obtenerCriterios = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-criterios';
        const response = await api.get(baseApiURL);
        let criterios = response.data.data;
        return criterios;
    }, []);


    useEffect(() => {
        const obtenerDatosIniciales = async () => {
            dispatch(encenderCarga());
            try {
                const [empresas, centrosCostos, tiposPorTabla, estados, rubros, criterios] = await Promise.all([
                    obtenerEmpresas(),
                    obtenerCentrosCostos(),
                    obtenerTiposPorTabla(),
                    obtenerEstados(),
                    obtenerRubros(),
                    obtenerCriterios()
                ]);

                setCatalogos({ 
                    empresas,
                    centrosCostos,
                    tiposTransporte: tiposPorTabla.TRANSPORTE,
                    tiposServicio: tiposPorTabla.SERVICIO,
                    estados,
                    rubros,
                    criterios
                });
            } catch (error) {
                console.error(error);
            } finally {
                dispatch(apagarCarga());
            }
        };

        obtenerDatosIniciales();
    }, [dispatch, obtenerEmpresas, obtenerCentrosCostos, obtenerTiposPorTabla, obtenerEstados, obtenerRubros, obtenerCriterios]);


    return (
        <TablaPlantillas
            catalogos={catalogos}
        />
    );
};


export default ListaPlantillas;