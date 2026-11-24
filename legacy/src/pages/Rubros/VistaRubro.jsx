import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Icon } from '@mui/material';
import { api } from '../../api';
import { decryptId } from '../../api/encryptDecrypt';
import TabComponent from '../../components/Tabs/TabComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import FormularioRubro from '../../components/Rubros/FormularioRubro';
import GridNombresRubros from '../../components/Rubros/GridNombresRubros';
import GridIdentificacionesRubros from '../../components/Rubros/GridIdentificacionesRubros';
import GridCentrosCostosRubros from '../../components/Rubros/GridCentrosCostosRubros';
import { useDispatch } from 'react-redux';
import { encenderCarga, apagarCarga } from '../../store/slices/status/statusSlice';
import { CODS_ESTADOS } from '../../constants/estados';


const VistaRubro = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { encryptedId } = useParams();
    const [cod_rubro, setCodRubro] = useState(decryptId(encryptedId));
    const { catalogoArray: opcionesRubros } = useObtenerOpcionesAcciones();
    
    const isItCreating = cod_rubro === 'new';
    const isItEditing = !isItCreating;

    const [rubro, setRubro] = useState(null);
    const [catalogos, setCatalogos] = useState({
        tiposIdentificaciones: [],
        empresas: [],
        centrosCostos: [],
        estados: [],
    });

    const obtenerRubro = useCallback(async () => {
        const baseApiURL = `/api/appweb/lista-rubros`;
        const response = await api.get(baseApiURL, { params: { cod_rubro } });
        const rubro = response.data.data[0] || null;
        return rubro;
    }, [cod_rubro]);

    const obtenerTiposIdentificaciones = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL, { params: { tipo_tabla: 'RUBRO_IDENTIFICACION', cod_estado: CODS_ESTADOS.ACTIVO } });
        let tiposIdentificaciones = response.data.data;
        tiposIdentificaciones = tiposIdentificaciones.map(e => ({ ...e, label: e.nom_tipo, value: e.cod_tipo }));
        return tiposIdentificaciones;
    }, []);

    const obtenerEmpresas = useCallback(async () => {
        const baseApiURL = `/api/appweb/listaempresas`;
        const response = await api.get(baseApiURL);
        let empresas = response.data.data;
        empresas = empresas.map(e => ({ ...e, label: e.nombre_emp, value: e.cod_empresa }));
        return empresas;
    }, []);

    const obtenerCentrosCostos = useCallback(async () => {
        const baseApiURL = `/api/appweb/listacentrocosto`;
        const response = await api.get(baseApiURL);
        let centrosCostos = response.data.data;
        centrosCostos = centrosCostos.map(e => ({ ...e, label: e.nombre_cc, value: e.cod_cc }));
        return centrosCostos;
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
                const [tiposIdentificaciones, empresas, centrosCostos, estados] = await Promise.all([
                    obtenerTiposIdentificaciones(),
                    obtenerEmpresas(),
                    obtenerCentrosCostos(),
                    obtenerEstados(),
                ]);
                
                setCatalogos({
                    tiposIdentificaciones,
                    empresas,
                    centrosCostos,
                    estados
                });

                if (isItEditing) {
                    const rubro = await obtenerRubro();
                    setRubro(rubro);
                }
            } catch (error) {
                console.error(error);
            } finally {
                dispatch(apagarCarga());
            }
        };

        obtenerDatosIniciales();
    }, [dispatch, isItEditing, obtenerRubro, obtenerEmpresas, obtenerCentrosCostos, obtenerEstados]);

    const opcionesRubrosConFormato = opcionesRubros?.map((o) => {
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
                    <FormularioRubro
                        defaultValues={isItEditing ? rubro : null}
                        isItCreating={isItCreating}
                        onRubroCreado={rubro => setCodRubro(rubro.cod_rubro)}
                        onRubroEditado={rubro => setRubro(rubro)}
                        catalogos={catalogos}
                    />
                )
                break;
            case 'Nombres':
                content = <GridNombresRubros cod_rubro={cod_rubro} catalogos={catalogos} />
                break;
            case 'Identificaciones':
                content = <GridIdentificacionesRubros cod_rubro={cod_rubro} catalogos={catalogos} />
                break;
            case 'Centros de Costos':
                content = <GridCentrosCostosRubros cod_rubro={cod_rubro} catalogos={catalogos} />
                break;
            default:
                content = <></>
                break;
        }
        opcionConFormato.content = content;
    
        return opcionConFormato;
    }).filter((o) => o.nivel_opcion === 'I');

    const codigoOpcionInicial = opcionesRubrosConFormato[0]?.id || null;

    return (
        <Box>
            <Button color='primary' sx={{ mb: 2 }} onClick={() => navigate(-1)}>
                <Icon className='c-derecha-arriba-izquierda' sx={{mr: 2}}/>
                Regresar a la lista
            </Button>
            
            <TabComponent
                opciones={opcionesRubrosConFormato}
                tabInicial={codigoOpcionInicial}
            />
        </Box>
    );
};


export default VistaRubro;