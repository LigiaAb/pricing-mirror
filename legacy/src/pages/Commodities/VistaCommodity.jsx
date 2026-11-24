import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Icon } from '@mui/material';
import { api } from '../../api';
import { decryptId } from '../../api/encryptDecrypt';
import TabComponent from '../../components/Tabs/TabComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import FormularioCommodity from '../../components/Commodities/FormularioCommodity';
import { useDispatch } from 'react-redux';
import { encenderCarga, apagarCarga } from '../../store/slices/status/statusSlice';


const VistaCommodity = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { encryptedId } = useParams();
    const [cod_commodity, setCodCommodity] = useState(decryptId(encryptedId));
    const { catalogoArray: opcionesCommodities } = useObtenerOpcionesAcciones();

    const isItCreating = cod_commodity === 'new';
    const isItEditing = !isItCreating;

    const [commodity, setCommodity] = useState(null);
    const [catalogos, setCatalogos] = useState({
        estados: []
    });

    const obtenerCommodity = useCallback(async () => {
        const baseApiURL = `/api/appweb/lista-commodities`;
        const response = await api.get(baseApiURL, { params: { cod_commodity } });
        const commodity = response.data.data[0] || null;
        return commodity;
    }, [cod_commodity]);

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
                const [estados] = await Promise.all([
                    obtenerEstados(),
                ]);
                
                setCatalogos({
                    estados
                });

                if (isItEditing) {
                    const commodity = await obtenerCommodity();
                    setCommodity(commodity);
                }
            } catch (error) {
                console.error(error);
            } finally {
                dispatch(apagarCarga());
            }
        };

        obtenerDatosIniciales();
    }, [dispatch, isItEditing, obtenerCommodity, obtenerEstados]);

    const opcionesCommoditiesConFormato = opcionesCommodities?.map((o) => {
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
                    <FormularioCommodity
                        defaultValues={isItEditing ? commodity : null}
                        isItCreating={isItCreating}
                        onCommodityCreado={commodity => setCodCommodity(commodity.cod_commodity)}
                        onCommodityEditado={commodity => setCommodity(commodity)}
                        catalogos={catalogos}
                    />
                );
                break;
            default:
                content = <></>
                break;
        }
        opcionConFormato.content = content;
    
        return opcionConFormato;
    }).filter((o) => o.nivel_opcion === 'I');

    const codigoOpcionInicial = opcionesCommoditiesConFormato[0]?.id || null;

    return (
        <Box>
            <Button color='primary' sx={{ mb: 2 }} onClick={() => navigate(-1)}>
                <Icon className='c-derecha-arriba-izquierda' sx={{mr: 2}}/>
                Regresar a la lista
            </Button>

            <TabComponent
                opciones={opcionesCommoditiesConFormato}
                tabInicial={codigoOpcionInicial}
            />
        </Box>
    );
};


export default VistaCommodity;