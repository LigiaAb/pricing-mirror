import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Icon } from '@mui/material';
import { api } from '../../../api';
import { encryptId, decryptId } from '../../../api/encryptDecrypt';
import TabComponent from '../../../components/Tabs/TabComponent';
import FormularioPlantilla from '../../../views/Tarifas/Plantillas/FormularioPlantilla/FormularioPlantilla';
import TablaAgrupacionesRubros from '../../../views/Tarifas/AgrupacionesRubros/TablaAgrupacionesRubros/TablaAgrupacionesRubros';
import useObtenerOpcionesAcciones from '../../../hooks/useObtenerOpcionesAcciones';
import { useDispatch } from 'react-redux';
import { encenderCarga, apagarCarga } from '../../../store/slices/status/statusSlice';


const CODS_ESTADOS = {
    ACTIVO: 1
};


const VistaPlantilla = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { encryptedId } = useParams();
    const [cod_tarifaplantilla, setCodTarifaPlantilla] = useState(decryptId(encryptedId));
    const { catalogoArray: opcionesPlantillas } = useObtenerOpcionesAcciones();
    const isItCreating = cod_tarifaplantilla === 'new';
    const isItEditing = !isItCreating;

    const [plantilla, setPlantilla] = useState(null);
    const [catalogos, setCatalogos] = useState({
        empresas: [],
        centrosCosto: [],
        tiposTransporte: [],
        tiposServicio: [],
        tiposCarga: [],
        clasificacionesCarga: [],
        incoterms: [],
        tiposPago: [],
        rubros: [],
        estados: [],
    });


    const obtenerPlantilla = useCallback(async () => {
        if (cod_tarifaplantilla === 'new') return null;
        const baseApiURL = `/api/appweb/lista-tarifa-plantilla`;
        const response = await api.get(baseApiURL, { params: { cod_tarifaplantilla } });
        let plantilla = response.data.data.find(p => p.cod_tarifaplantilla === +cod_tarifaplantilla);
        return plantilla;
    }, [cod_tarifaplantilla]);

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
                .filter(t => ['TRANSPORTE', 'SERVICIO', 'TIPO_CARGA', 'CLASIFICACION_CARGA', 'PAGO'].includes(t.tipo_tabla))
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

    const obtenerIncoterms = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-incoterm';
        const response = await api.get(baseApiURL);
        let incoterms = response.data.data;
        incoterms = incoterms.map(i => ({ ...i, label: `${i.codigo} - ${i.nombre_eng} (${i.nombre})`, value: i.incoterm_id }));
        return incoterms;
    }, []);

    const obtenerRubros = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-rubros';
        const response = await api.get(baseApiURL);
        let rubros = response.data.data;
        rubros = rubros.map(e => ({ ...e, label: e.nombre_rubro, value: e.cod_rubro, cod_estado: CODS_ESTADOS.ACTIVO }));
        return rubros;
    }, []);

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        let estados = response.data.data;
        estados = estados.map(e => ({ ...e, label: e.estado_desc, value: e.cod_estado }));
        return estados;
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
                const [plantilla, empresas, centrosCosto, tiposPorTabla, incoterms, rubros, estados, criterios] = await Promise.all([
                    obtenerPlantilla(),
                    obtenerEmpresas(),
                    obtenerCentrosCostos(),
                    obtenerTiposPorTabla(),
                    obtenerIncoterms(),
                    obtenerRubros(),
                    obtenerEstados(),
                    obtenerCriterios()
                ]);

                setPlantilla(plantilla);
                setCatalogos({
                    empresas,
                    centrosCosto,
                    tiposTransporte: tiposPorTabla.TRANSPORTE,
                    tiposServicio: tiposPorTabla.SERVICIO,
                    tiposCarga: tiposPorTabla.TIPO_CARGA,
                    clasificacionesCarga: tiposPorTabla.CLASIFICACION_CARGA,
                    tiposPago: tiposPorTabla.PAGO,
                    incoterms,
                    rubros,
                    criterios,
                    estados
                });
            } catch (error) {
                console.error(error);
            } finally {
                dispatch(apagarCarga());
            }
        };
        obtenerDatosIniciales();
    }, [dispatch, obtenerPlantilla, obtenerEmpresas, obtenerCentrosCostos, obtenerTiposPorTabla, obtenerIncoterms, obtenerRubros, obtenerCriterios, obtenerEstados]);


    const handleSubmitPlantilla = useCallback((plantilla) => {
        if (isItCreating) {
            navigate(`/tarifas/tarifa/plantillas-tarifas/${encryptId(plantilla.cod_tarifaplantilla)}`, { replace: true });
        } else {
            setPlantilla(plantilla);
        }
    }, [isItCreating, navigate]);


    const opcionesTabsPlantillasConFormato = opcionesPlantillas?.map((o) => {
        const opcionConFormato = {
            ...o,
            id: o.cod_opcion,
            label: o.nom_opcion,
            icono: o.ico_opcion,
            disabled: isItCreating && o.nom_opcion !== 'Información',
        };
    
        let content;
        switch (o.nom_opcion) {
            case 'Información':
                content = (
                    <FormularioPlantilla
                        defaultValues={isItEditing ? plantilla : null}
                        isItCreating={isItCreating}
                        onSubmit={handleSubmitPlantilla}
                        catalogos={catalogos}
                    />
                );
                break;
            case 'Grupos de Rubros':
                content = (
                    <TablaAgrupacionesRubros
                        defaultFilters={{
                            cod_empresa: plantilla?.cod_empresa,
                            cod_cc: plantilla?.cod_cc,
                            cod_tipo_transporte: plantilla?.cod_tipo_transporte,
                            cod_tipo_servicio: plantilla?.cod_tipo_servicio,
                        }}
                        cod_tarifaplantilla={cod_tarifaplantilla}
                        isItCreating={isItCreating}
                        onPlantillaEditada={plantilla => setPlantilla(plantilla)}
                        catalogos={{
                            ...catalogos
                        }}
                    />
                );
                break;
            default:
                content = <></>;
                break;
        }
        opcionConFormato.content = content;
    
        return opcionConFormato;
    }).filter((o) => o.nivel_opcion === 'I');

    const codigoOpcionInicial = opcionesTabsPlantillasConFormato[0]?.id || null;

    return (
        <Box>
            <Button color='primary' sx={{ mb: 2 }} onClick={() => navigate(-1)}>
                <Icon className='c-derecha-arriba-izquierda' sx={{mr: 2}}/>
                Regresar a la lista
            </Button>
            
            <TabComponent
                opciones={opcionesTabsPlantillasConFormato}
                tabInicial={codigoOpcionInicial}
            />
        </Box>
    );
};


export default VistaPlantilla;