import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Icon } from '@mui/material';
import { api } from '../../../api';
import { decryptId } from '../../../api/encryptDecrypt';
import TabComponent from '../../../components/Tabs/TabComponent';
import FormularioAgrupacionRubros from '../../../views/Tarifas/AgrupacionesRubros/FormularioAgrupacionRubros/FormularioAgrupacionRubros';
import useObtenerOpcionesAcciones from '../../../hooks/useObtenerOpcionesAcciones';
import { useDispatch } from 'react-redux';
import { encenderCarga, apagarCarga } from '../../../store/slices/status/statusSlice';


const VistaAgrupacionRubros = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { encryptedId } = useParams();
    const [cod_grupo_rubro, setCodAgrupoRubros] = useState(decryptId(encryptedId));
    const { catalogoArray: opcionesAgrupacionesRubros } = useObtenerOpcionesAcciones();
    const isItCreating = cod_grupo_rubro === 'new';
    const isItEditing = !isItCreating;

    const [agrupacionRubros, setAgrupacionRubros] = useState(null);
    const [catalogos, setCatalogos] = useState({
        empresas: [],
        centrosCostos: [],
        tiposTransporte: [],
        tiposServicio: [],
        rubros: [],
        estados: []
    });

    const obtenerAgrupacionRubros = useCallback(async () => {
        if (cod_grupo_rubro === 'new') return null
        const baseApiURL = `/api/appweb/lista-grupos-rubros`;
        const response = await api.get(baseApiURL, { params: { cod_grupo_rubro } });
        let [agrupacionRubros] = response.data.data;
        agrupacionRubros = { ...agrupacionRubros, label: agrupacionRubros.nombre, value: agrupacionRubros.cod_grupo_rubro };
        return agrupacionRubros;
    }, [cod_grupo_rubro]);

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
        incoterms = incoterms.map(i => ({ ...i, label: i.nombre, value: i.incoterm_id }));
        return incoterms;
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
                const [agrupacionRubros, empresas, centrosCostos, tiposPorTabla, incoterms, rubros, estados] = await Promise.all([
                    obtenerAgrupacionRubros(),
                    obtenerEmpresas(),
                    obtenerCentrosCostos(),
                    obtenerTiposPorTabla(),
                    obtenerIncoterms(),
                    obtenerRubros(),
                    obtenerEstados(),
                ]);
                setAgrupacionRubros(agrupacionRubros);
                setCatalogos({
                    empresas,
                    centrosCostos,
                    tiposTransporte: tiposPorTabla.TRANSPORTE,
                    tiposServicio: tiposPorTabla.SERVICIO,
                    tipoCarga: tiposPorTabla.TIPO_CARGA,
                    clasificacionCarga: tiposPorTabla.CLASIFICACION_CARGA,
                    tiposPago: tiposPorTabla.PAGO,
                    incoterms,
                    rubros,
                    estados
                });
            } catch (error) {
                console.error(error);
            } finally {
                dispatch(apagarCarga());
            }
        };
        obtenerDatosIniciales();
    }, [dispatch, obtenerAgrupacionRubros, obtenerEmpresas, obtenerCentrosCostos, obtenerTiposPorTabla, obtenerIncoterms, obtenerRubros, obtenerEstados]);


    const opcionesAgrupacionesRubrosConFormato = opcionesAgrupacionesRubros?.map((o) => {
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
                        <FormularioAgrupacionRubros
                            defaultValues={isItEditing ? agrupacionRubros : null}
                            isItCreating={isItCreating}
                            onAgrupacionRubrosCreada={grupo => setCodAgrupoRubros(grupo.cod_grupo_rubro)}
                            onAgrupacionRubrosEditada={grupo => setAgrupacionRubros(grupo)}
                            catalogos={catalogos}
                        />
                    );
                    break;
                default:
                    content = <>asdf</>;
                    break;
            }
            opcionConFormato.content = content;
        
            return opcionConFormato;
        }).filter((o) => o.nivel_opcion === 'I');

    const codigoOpcionInicial = opcionesAgrupacionesRubrosConFormato[0]?.id || null;


    return (
        <Box>
            <Button color='primary' sx={{ mb: 2 }} onClick={() => navigate(-1)}>
                <Icon className='c-derecha-arriba-izquierda' sx={{mr: 2}}/>
                Regresar a la lista
            </Button>

            <TabComponent
                opciones={opcionesAgrupacionesRubrosConFormato}
                tabInicial={codigoOpcionInicial}
            />
        </Box>
    );
};


export default VistaAgrupacionRubros;